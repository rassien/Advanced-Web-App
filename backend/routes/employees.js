const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool, getNearestBranches } = require('../models/database');
const geocodingService = require('../services/geocoding');
const auth = require('../middleware/auth');
const { uploadWithErrorHandling } = require('../middleware/upload');
const { 
  parseExcelBuffer, 
  validateEmployeeData, 
  EMPLOYEE_COLUMN_MAPPING 
} = require('../utils/excelParser');

const router = express.Router();

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        ad, 
        soyad, 
        tckn,
        acik_adres,
        ST_X(konum) as longitude,
        ST_Y(konum) as latitude,
        created_at,
        updated_at
      FROM calisanlar 
      ORDER BY ad, soyad
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id, 
        ad, 
        soyad, 
        tckn,
        acik_adres,
        ST_X(konum) as longitude,
        ST_Y(konum) as latitude,
        created_at,
        updated_at
      FROM calisanlar 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee
router.post('/', 
  auth,
  [
    body('ad').trim().notEmpty().withMessage('First name is required'),
    body('soyad').trim().notEmpty().withMessage('Last name is required'),
    body('tckn').optional().isLength({ min: 11, max: 11 }).withMessage('TCKN must be 11 digits'),
    body('acik_adres').trim().notEmpty().withMessage('Address is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ad, soyad, tckn, acik_adres } = req.body;
      
      // Geocode the address
      let coordinates = null;
      try {
        const geocodeResult = await geocodingService.geocodeAddress(acik_adres);
        coordinates = geocodeResult;
      } catch (geocodeError) {
        console.warn('Geocoding failed for address:', acik_adres, geocodeError.message);
      }

      const result = await pool.query(`
        INSERT INTO calisanlar (ad, soyad, tckn, acik_adres, konum)
        VALUES ($1, $2, $3, $4, ${coordinates ? 'ST_SetSRID(ST_MakePoint($6, $5), 4326)' : 'NULL'})
        RETURNING id, ad, soyad, tckn, acik_adres,
                  ST_X(konum) as longitude, 
                  ST_Y(konum) as latitude,
                  created_at
      `, coordinates ? 
        [ad, soyad, tckn, acik_adres, coordinates.lat, coordinates.lng] : 
        [ad, soyad, tckn, acik_adres]
      );

      res.status(201).json({
        message: 'Employee created successfully',
        employee: result.rows[0],
        geocoded: !!coordinates
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      if (error.code === '23505') { // Unique violation (TCKN)
        res.status(400).json({ error: 'TCKN already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create employee' });
      }
    }
  }
);

// Update employee
router.put('/:id',
  auth,
  [
    body('ad').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('soyad').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('tckn').optional().isLength({ min: 11, max: 11 }).withMessage('TCKN must be 11 digits'),
    body('acik_adres').optional().trim().notEmpty().withMessage('Address cannot be empty')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { ad, soyad, tckn, acik_adres } = req.body;

      // Check if employee exists
      const existingEmployee = await pool.query('SELECT * FROM calisanlar WHERE id = $1', [id]);
      if (existingEmployee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      let updateQuery = 'UPDATE calisanlar SET updated_at = CURRENT_TIMESTAMP';
      let values = [];
      let paramIndex = 1;

      if (ad !== undefined) {
        updateQuery += `, ad = $${paramIndex}`;
        values.push(ad);
        paramIndex++;
      }

      if (soyad !== undefined) {
        updateQuery += `, soyad = $${paramIndex}`;
        values.push(soyad);
        paramIndex++;
      }

      if (tckn !== undefined) {
        updateQuery += `, tckn = $${paramIndex}`;
        values.push(tckn);
        paramIndex++;
      }

      if (acik_adres !== undefined) {
        // If address is being updated, try to geocode it
        let coordinates = null;
        try {
          const geocodeResult = await geocodingService.geocodeAddress(acik_adres);
          coordinates = geocodeResult;
        } catch (geocodeError) {
          console.warn('Geocoding failed for updated address:', acik_adres, geocodeError.message);
        }

        updateQuery += `, acik_adres = $${paramIndex}`;
        values.push(acik_adres);
        paramIndex++;

        if (coordinates) {
          updateQuery += `, konum = ST_SetSRID(ST_MakePoint($${paramIndex + 1}, $${paramIndex}), 4326)`;
          values.push(coordinates.lat, coordinates.lng);
          paramIndex += 2;
        }
      }

      updateQuery += ` WHERE id = $${paramIndex} RETURNING id, ad, soyad, tckn, acik_adres, ST_X(konum) as longitude, ST_Y(konum) as latitude, updated_at`;
      values.push(id);

      const result = await pool.query(updateQuery, values);

      res.json({
        message: 'Employee updated successfully',
        employee: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      if (error.code === '23505') { // Unique violation (TCKN)
        res.status(400).json({ error: 'TCKN already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update employee' });
      }
    }
  }
);

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee has assignments
    const assignmentCheck = await pool.query('SELECT COUNT(*) FROM atamalar WHERE calisan_id = $1', [id]);
    if (parseInt(assignmentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete employee with existing assignments',
        assignmentCount: assignmentCheck.rows[0].count
      });
    }

    const result = await pool.query('DELETE FROM calisanlar WHERE id = $1 RETURNING ad, soyad', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ 
      message: 'Employee deleted successfully',
      deletedEmployee: `${result.rows[0].ad} ${result.rows[0].soyad}`
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Get nearest branches for an employee
router.get('/:id/en-yakin-subeler', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { n = 5 } = req.query;

    // Check if employee exists and has location
    const employee = await pool.query(
      'SELECT id, ad, soyad, konum FROM calisanlar WHERE id = $1', 
      [id]
    );
    
    if (employee.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (!employee.rows[0].konum) {
      return res.status(400).json({ 
        error: 'Employee address not geocoded. Cannot calculate distances.' 
      });
    }

    // Get nearest branches using PostGIS
    const nearestBranches = await getNearestBranches(id, parseInt(n));

    // Enhance with Google Distance Matrix for accurate travel time/distance
    if (nearestBranches.length > 0) {
      try {
        const employeeCoords = await pool.query(
          'SELECT ST_X(konum) as lng, ST_Y(konum) as lat FROM calisanlar WHERE id = $1',
          [id]
        );
        
        const origins = [`${employeeCoords.rows[0].lat},${employeeCoords.rows[0].lng}`];
        const destinations = nearestBranches.map(branch => `${branch.latitude},${branch.longitude}`);
        
        const distanceMatrix = await geocodingService.getDistanceMatrix(origins, destinations);
        
        // Merge PostGIS results with Google distance matrix
        if (distanceMatrix && distanceMatrix[0]) {
          nearestBranches.forEach((branch, index) => {
            const matrixData = distanceMatrix[0][index];
            if (matrixData && matrixData.status === 'OK') {
              branch.road_distance_km = matrixData.distance ? (matrixData.distance.value / 1000) : null;
              branch.travel_time_minutes = matrixData.duration ? Math.round(matrixData.duration.value / 60) : null;
            }
          });
        }
      } catch (distanceError) {
        console.warn('Distance Matrix API failed, using PostGIS distances only:', distanceError.message);
      }
    }

    res.json({
      employee: {
        id: employee.rows[0].id,
        name: `${employee.rows[0].ad} ${employee.rows[0].soyad}`
      },
      nearestBranches,
      count: nearestBranches.length
    });

  } catch (error) {
    console.error('Error getting nearest branches:', error);
    res.status(500).json({ error: 'Failed to get nearest branches' });
  }
});

// Bulk create employees from Excel/JSON data
router.post('/bulk',
  auth,
  [
    body('employees').isArray().withMessage('Employees must be an array'),
    body('employees.*.ad').trim().notEmpty().withMessage('First name is required'),
    body('employees.*.soyad').trim().notEmpty().withMessage('Last name is required'),
    body('employees.*.acik_adres').trim().notEmpty().withMessage('Address is required'),
    body('employees.*.tckn').optional().isLength({ min: 11, max: 11 }).withMessage('TCKN must be 11 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { employees } = req.body;
      const results = {
        success: [],
        failed: [],
        geocoded: 0,
        total: employees.length
      };

      for (const employee of employees) {
        try {
          const { ad, soyad, tckn, acik_adres } = employee;
          
          // Geocode address
          let coordinates = null;
          try {
            const geocodeResult = await geocodingService.geocodeAddress(acik_adres);
            coordinates = geocodeResult;
            results.geocoded++;
          } catch (geocodeError) {
            console.warn('Geocoding failed for:', acik_adres, geocodeError.message);
          }

          const result = await pool.query(`
            INSERT INTO calisanlar (ad, soyad, tckn, acik_adres, konum)
            VALUES ($1, $2, $3, $4, ${coordinates ? 'ST_SetSRID(ST_MakePoint($6, $5), 4326)' : 'NULL'})
            RETURNING id, ad, soyad, tckn, acik_adres
          `, coordinates ? 
            [ad, soyad, tckn, acik_adres, coordinates.lat, coordinates.lng] :
            [ad, soyad, tckn, acik_adres]
          );

          results.success.push({
            ...result.rows[0],
            geocoded: !!coordinates
          });
        } catch (error) {
          results.failed.push({
            employee: employee,
            error: error.message
          });
        }
      }

      res.status(201).json({
        message: 'Bulk employee creation completed',
        results
      });
    } catch (error) {
      console.error('Error in bulk employee creation:', error);
      res.status(500).json({ error: 'Failed to create employees' });
    }
  }
);

// Excel upload endpoint for employees
router.post('/upload-excel',
  auth,
  uploadWithErrorHandling,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse Excel file
      const parseResult = parseExcelBuffer(req.file.buffer);
      
      // Validate data structure
      const validation = validateEmployeeData(parseResult.data);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Excel validation failed',
          details: validation.errors,
          summary: {
            totalRows: validation.totalRows,
            validRows: validation.validRowCount,
            errorRows: validation.errorRowCount
          }
        });
      }

      // Process valid employees
      const results = {
        success: [],
        failed: [],
        geocoded: 0,
        total: validation.validRows.length
      };

      for (const employee of validation.validRows) {
        try {
          const { ad, soyad, tckn, acik_adres } = employee;
          
          // Geocode address
          let coordinates = null;
          try {
            const geocodeResult = await geocodingService.geocodeAddress(acik_adres);
            coordinates = geocodeResult;
            results.geocoded++;
          } catch (geocodeError) {
            console.warn('Geocoding failed for:', acik_adres, geocodeError.message);
          }

          const result = await pool.query(`
            INSERT INTO calisanlar (ad, soyad, tckn, acik_adres, konum)
            VALUES ($1, $2, $3, $4, ${coordinates ? 'ST_SetSRID(ST_MakePoint($6, $5), 4326)' : 'NULL'})
            RETURNING id, ad, soyad, tckn, acik_adres,
                      ST_X(konum) as longitude, 
                      ST_Y(konum) as latitude
          `, coordinates ? 
            [ad, soyad, tckn || null, acik_adres, coordinates.lat, coordinates.lng] :
            [ad, soyad, tckn || null, acik_adres]
          );

          results.success.push({
            ...result.rows[0],
            geocoded: !!coordinates
          });
        } catch (error) {
          results.failed.push({
            employee: employee,
            error: error.message
          });
        }
      }

      res.status(201).json({
        message: 'Excel file processed successfully',
        results: {
          ...results,
          summary: {
            totalProcessed: results.total,
            successful: results.success.length,
            failed: results.failed.length,
            geocoded: results.geocoded,
            geocodingRate: `${Math.round((results.geocoded / results.total) * 100)}%`
          }
        }
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      res.status(500).json({ 
        error: 'Failed to process Excel file',
        details: error.message 
      });
    }
  }
);

// Test endpoint - auth olmadan
router.post('/toplu-analiz-test', async (req, res) => {
  res.json({ message: 'Test successful', timestamp: new Date().toISOString() });
});

// Toplu analiz - basit mock data
router.post('/toplu-analiz', auth, async (req, res) => {
  try {
    console.log('Toplu analiz request received');
    const { strategy = 'closest', maxDistance = 50, branchCount = 3 } = req.body;
    console.log('Request body:', req.body);
    
    // Mock data döndür
    const analysisResults = [
      {
        employee: {
          id: 1,
          name: "Ahmet Yılmaz",
          address: "Kadıköy, İstanbul"
        },
        selectedBranch: {
          id: 4,
          name: "İstanbul Merkez",
          address: "Levent, İstanbul",
          distance_km: 15.38,
          capacity: 1
        }
      },
      {
        employee: {
          id: 2,
          name: "Ayşe Demir",
          address: "Beşiktaş, İstanbul"
        },
        selectedBranch: {
          id: 4,
          name: "İstanbul Merkez",
          address: "Levent, İstanbul",
          distance_km: 8.23,
          capacity: 1
        }
      },
      {
        employee: {
          id: 9,
          name: "Ali Ali",
          address: "OSTİM, Ankara"
        },
        selectedBranch: {
          id: 5,
          name: "Ankara Şubesi",
          address: "Kızılay, Ankara",
          distance_km: 12.45,
          capacity: 2
        }
      }
    ];

    const stats = {
      totalEmployees: 15,
      analyzedEmployees: 3,
      averageDistance: "12.02",
      strategy: strategy,
      maxDistance: maxDistance
    };

    res.json({
      message: 'Bulk analysis completed successfully',
      stats,
      results: analysisResults,
      suggestedAssignments: []
    });

  } catch (error) {
    console.error('Bulk analysis error:', error);
    res.status(500).json({ 
      error: 'Bulk analysis failed',
      details: error.message 
    });
  }
});

module.exports = router;
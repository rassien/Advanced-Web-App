const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/database');
const geocodingService = require('../services/geocoding');
const auth = require('../middleware/auth');
const { uploadWithErrorHandling } = require('../middleware/upload');
const { 
  parseExcelBuffer, 
  validateBranchData, 
  BRANCH_COLUMN_MAPPING 
} = require('../utils/excelParser');

const router = express.Router();

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        ad, 
        adres, 
        norm_kadro,
        ST_X(konum) as longitude,
        ST_Y(konum) as latitude,
        created_at,
        updated_at
      FROM subeler 
      ORDER BY ad
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get branch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id, 
        ad, 
        adres, 
        norm_kadro,
        ST_X(konum) as longitude,
        ST_Y(konum) as latitude,
        created_at,
        updated_at
      FROM subeler 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Create new branch
router.post('/', 
  auth,
  [
    body('ad').trim().notEmpty().withMessage('Branch name is required'),
    body('adres').trim().notEmpty().withMessage('Address is required'),
    body('norm_kadro').isInt({ min: 0 }).withMessage('Norm kadro must be a non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ad, adres, norm_kadro } = req.body;
      
      // Geocode the address
      let coordinates = null;
      try {
        const geocodeResult = await geocodingService.geocodeAddress(adres);
        coordinates = geocodeResult;
      } catch (geocodeError) {
        console.warn('Geocoding failed for address:', adres, geocodeError.message);
        // Continue without coordinates - PostGIS queries will filter out NULL locations
      }

      const result = await pool.query(`
        INSERT INTO subeler (ad, adres, konum, norm_kadro)
        VALUES ($1, $2, ${coordinates ? 'ST_SetSRID(ST_MakePoint($4, $3), 4326)' : 'NULL'}, $5)
        RETURNING id, ad, adres, norm_kadro, 
                  ST_X(konum) as longitude, 
                  ST_Y(konum) as latitude,
                  created_at
      `, coordinates ? 
        [ad, adres, coordinates.lat, coordinates.lng, norm_kadro] : 
        [ad, adres, norm_kadro]
      );

      res.status(201).json({
        message: 'Branch created successfully',
        branch: result.rows[0],
        geocoded: !!coordinates
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: 'Branch already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create branch' });
      }
    }
  }
);

// Update branch
router.put('/:id',
  auth,
  [
    body('ad').optional().trim().notEmpty().withMessage('Branch name cannot be empty'),
    body('adres').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    body('norm_kadro').optional().isInt({ min: 0 }).withMessage('Norm kadro must be a non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { ad, adres, norm_kadro } = req.body;

      // Check if branch exists
      const existingBranch = await pool.query('SELECT * FROM subeler WHERE id = $1', [id]);
      if (existingBranch.rows.length === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      let updateQuery = 'UPDATE subeler SET updated_at = CURRENT_TIMESTAMP';
      let values = [];
      let paramIndex = 1;

      if (ad !== undefined) {
        updateQuery += `, ad = $${paramIndex}`;
        values.push(ad);
        paramIndex++;
      }

      if (norm_kadro !== undefined) {
        updateQuery += `, norm_kadro = $${paramIndex}`;
        values.push(norm_kadro);
        paramIndex++;
      }

      if (adres !== undefined) {
        // If address is being updated, try to geocode it
        let coordinates = null;
        try {
          const geocodeResult = await geocodingService.geocodeAddress(adres);
          coordinates = geocodeResult;
        } catch (geocodeError) {
          console.warn('Geocoding failed for updated address:', adres, geocodeError.message);
        }

        updateQuery += `, adres = $${paramIndex}`;
        values.push(adres);
        paramIndex++;

        if (coordinates) {
          updateQuery += `, konum = ST_SetSRID(ST_MakePoint($${paramIndex + 1}, $${paramIndex}), 4326)`;
          values.push(coordinates.lat, coordinates.lng);
          paramIndex += 2;
        }
      }

      updateQuery += ` WHERE id = $${paramIndex} RETURNING id, ad, adres, norm_kadro, ST_X(konum) as longitude, ST_Y(konum) as latitude, updated_at`;
      values.push(id);

      const result = await pool.query(updateQuery, values);

      res.json({
        message: 'Branch updated successfully',
        branch: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({ error: 'Failed to update branch' });
    }
  }
);

// Delete branch
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if branch has assignments
    const assignmentCheck = await pool.query('SELECT COUNT(*) FROM atamalar WHERE sube_id = $1', [id]);
    if (parseInt(assignmentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete branch with existing assignments',
        assignmentCount: assignmentCheck.rows[0].count
      });
    }

    const result = await pool.query('DELETE FROM subeler WHERE id = $1 RETURNING ad', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ 
      message: 'Branch deleted successfully',
      deletedBranch: result.rows[0].ad
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// Bulk create branches from Excel/JSON data
router.post('/bulk',
  auth,
  [
    body('branches').isArray().withMessage('Branches must be an array'),
    body('branches.*.ad').trim().notEmpty().withMessage('Branch name is required'),
    body('branches.*.adres').trim().notEmpty().withMessage('Address is required'),
    body('branches.*.norm_kadro').optional().isInt({ min: 0 }).withMessage('Norm kadro must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { branches } = req.body;
      const results = {
        success: [],
        failed: [],
        geocoded: 0,
        total: branches.length
      };

      for (const branch of branches) {
        try {
          const { ad, adres, norm_kadro = 0 } = branch;
          
          // Geocode address
          let coordinates = null;
          try {
            const geocodeResult = await geocodingService.geocodeAddress(adres);
            coordinates = geocodeResult;
            results.geocoded++;
          } catch (geocodeError) {
            console.warn('Geocoding failed for:', adres, geocodeError.message);
          }

          const result = await pool.query(`
            INSERT INTO subeler (ad, adres, konum, norm_kadro)
            VALUES ($1, $2, ${coordinates ? 'ST_SetSRID(ST_MakePoint($4, $3), 4326)' : 'NULL'}, $5)
            RETURNING id, ad, adres, norm_kadro
          `, coordinates ? 
            [ad, adres, coordinates.lat, coordinates.lng, norm_kadro] :
            [ad, adres, norm_kadro]
          );

          results.success.push({
            ...result.rows[0],
            geocoded: !!coordinates
          });
        } catch (error) {
          results.failed.push({
            branch: branch,
            error: error.message
          });
        }
      }

      res.status(201).json({
        message: 'Bulk branch creation completed',
        results
      });
    } catch (error) {
      console.error('Error in bulk branch creation:', error);
      res.status(500).json({ error: 'Failed to create branches' });
    }
  }
);

// Excel upload endpoint for branches
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
      const validation = validateBranchData(parseResult.data);
      
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

      // Process valid branches
      const results = {
        success: [],
        failed: [],
        geocoded: 0,
        total: validation.validRows.length
      };

      for (const branch of validation.validRows) {
        try {
          const { ad, adres, norm_kadro } = branch;
          
          // Geocode address
          let coordinates = null;
          try {
            const geocodeResult = await geocodingService.geocodeAddress(adres);
            coordinates = geocodeResult;
            results.geocoded++;
          } catch (geocodeError) {
            console.warn('Geocoding failed for:', adres, geocodeError.message);
          }

          const result = await pool.query(`
            INSERT INTO subeler (ad, adres, konum, norm_kadro)
            VALUES ($1, $2, ${coordinates ? 'ST_SetSRID(ST_MakePoint($4, $3), 4326)' : 'NULL'}, $5)
            RETURNING id, ad, adres, norm_kadro,
                      ST_X(konum) as longitude, 
                      ST_Y(konum) as latitude
          `, coordinates ? 
            [ad, adres, coordinates.lat, coordinates.lng, norm_kadro] :
            [ad, adres, norm_kadro]
          );

          results.success.push({
            ...result.rows[0],
            geocoded: !!coordinates
          });
        } catch (error) {
          results.failed.push({
            branch: branch,
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

module.exports = router;
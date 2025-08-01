const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.calisan_id,
        a.sube_id,
        a.mesafe,
        a.sure,
        a.atama_tarihi,
        c.ad as calisan_adi,
        c.soyad as calisan_soyadi,
        c.tckn,
        c.acik_adres as calisan_adresi,
        s.ad as sube_adi,
        s.adres as sube_adresi,
        s.norm_kadro
      FROM atamalar a
      JOIN calisanlar c ON a.calisan_id = c.id
      JOIN subeler s ON a.sube_id = s.id
      ORDER BY a.atama_tarihi DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.id,
        a.calisan_id,
        a.sube_id,
        a.mesafe,
        a.sure,
        a.atama_tarihi,
        c.ad as calisan_adi,
        c.soyad as calisan_soyadi,
        c.tckn,
        c.acik_adres as calisan_adresi,
        s.ad as sube_adi,
        s.adres as sube_adresi,
        s.norm_kadro
      FROM atamalar a
      JOIN calisanlar c ON a.calisan_id = c.id
      JOIN subeler s ON a.sube_id = s.id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create new assignment
router.post('/', 
  auth,
  [
    body('calisan_id').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
    body('sube_id').isInt({ min: 1 }).withMessage('Valid branch ID is required'),
    body('mesafe').optional().isFloat({ min: 0 }).withMessage('Distance must be non-negative'),
    body('sure').optional().isInt({ min: 0 }).withMessage('Duration must be non-negative')
  ],
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { calisan_id, sube_id, mesafe, sure } = req.body;
      
      await client.query('BEGIN');

      // Check if employee exists
      const employeeCheck = await client.query('SELECT id FROM calisanlar WHERE id = $1', [calisan_id]);
      if (employeeCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Check if branch exists and has capacity
      const branchCheck = await client.query('SELECT id, ad, norm_kadro FROM subeler WHERE id = $1', [sube_id]);
      if (branchCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Branch not found' });
      }

      const branch = branchCheck.rows[0];
      if (branch.norm_kadro <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Branch has no available capacity',
          currentCapacity: branch.norm_kadro
        });
      }

      // Check if assignment already exists
      const existingAssignment = await client.query(
        'SELECT id FROM atamalar WHERE calisan_id = $1 AND sube_id = $2',
        [calisan_id, sube_id]
      );
      
      if (existingAssignment.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Assignment already exists for this employee and branch' });
      }

      // Create assignment
      const assignmentResult = await client.query(`
        INSERT INTO atamalar (calisan_id, sube_id, mesafe, sure)
        VALUES ($1, $2, $3, $4)
        RETURNING id, calisan_id, sube_id, mesafe, sure, atama_tarihi
      `, [calisan_id, sube_id, mesafe, sure]);

      // Update branch capacity
      await client.query(
        'UPDATE subeler SET norm_kadro = norm_kadro - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [sube_id]
      );

      await client.query('COMMIT');

      // Fetch complete assignment data
      const completeAssignment = await pool.query(`
        SELECT 
          a.id,
          a.calisan_id,
          a.sube_id,
          a.mesafe,
          a.sure,
          a.atama_tarihi,
          c.ad as calisan_adi,
          c.soyad as calisan_soyadi,
          c.tckn,
          c.acik_adres as calisan_adresi,
          s.ad as sube_adi,
          s.adres as sube_adresi,
          s.norm_kadro
        FROM atamalar a
        JOIN calisanlar c ON a.calisan_id = c.id
        JOIN subeler s ON a.sube_id = s.id
        WHERE a.id = $1
      `, [assignmentResult.rows[0].id]);

      res.status(201).json({
        message: 'Assignment created successfully',
        assignment: completeAssignment.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating assignment:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: 'Assignment already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create assignment' });
      }
    } finally {
      client.release();
    }
  }
);

// Delete assignment
router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get assignment details before deletion
    const assignmentResult = await client.query(`
      SELECT 
        a.id,
        a.sube_id,
        c.ad as calisan_adi,
        c.soyad as calisan_soyadi,
        s.ad as sube_adi
      FROM atamalar a
      JOIN calisanlar c ON a.calisan_id = c.id
      JOIN subeler s ON a.sube_id = s.id
      WHERE a.id = $1
    `, [id]);
    
    if (assignmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    // Delete assignment
    await client.query('DELETE FROM atamalar WHERE id = $1', [id]);

    // Restore branch capacity
    await client.query(
      'UPDATE subeler SET norm_kadro = norm_kadro + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [assignment.sube_id]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Assignment deleted successfully',
      deletedAssignment: {
        employee: `${assignment.calisan_adi} ${assignment.calisan_soyadi}`,
        branch: assignment.sube_adi
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  } finally {
    client.release();
  }
});

// Get assignments for a specific employee
router.get('/calisan/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        a.id,
        a.mesafe,
        a.sure,
        a.atama_tarihi,
        s.ad as sube_adi,
        s.adres as sube_adresi,
        s.norm_kadro
      FROM atamalar a
      JOIN subeler s ON a.sube_id = s.id
      WHERE a.calisan_id = $1
      ORDER BY a.atama_tarihi DESC
    `, [employeeId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee assignments:', error);
    res.status(500).json({ error: 'Failed to fetch employee assignments' });
  }
});

// Bulk assignment creation with automatic optimization
router.post('/bulk-optimize',
  auth,
  [
    body('employees').isArray().withMessage('Employees must be an array'),
    body('maxDistance').optional().isFloat({ min: 0 }).withMessage('Max distance must be non-negative'),
    body('prioritizeDistance').optional().isBoolean().withMessage('Prioritize distance must be boolean')
  ],
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        employees, 
        maxDistance = 50, // km
        prioritizeDistance = true 
      } = req.body;

      await client.query('BEGIN');

      const results = {
        successful: [],
        failed: [],
        summary: {
          totalEmployees: employees.length,
          assigned: 0,
          failed: 0
        }
      };

      for (const employeeId of employees) {
        try {
          // Get employee info
          const employeeResult = await client.query(
            'SELECT id, ad, soyad, konum FROM calisanlar WHERE id = $1',
            [employeeId]
          );

          if (employeeResult.rows.length === 0) {
            results.failed.push({
              employeeId,
              reason: 'Employee not found'
            });
            results.summary.failed++;
            continue;
          }

          const employee = employeeResult.rows[0];

          if (!employee.konum) {
            results.failed.push({
              employeeId,
              employee: `${employee.ad} ${employee.soyad}`,
              reason: 'Employee location not available'
            });
            results.summary.failed++;
            continue;
          }

          // Find best branch for this employee
          const availableBranches = await client.query(`
            SELECT 
              s.id,
              s.ad,
              s.adres,
              s.norm_kadro,
              ST_Distance(
                ST_Transform($1, 3857),
                ST_Transform(s.konum, 3857)
              ) / 1000 AS distance_km
            FROM subeler s
            WHERE s.konum IS NOT NULL 
              AND s.norm_kadro > 0
              AND ST_Distance(
                ST_Transform($1, 3857),
                ST_Transform(s.konum, 3857)
              ) / 1000 <= $2
            ORDER BY ${prioritizeDistance ? 'distance_km' : 's.norm_kadro DESC, distance_km'}
            LIMIT 1
          `, [employee.konum, maxDistance]);

          if (availableBranches.rows.length === 0) {
            results.failed.push({
              employeeId,
              employee: `${employee.ad} ${employee.soyad}`,
              reason: `No available branches within ${maxDistance}km`
            });
            results.summary.failed++;
            continue;
          }

          const branch = availableBranches.rows[0];

          // Create assignment
          const assignmentResult = await client.query(`
            INSERT INTO atamalar (calisan_id, sube_id, mesafe)
            VALUES ($1, $2, $3)
            RETURNING id, atama_tarihi
          `, [employeeId, branch.id, branch.distance_km]);

          // Update branch capacity
          await client.query(
            'UPDATE subeler SET norm_kadro = norm_kadro - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [branch.id]
          );

          results.successful.push({
            assignmentId: assignmentResult.rows[0].id,
            employee: `${employee.ad} ${employee.soyad}`,
            branch: branch.ad,
            distance: Math.round(branch.distance_km * 100) / 100,
            assignedAt: assignmentResult.rows[0].atama_tarihi
          });

          results.summary.assigned++;

        } catch (error) {
          console.error(`Error assigning employee ${employeeId}:`, error);
          results.failed.push({
            employeeId,
            reason: error.message
          });
          results.summary.failed++;
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Bulk assignment optimization completed',
        results
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in bulk assignment optimization:', error);
      res.status(500).json({ error: 'Failed to process bulk assignments' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
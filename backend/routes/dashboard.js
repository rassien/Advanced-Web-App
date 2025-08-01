const express = require('express');
const { pool } = require('../models/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/', auth, async (req, res) => {
  try {
    // Get employee statistics
    const employeeStats = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(konum) as geocoded_employees,
        COUNT(CASE WHEN konum IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as geocoding_rate
      FROM calisanlar
    `);

    // Get branch statistics
    const branchStats = await pool.query(`
      SELECT 
        COUNT(*) as total_branches,
        SUM(norm_kadro) as total_capacity,
        COUNT(konum) as geocoded_branches
      FROM subeler
    `);

    // Get assignment statistics
    const assignmentStats = await pool.query(`
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(DISTINCT calisan_id) as assigned_employees,
        COUNT(DISTINCT sube_id) as branches_with_assignments
      FROM atamalar
    `);

    // Calculate available capacity
    const availableCapacity = await pool.query(`
      SELECT 
        COALESCE(SUM(s.norm_kadro), 0) - COALESCE(COUNT(a.calisan_id), 0) as available_capacity
      FROM subeler s
      LEFT JOIN atamalar a ON s.id = a.sube_id
    `);

    // Get recent activities (last 10 employees and branches added)
    const recentEmployees = await pool.query(`
      SELECT ad, soyad, created_at
      FROM calisanlar
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentBranches = await pool.query(`
      SELECT ad, created_at
      FROM subeler
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      employees: {
        total: parseInt(employeeStats.rows[0].total_employees),
        geocoded: parseInt(employeeStats.rows[0].geocoded_employees),
        geocodingRate: parseFloat(employeeStats.rows[0].geocoding_rate || 0).toFixed(1)
      },
      branches: {
        total: parseInt(branchStats.rows[0].total_branches),
        totalCapacity: parseInt(branchStats.rows[0].total_capacity || 0),
        geocoded: parseInt(branchStats.rows[0].geocoded_branches)
      },
      assignments: {
        total: parseInt(assignmentStats.rows[0].total_assignments),
        assignedEmployees: parseInt(assignmentStats.rows[0].assigned_employees),
        branchesWithAssignments: parseInt(assignmentStats.rows[0].branches_with_assignments)
      },
      capacity: {
        available: parseInt(availableCapacity.rows[0].available_capacity || 0)
      },
      recent: {
        employees: recentEmployees.rows.map(emp => ({
          name: `${emp.ad} ${emp.soyad}`,
          createdAt: emp.created_at
        })),
        branches: recentBranches.rows.map(branch => ({
          name: branch.ad,
          createdAt: branch.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
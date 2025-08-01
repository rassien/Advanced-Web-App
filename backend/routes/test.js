const express = require('express');
const router = express.Router();

// Basit test endpoint
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from test route' });
});

// Toplu analiz test
router.post('/bulk-test', (req, res) => {
  const mockResults = [
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
    }
  ];

  const stats = {
    totalEmployees: 15,
    analyzedEmployees: 1,
    averageDistance: "15.38",
    strategy: "closest",
    maxDistance: 50
  };

  res.json({
    message: 'Bulk analysis completed successfully',
    stats,
    results: mockResults,
    suggestedAssignments: []
  });
});

module.exports = router;
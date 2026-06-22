import express from 'express';
// Import your authenticateToken middleware here (adjust the path as necessary)
import { authenticateToken } from '../middleware/auth.js'; 
import { initDB } from '../db.js';

const router = express.Router();

/**
 * POST /api/hazards
 * Commit a new telemetry hazard point
 * 
 * 
 */
let db

initDB().then((database) => {
    db = database;
}).catch(err => {
    console.error('Database instantiation breakdown:', err);
});


router.post('/', authenticateToken, async (req, res) => {
  const { latitude, longitude, hazardType } = req.body;
  const userId = req.id; // Assigned by authenticateToken middleware

  // 1. Validation check
  if (!userId || latitude === undefined || longitude === undefined || !hazardType) {
    return res.status(400).json({ 
      success: false, 
      message: "Malformed hazard schema. Missing parameters." 
    });
  }

  try {
    // 2. Insert using your global or imported async db instance
    // Assumes 'db' is globally accessible, or imported/passed into the file
    const result = await db.run(`
      INSERT INTO hazard_reports (user_id, latitude, longitude, hazard_type)
      VALUES (?, ?, ?, ?)
    `, [userId, latitude, longitude, hazardType]);

    // 3. Return clean JSON payload
    return res.status(201).json({
      success: true,
      message: "Telemetry point committed successfully.",
      reportId: result.lastID
    });

  } catch (dbError) {
    console.error("Database insertion fault:", dbError);
    return res.status(500).json({ 
      success: false, 
      message: "Internal record storage transactional failure." 
    });
  }
});

/**
 * GET /api/hazards
 * Compiles hazard collections for the SafePath Engine check loops
 */
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: "Database connection uninitialized." });
    }

    const logs = await db.all(`
      SELECT 
        hr.id, 
        u.username, 
        hr.latitude, 
        hr.longitude, 
        hr.hazard_type AS hazardType, 
        hr.created_at AS createdAt 
      FROM hazard_reports hr
      INNER JOIN user u ON hr.user_id = u.user_id
      ORDER BY hr.created_at DESC
    `);

    return res.status(200).json(logs);

  } catch (dbError) {
    console.error("Backend failed to fetch threat matrix data logs:", dbError);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server data retrieval failure." 
    });
  }
});

export default router;
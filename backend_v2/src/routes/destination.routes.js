import express from 'express';
import { initDB } from '../db.js';
const normalUserRouter = express.Router();

/**
 * POST /api/normal-user/destinations
 * Logs a new route trajectory for the currently authenticated user
 */

let db

initDB().then((database) => {
    db = database;
}).catch(err => {
    console.error('Database instantiation breakdown:', err);
});

normalUserRouter.post('/', async (req, res) => {
  const { startLocation, endLocation} = req.body;
  const userId = req.id; // Populated by your authenticateToken middleware

  if (!startLocation || !endLocation) {
    return res.status(400).json({
      success: false,
      message: "Missing start_location or end_location path parameters."
    });
  }

  try {
    const result = await db.run(`
      INSERT INTO destination (
        user_id, 
        start_location, 
        end_location 
      ) VALUES (?, ?, ?)
    `, [userId, startLocation, endLocation]);

    return res.status(201).json({
      success: true,
      message: "Telemetry destination tracked successfully.",
      logId: result.lastID
    });
  } catch (dbError) {
    console.error("User route log transaction failure:", dbError);
    return res.status(500).json({
      success: false,
      message: "Internal tracking server database fault."
    });
  }
});

/**
 * GET /api/normal-user/destinations
 * Fetches the personal historical route metrics for the logged-in user
 */
normalUserRouter.get('/', async (req, res) => {
  const userId = req.id;

  try {
    const historicalLogs = await db.all(`
      SELECT 
        id,
        start_location AS startLocation,
        end_location AS endLocation,
        created_at AS createdAt
      FROM destination
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    return res.status(200).json(historicalLogs);
  } catch (dbError) {
    console.error("Failed to query user spatial logs:", dbError);
    return res.status(500).json({
      success: false,
      message: "Internal server data retrieval failure."
    });
  }
});


const adminRouter = express.Router();

/**
 * GET /api/admin-user/destinations
 * Compiles a global audit log of all system routing behaviors across all users
 */
adminRouter.get('/a', async (req, res) => {
  try {
    const adminLogs = await db.all(`
      SELECT 
        d.id,
        d.user_id AS userId,
        u.username,
        d.start_location AS startLocation,
        d.end_location AS endLocation,
        d.created_at AS createdAt
      FROM destination d
      INNER JOIN user u ON d.user_id = u.user_id
      ORDER BY d.created_at DESC
    `);

    return res.status(200).json(adminLogs);
  } catch (dbError) {
    console.error("Admin analytical pull failure:", dbError);
    return res.status(500).json({
      success: false,
      message: "Internal server analytical compilation failure."
    });
  }
});

/**
 * DELETE /api/admin-user/destinations/:id
 * Allows administrative removal of a tracking log entry by its primary key
 */
adminRouter.delete('/a/:id', async (req, res) => {
  const logId = req.params.id;

  try {
    const result = await db.run(`
      DELETE FROM destination WHERE id = ?
    `, [logId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Target log entry not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: `Log entry ${logId} safely expunged from database registries.`
    });
  } catch (dbError) {
    console.error("Admin deletion execution failure:", dbError);
    return res.status(500).json({
      success: false,
      message: "Internal log deletion database failure."
    });
  }
});


export {adminRouter,normalUserRouter} ;
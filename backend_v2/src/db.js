// database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'safe_route.db');

export async function initDB() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.get("PRAGMA foreign_keys = ON");

    // Base User Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            firstname TEXT,
            lastname TEXT
        )
    `);

    // Sub-type: Driver Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS driver (
            driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
    `);

    // Sub-type: Admin Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS admin (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            driver_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
            FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE SET NULL
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS hazard_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, 
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            hazard_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
    `);

     await db.exec(`
       CREATE TABLE IF NOT EXISTS destination (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_location TEXT,
            end_location TEXT,
            hazard_bypassed INTEGER DEFAULT 0, -- Boolean state flag (0 = Clear, 1 = Detour active)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
    `);
    
    return db;
}

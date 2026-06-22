// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDB } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_routing_key_123';

let db;

// Connect to SQLite
initDB().then((database) => {
    db = database;
  
}).catch(err => {
    console.error('Database instantiation breakdown:', err);
});

    // Authentication Sign-Up Route -> maps to POST /api/auth/register
    router.post('/register', async (req, res) => {
        const { email, password, username, firstName, lastName, userType } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Missing essential validation elements.' });
        }

        try {
            // 1. Check for existing identifier usage
            const existingUser = await db.get('SELECT user_id FROM user WHERE email = ? OR username = ?', [email, username]);
            if (existingUser) {
                return res.status(400).json({ message: 'User with this email or username already exists.' });
            }

            // 2. Compute secure hash
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Begin Transaction isolation block
            await db.run('BEGIN TRANSACTION');

            const userResult = await db.run(
                `INSERT INTO user (email, password, username, firstname, lastname) 
                 VALUES (?, ?, ?, ?, ?)`,
                [email, hashedPassword, username, firstName, lastName]
            );

            const newUserId = userResult.lastID;

            // 4. Evaluate sub-type allocations from ERD definitions
            if ( userType === 'normal') {
                await db.run(`INSERT INTO driver (user_id) VALUES (?)`, [newUserId]);
            }else{
                 await db.run(`INSERT INTO admin (user_id) VALUES (?)`, [newUserId]);
            }

            await db.run('COMMIT');

            // 5. Package session payloads
            const token = jwt.sign({ userId: newUserId,userType}, JWT_SECRET, { expiresIn: '4h' });

            return res.status(201).json({
                userType ,
                token
            });

        } catch (error) {
            await db.run('ROLLBACK').catch(() => {}); 
            console.error('Registration runtime error:', error);
            return res.status(500).json({ message: 'Internal server operational failure.' });
        }
    });

    // Authentication Login Route -> maps to POST /api/auth/login
    router.post('/login', async (req, res) => {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required.' });
        }

        try {
            // 1. Fetch user by email OR username
            const user = await db.get(
                'SELECT * FROM user WHERE email = ? ', 
                [identifier]
            );

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // 2. Compare passwords
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // 3. Update last_login timestamp
            const currentTimestamp = new Date().toISOString();
            await db.run(
                'UPDATE user SET last_login = ? WHERE user_id = ?', 
                [currentTimestamp, user.user_id]
            );

            // 4. Determine userType by checking the sub-type tables
            let userType = 'normal';
            const isAdmin = await db.get('SELECT admin_id FROM admin WHERE user_id = ?', [user.user_id]);
            
            if (isAdmin) {
                userType = 'admin';
            } else {
                const isDriver = await db.get('SELECT driver_id FROM driver WHERE user_id = ?', [user.user_id]);
               
            }

            // 5. Generate session token
            const token = jwt.sign(
                { userId: user.user_id ,userType:userType}, 
                JWT_SECRET, 
                { expiresIn: '4h' }
            );

            return res.status(200).json({
                userType: userType,
                token: token
            });

        } catch (error) {
            console.error('Login runtime error:', error);
            return res.status(500).json({ message: 'Internal server operational failure.' });
        }
    });

export default router
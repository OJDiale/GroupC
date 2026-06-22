// routes/users.js
import express from 'express';
import { initDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import adminWare from '../middleware/admin.js';

const router = express.Router();

let db;
initDB().then((database) => {
    db = database;
}).catch(err => {
    console.error('Database connection error in user routes:', err);
});

/**
 * 1. GET USER PROFILE DATA
 * Endpoint: GET /api/users/:id
 */
import bcrypt from 'bcryptjs'; // Ensure bcrypt is imported if hashing passwords here

// 1. GET PROFILE FIELDS
router.get('/', authenticateToken, async (req, res) => {
    // Standardize targeting the authenticated user ID from the middleware
    const targetUserId = req.user?.id || req.id; 
    
    try {
        const user = await db.get(
            'SELECT user_id, email, username, firstname, lastname, date_created, last_login FROM user WHERE user_id = ?', 
            [targetUserId]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Target profile user not found.' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server operational failure.' });
    }
});

router.get('/all', authenticateToken, adminWare, async (req, res) => {
    try {
        const users = await db.all(
            'SELECT user_id, email, username, firstname, lastname, date_created, last_login FROM user'
        );
        
        // Explicit return ensures execution control context halts immediately
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching system users:', error);
        
        // Prevent crashing if a response headers phase was partially altered upstream
        if (res.headersSent) {
            return;
        }
        
        return res.status(500).json({ message: 'Internal server operational failure.' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const targetUserId = req.params.id;

    try {
        // 1. Verify existence of the targeted resource entry before destructive execution
        const userCheck = await db.get(
            'SELECT user_id FROM user WHERE user_id = ?', 
            [targetUserId]
        );

        if (!userCheck) {
            return res.status(404).json({ message: 'Target profile user not found for deletion.' });
        }

        // 2. Execute database destruction command sequence
        await db.run(
            'DELETE FROM user WHERE user_id = ?', 
            [targetUserId]
        );

        // 3. Return explicit success status indication
        return res.status(200).json({ 
            message: 'User profile successfully unlinked and purged from system records.',
            purgedId: targetUserId 
        });
    } catch (error) {
        console.error('Error executing system user purge:', error);
        return res.status(500).json({ message: 'Internal server operational failure.' });
    }
});



// 2. UPDATE PROFILE FIELDS
router.put('/', authenticateToken, async (req, res) => {
    // Ensure both variables extract from the identical authenticated source
    const targetUserId = req.user?.id || req.id; 
    const { username, firstName, lastName, email, password } = req.body;

    try {
        // Fetch current records to fall back on if fields are omitted in req.body
        const currentUserData = await db.get('SELECT * FROM user WHERE user_id = ?', [targetUserId]);
        if (!currentUserData) {
            return res.status(404).json({ message: 'Target user does not exist.' });
        }

        const updatedUsername = username || currentUserData.username;
        const updatedEmail = email || currentUserData.email;
        const updatedFirstName = firstName || currentUserData.firstname;
        const updatedLastName = lastName || currentUserData.lastname;
        
        // Securely handle password update logic
        let updatedPassword = currentUserData.password;
        if (password) {
            const saltRounds = 10;
            updatedPassword = await bcrypt.hash(password, saltRounds);
        }

        await db.run(
            `UPDATE user 
             SET username = ?, email = ?, firstname = ?, lastname = ?, password = ?
             WHERE user_id = ?`,
            [updatedUsername, updatedEmail, updatedFirstName, updatedLastName, updatedPassword, targetUserId]
        );

        return res.status(200).json({
            message: 'Profile updated successfully!',
            user: {
                email: updatedEmail,
                username: updatedUsername,
                firstName: updatedFirstName,
                lastName: updatedLastName
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Username or email already taken.' });
        }
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal server operational failure.' });
    }
});

/**
 * 3. DELETE USER ACCOUNT
 * Endpoint: DELETE /api/users/:id
 */
router.delete('/', authenticateToken, async (req, res) => {
    const targetUserId = req.id

    try {
        const result = await db.run('DELETE FROM user WHERE user_id = ?', [targetUserId]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Target user record not found.' });
        }

        return res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal server operational failure.' });
    }
});

export default router;
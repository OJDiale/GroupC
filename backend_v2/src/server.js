// server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDB } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import authenticateAdmin from "./middleware/admin.js"
import  createAuthRouter  from './routes/auth.routes.js';
import userRoute from "./routes/user.routes.js"
import hazardRoute from "./routes/hazards.route.js"
import {adminRouter as adminDestinationRoute,normalUserRouter as userDestinationRoute }from "./routes/destination.routes.js"

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_routing_key_123';

app.use(cors());
app.use(express.json());

let db;

// Connect to SQLite
initDB().then((database) => {
    db = database;
    console.log('SQLite Database connected and structures loaded successfully.');
    app.listen(PORT, () => console.log(`Backend engine active on port ${PORT}`));
}).catch(err => {
    console.error('Database instantiation breakdown:', err);
});

// Authentication Sign-Up Route
app.use('/api/auth/',createAuthRouter)

app.use('/api/users',userRoute)

app.use('/api/hazards', hazardRoute)

app.use('/api/normal-user/destinations',authenticateToken,userDestinationRoute)

app.use('/api/admin-user/destinations',authenticateToken,authenticateAdmin,adminDestinationRoute)
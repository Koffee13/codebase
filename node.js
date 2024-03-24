const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const app = express();
const port = 3000;
const url = 'mongodb://localhost:27017';
const dbName = 'hotelManagement';
const secretKey = 'yourSecretKey';

app.use(bodyParser.json());

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    
    console.log('Connected to MongoDB');
    const db = client.db(dbName);

    // User Model
    const usersCollection = db.collection('users');

    // Room Types and Rooms Collections
    const roomTypesCollection = db.collection('roomTypes');
    const roomsCollection = db.collection('rooms');

    // Joi Schema for Data Validation
    const roomTypeSchema = Joi.object({
        name: Joi.string().required(),
    });

    // Authentication Middleware
    const authenticateUser = (req, res, next) => {
        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ message: 'Authorization header missing' });

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return res.status(401).json({ message: 'Invalid token' });
            req.user = decoded.user;
            next();
        });
    };

    // Authorization Middleware
    const authorizeAdmin = (req, res, next) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        next();
    };

    // Validation Middleware
    const validateData = (schema) => {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details[0].message });
            next();
        };
    };

    // POST endpoint for storage of room type
    app.post('/api/v1/room-types', authenticateUser, authorizeAdmin, validateData(roomTypeSchema), async (req, res) => {
        const { name } = req.body;
        const result = await roomTypesCollection.insertOne({ name });
        res.json(result.ops[0]);
    });

    // Rest of the endpoints remain the same

    // Start the server
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
});

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        
        res.json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            emailVerified: userRecord.emailVerified,
            createdAt: userRecord.metadata.creationTime,
            lastLogin: userRecord.metadata.lastSignInTime
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { displayName, photoURL } = req.body;

        await admin.auth().updateUser(decodedToken.uid, {
            displayName,
            photoURL
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
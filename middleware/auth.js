const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });
}

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized: No token provided' 
            });
        }

        const token = authHeader.split('Bearer ')[1];
        
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        
        // Optional: Check if user is banned or disabled
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        if (userRecord.disabled) {
            return res.status(403).json({ 
                error: 'Account disabled' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ 
                error: 'Token expired. Please login again.' 
            });
        }
        
        res.status(401).json({ 
            error: 'Invalid authentication token' 
        });
    }
};

// Rate limiting per user
const userRateLimit = (req, res, next) => {
    // Implement user-specific rate limiting here
    // Could use Redis for distributed rate limiting
    next();
};

module.exports = { verifyToken, userRateLimit };
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Allow all for now, change later
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

// Root route - TEST THIS FIRST
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 EimemesChat AI Backend is Running',
        endpoints: {
            chat: 'POST /api/chat',
            auth: 'GET /api/auth/profile',
            health: 'GET /health'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: '✅ OK',
        service: 'EimemesChat AI',
        timestamp: new Date().toISOString() 
    });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// 404 handler - MUST BE AFTER ALL ROUTES
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        requested: req.originalUrl,
        available: ['/', '/health', '/api/chat', '/api/auth']
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 EimemesChat AI Backend running on port ${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ API Base: http://localhost:${PORT}/api`);
});
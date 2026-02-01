const express = require('express');
const router = express.Router();

// Test route
router.get('/', (req, res) => {
    res.json({ 
        message: 'Chat API is working',
        endpoints: {
            completion: 'POST /completion',
            models: 'GET /models'
        }
    });
});

router.get('/models', (req, res) => {
    res.json({ 
        models: [
            { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
            { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
        ] 
    });
});

router.post('/completion', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    res.json({ 
        reply: `EimemesChat AI received: "${message}" (Groq API integration pending)`,
        model: 'llama3-8b-8192',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
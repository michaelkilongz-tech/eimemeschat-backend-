const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { body, validationResult } = require('express-validator');
const { verifyToken, userRateLimit } = require('../middleware/auth');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Validation middleware
const validateChatRequest = [
    body('message').notEmpty().trim().escape(),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('max_tokens').optional().isInt({ min: 1, max: 8192 })
];

// Get available models
router.get('/models', verifyToken, async (req, res) => {
    try {
        // Groq doesn't have a models endpoint yet, return static list
        const models = [
            { id: 'llama3-8b-8192', name: 'Llama 3 8B', maxTokens: 8192 },
            { id: 'llama3-70b-8192', name: 'Llama 3 70B', maxTokens: 8192 },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', maxTokens: 32768 },
            { id: 'gemma-7b-it', name: 'Gemma 7B', maxTokens: 8192 }
        ];
        
        res.json({ models });
    } catch (error) {
        console.error('Models fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Chat completion endpoint
router.post('/completion', verifyToken, userRateLimit, validateChatRequest, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            message, 
            model = process.env.GROQ_MODEL || 'llama3-8b-8192',
            temperature = 0.7,
            max_tokens = parseInt(process.env.GROQ_MAX_TOKENS) || 1024,
            stream = false,
            system_prompt = "You are EimemesChat AI, a helpful AI assistant created by Eimemes. You're knowledgeable, friendly, and always try to provide accurate information. Keep responses concise and human-like."
        } = req.body;

        const userId = req.user.uid;
        
        console.log(`Chat request from ${userId}: ${message.substring(0, 50)}...`);

        // Store conversation in Firebase (optional)
        const conversationData = {
            userId,
            message,
            model,
            timestamp: new Date().toISOString(),
            ip: req.ip
        };

        if (stream) {
            // Setup Server-Sent Events
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const stream = await groq.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: system_prompt },
                    { role: 'user', content: message }
                ],
                temperature: parseFloat(temperature),
                max_tokens: parseInt(max_tokens),
                stream: true
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            // Regular response
            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: system_prompt },
                    { role: 'user', content: message }
                ],
                temperature: parseFloat(temperature),
                max_tokens: parseInt(max_tokens)
            });

            const response = completion.choices[0]?.message?.content || '';

            res.json({
                response,
                model,
                tokens: completion.usage?.total_tokens || 0,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Chat completion error:', error);
        
        let statusCode = 500;
        let errorMessage = 'Internal server error';

        if (error instanceof Groq.APIError) {
            statusCode = error.status || 500;
            errorMessage = error.message || 'API error';
            
            if (statusCode === 429) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            } else if (statusCode === 401) {
                errorMessage = 'Invalid API key configuration';
            }
        }

        res.status(statusCode).json({ 
            error: errorMessage,
            code: error.code
        });
    }
});

// Get chat history for user
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const userId = req.user.uid;
        
        // Here you would query your database for user's chat history
        // For now, return empty array
        res.json({ 
            chats: [],
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Clear chat history
router.delete('/history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        // Delete user's chat history from database
        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

module.exports = router;
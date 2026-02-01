const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
    res.json({ 
        message: 'Auth API is working',
        endpoints: {
            login: 'POST /login (Coming soon)',
            register: 'POST /register (Coming soon)'
        }
    });
});

module.exports = router;
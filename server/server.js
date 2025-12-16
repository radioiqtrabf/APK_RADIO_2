const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for safety/flexibility
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get stream links
app.get('/api/stream', (req, res) => {
    const streams = [
        "https://stream.zeno.fm/ztmkyozjspltv",
        "https://stream.zeno.fm/ztmkyozjspltv.m3u",
        "https://stream.zeno.fm/ztmkyozjspltv.pls"
    ];
    res.json(streams);
});

// Fallback for any other route: serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing so our React app can connect
app.use(cors());
app.use(express.json());

// Main Core Endpoint: Fetches recommendations dynamically calling Python runtime
app.get('/api/recommend/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'User ID parameters are mandatory' });
    }

    const scriptPath = path.join(__dirname, 'recommend_worker.py');

    // Spawn the Python child process and pass the User ID as an argument
    // Use 'python3' or 'python' based on environment mappings
    const pythonProcess = spawn('python3', [scriptPath, userId]);

    let rawData = '';
    let errorData = '';

    // Collect standard outputs emitted from python worker stream
    pythonProcess.stdout.on('data', (data) => {
        rawData += data.toString();
    });

    // Collect standard errors if any occur
    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script execution failed with code ${code}:`, errorData);
            return res.status(500).json({ error: 'Internal recommendation inference processing error' });
        }

        try {
            const parsedData = JSON.parse(rawData.trim());
            return res.json({
                userId: userId,
                source: 'SVD Collaborative Filtering Matrix Engine',
                recommendations: parsedData
            });
        } catch (e) {
            console.error("Failed to parse script output to JSON:", rawData);
            return res.status(500).json({ error: 'Malformed response structure from ML backend execution' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Node.js Recommendation Engine active on http://localhost:${PORT}`);
});
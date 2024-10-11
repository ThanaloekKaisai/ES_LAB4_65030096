const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3300;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection - Update the database name to 'sensor'
mongoose.connect('mongodb://mongodb:27017/sensor', {  // Ensure MongoDB is accessible via Docker
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema for sensor data
const sensorSchema = new mongoose.Schema({
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
const SensorData = mongoose.model('SensorData', sensorSchema);

// Store the last received sensor data
let lastSensorData = {};

// Endpoint for handling incoming sensor data
app.post('/sensor-data', (req, res) => {
    const { temperature, humidity, apiKey } = req.body;

    // Validate API key (update this to match the key used in the ESP32 code)
    const validApiKey = 'ZRZJkxutKy83bB5EFXs96QDIBM4uOSvnJNTDhtbSzXRnuzHZcVAijCZw58OB8vMFrn2i6aX2CWpR8EKWqCDwUmUgfTbj1YyBUeUCY1WhqWyP0YM6Ov4fNzlMuE1MiBkP';
    if (apiKey !== validApiKey) {
        return res.status(403).send('Invalid API key');
    }

    // Update the last sensor data with the received values
    lastSensorData = { temperature, humidity };
    console.log('Received sensor data:', lastSensorData);

    // Create a new sensor data document
    const sensorData = new SensorData({ temperature, humidity });

    // Save the document to the database
    sensorData.save()
        .then(() => {
            console.log('Data saved:', lastSensorData);
            res.status(200).send('Data received and saved to MongoDB');
        })
        .catch(error => {
            console.error('Error saving data:', error);
            res.status(500).send('Error saving data to MongoDB');
        });
});

// Endpoint to retrieve the last sensor data
app.get('/sensor-data', (req, res) => {
    res.json(lastSensorData);  // Return the last sensor data as JSON
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


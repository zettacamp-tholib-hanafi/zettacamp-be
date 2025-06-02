// *************** IMPORT LIBRARY ***************
const express = require('express');

// *************** IMPORT MODULE ***************
const connectDB = require('./config/db');

// Create an Express application instance to handle HTTP requests
const app = express();

// Define server port, using environment variable if available
const PORT = process.env.PORT || 3000;

// Establish MongoDB connection before handling any requests
connectDB();

// Middleware to parse JSON so request bodies can be accessed via req.body
app.use(express.json());

// Root endpoint to verify service is running
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start the server using environment-defined port for deployment flexibility
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

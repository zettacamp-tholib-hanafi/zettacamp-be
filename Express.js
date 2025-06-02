// *************** IMPORT LIBRARY ***************
const express = require('express');

// *************** IMPORT MODULE ***************
const connectDB = require('./config/db');

require('./models/User');
require('./models/Student');
require('./models/School');

// *************** MUTATION ***************
// Initialize Express app and connect to MongoDB
const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

// Enable JSON parsing for incoming requests
app.use(express.json());

// Base route to verify service availability
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// *************** EXPORT MODULE ***************
// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

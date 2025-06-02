const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect To mongod DB
connectDB()

// Import User model
require('./models/User');

// Import Student model
require('./models/Student');

// Import School model
require('./models/School');

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

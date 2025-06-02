// *************** IMPORT LIBRARY ***************
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON so client data can be accessed via req.body
app.use(express.json());

// Root endpoint to verify service is running
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start the server using environment-defined port for deployment flexibility
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
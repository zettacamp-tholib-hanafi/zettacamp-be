// *************** IMPORT LIBRARY ***************
require("dotenv").config();

// *************** EXPORT MODEULE ***************
module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import your unified native MongoDB driver pool hooks from the config directory [cite: 75]
const { connectDB } = require('./config/db');

// Import your custom administrative routing map [cite: 54]
const adminRoutes = require('./routes/admin');

const app = express();

// Set up server port allocation
const PORT = process.env.PORT || 5000;

// Enable JSON middleware and cross-origin standard headers
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded form data
app.use(cors());

/**
 * Main Application Startup Bootstrap Wrapper
 */
async function startServer() {
  try {
    // 1. Establish the connection pool to the native MongoDB deployment instance [cite: 57]
    const db = await connectDB();

    // 2. Globally inject the active 'db' connection handle to make it accessible to downstream requests [cite: 68]
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    /**
     * @route   GET /api/states
     * @desc    Public endpoint: Fetch all listed Indian states sorted alphabetically
     */
    app.get('/api/states', async (req, res) => {
      try {
        const statesList = await req.db.collection('states')
          .find({})
          .sort({ name: 1 })
          .toArray();
        
        res.status(200).json(statesList);
      } catch (error) {
        res.status(500).json({ message: 'Failed compiling state directory data.' });
      }
    });

    /**
     * @route   GET /api/places
     * @desc    Public endpoint: Fetch destinations matching filters with automated fallback logic [cite: 57]
     */
    app.use('/api/places', require('./routes/places'));

    // 3. Mount the protected administrative operational routing controller space [cite: 54]
    app.use('/api/admin', adminRoutes);

    // 4. Fire up the Express web server framework
    app.listen(PORT, () => {
      console.log(`🚀 Explore India Control Grid broadcasting live over port: ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Critical system failure during database or server execution bootstrap:', error);
    process.exit(1);
  } 
}

// Launch the initialization pipeline
startServer();
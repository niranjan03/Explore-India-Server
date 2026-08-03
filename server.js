require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import database connection configuration
const { connectDB } = require('./config/db');

// Import dedicated route modules
const adminRoutes = require('./routes/admin');
const placesRoutes = require('./routes/places');
const newsletterRoutes = require('./routes/newsletter');

const app = express();
const PORT = process.env.PORT || 5000;

// Body parsing and CORS middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

async function startServer() {
  try {
    // Connect to MongoDB
    const db = await connectDB();

    // Attach native database connection handle to every request
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Public States Endpoint
    app.get('/api/states', async (req, res) => {
      try {
        const statesList = await req.db.collection('states').find({}).sort({ name: 1 }).toArray();
        res.status(200).json(statesList);
      } catch (error) {
        res.status(500).json({ message: 'Failed compiling state directory data.' });
      }
    });

    app.get('/api/health', async (req, res) => {
      res.status(200).json({ message: 'Server is healthy and running.' });
      
    });

    // Mount Modular Route Handlers
    app.use('/api/places', placesRoutes); // Public Place Routes
    app.use('/api/admin', adminRoutes);   // Protected Admin Routes
    app.use('/api/newsletter', newsletterRoutes); // Newsletter Routes


    app.listen(PORT, () => {
      console.log(`🚀 Explore India Control Grid broadcasting live over port: ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server startup failure:', error);
    process.exit(1);
  }
}

startServer();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the Admin DAO Model
const AdminModel = require('../models/Admin');

/**
 * @route   POST /api/admin/login
 * @desc    Fetch admin credentials from MongoDB and sign a JWT token
 */
router.post('/login', async (req, res) => {
  // Safe destructuring with fallback guard rail
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password parameters are required.' });
  }

  try {
    const adminDAO = new AdminModel(req.db);

    // 1. Look up the admin by email in MongoDB
    const admin = await adminDAO.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid administrative privileges or credentials.' });
    }

    // 2. Compare the plain-text password against the hashed password stored in MongoDB
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials entered.' });
    }

    // 3. Generate signed JWT session token
    const token = jwt.sign(
      { id: admin._id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET || 'super_secret_india_heritage_key',
      { expiresIn: '24h' }
    );

    console.log('Admin login successful for:', email);
    console.log('Generated JWT token:', token);
    console.log('Token expiration set for 24 hours from issuance.');
    console.log('Admin role:', admin.role);
    console.log('Admin ID:', admin._id);
    
    res.status(200).json({ 
      success: true, 
      token: `Bearer ${token}` 
    });

  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal server error processing login.' });
  }
});

module.exports = router;
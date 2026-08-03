const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

// Security middleware to verify incoming JWT authorization tokens
const verifyAdmin = require('../middleware/auth');

// Data Access Object (DAO) helpers for interacting with MongoDB collections
const AdminModel = require('../models/Admin');
const StateModel = require('../models/State');
const PlaceModel = require('../models/Place');
const CommentModel = require('../models/Comment');

/**
 * @route   POST /api/admin/login
 * @desc    Verify administrative credentials against MongoDB and issue a 24-hour JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
  // Safe destructuring with fallback guard rail to prevent 'undefined' crashes
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const adminDAO = new AdminModel(req.db);

    // 1. Look up the admin user inside the 'admins' collection
    const admin = await adminDAO.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid administrative privileges or credentials.' });
    }

    // 2. Cross-reference incoming password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials entered.' });
    }

    // 3. Generate signed access token with authorization role permissions
    const token = jwt.sign(
      { id: admin._id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET || 'super_secret_india_heritage_key',
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true, 
      token: `Bearer ${token}` 
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal server error processing login.' });
  }
});

/**
 * @route   GET /api/admin/metrics
 * @desc    Compile dashboard telemetry counts using native MongoDB aggregation facets
 * @access  Protected (Admin only)
 */
router.get('/metrics', verifyAdmin, async (req, res) => {
  try {
    const db = req.db;

    // Use native MongoDB facet arrays to count places and calculate unique state representation profiles in 1 pass
    const aggregationCounts = await db.collection('places').aggregate([
      {
        $facet: {
          totalPlaces: [{ $count: "count" }],
          totalStates: [{ $group: { _id: "$stateId" } }, { $count: "count" }]
        }
      }
    ]).toArray();

    // Fetch separate status tracking numbers across user feedback records
    const totalReviews = await db.collection('comments').countDocuments({ status: 'approved' });
    const fallbackStatesCount = await db.collection('states').countDocuments();

    // Safely extract counts or default back to zero indices if data nodes are empty
    const totalPlaces = aggregationCounts[0]?.totalPlaces[0]?.count || 0;
    const totalStates = aggregationCounts[0]?.totalStates[0]?.count || fallbackStatesCount;

    res.status(200).json({ 
      totalStates, 
      totalPlaces, 
      totalReviews 
    });
  } catch (error) {
    console.error('Error in GET /api/admin/metrics:', error);
    res.status(500).json({ message: 'Failed compiling structural control room metrics.' });
  }
});

/**
 * @route   GET /api/admin/places
 * @desc    Retrieve all places for admin management table view
 * @access  Protected (Admin only)
 */
router.get('/places', verifyAdmin, async (req, res) => {
  try {
    const placeDAO = new PlaceModel(req.db);
    const places = await placeDAO.findAll();

    res.status(200).json(places);
  } catch (error) {
    console.error('Error in GET /api/admin/places:', error);
    res.status(500).json({ message: 'Failed fetching places directory.' });
  }
});

/**
 * @route   POST /api/admin/places
 * @desc    Create a new tourist destination profile and automatically resolve category fallback switches
 * @access  Protected (Admin only)
 */
router.post('/places', verifyAdmin, async (req, res) => {
  try {
    const { 
      name, 
      stateId, 
      category, 
      summary, 
      details, 
      bestTime, 
      keyHighlights, 
      isFallbackDefault 
    } = req.body || {};

    // Validation guard rail
    if (!name || !stateId || !category || !summary || !details || !bestTime) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, stateId, category, summary, details, and bestTime are required.' 
      });
    }

    const placeDAO = new PlaceModel(req.db);
    
    // Call DAO layer which natively structures document timestamps and clears older category fallbacks
    const finalizedPlace = await placeDAO.create({
      name,
      stateId,
      category,
      summary,
      details,
      bestTime,
      keyHighlights,
      isFallbackDefault
    });

    res.status(201).json({ 
      success: true, 
      message: 'Destination added successfully!',
      data: finalizedPlace 
    });
  } catch (error) {
    console.error('Error in POST /api/admin/places:', error);
    res.status(500).json({ message: 'Failed writing destination profile onto database.' });
  }
});

/**
 * @route   DELETE /api/admin/places/:id
 * @desc    Remove an existing destination record
 * @access  Protected (Admin only)
 */
router.delete('/places/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const placeDAO = new PlaceModel(req.db);
    const deleted = await placeDAO.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Place not found or already removed.' });
    }

    res.status(200).json({ success: true, message: 'Destination removed successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/places/:id:', error);
    res.status(500).json({ message: 'Failed to delete destination.' });
  }
});

/**
 * @route   GET /api/admin/comments
 * @desc    Retrieve user-generated text inputs matching a requested processing status queue (e.g. pending)
 * @access  Protected (Admin only)
 */
router.get('/comments', verifyAdmin, async (req, res) => {
  const { status } = req.query; // Expects '?status=pending' or '?status=approved'
  
  try {
    const commentDAO = new CommentModel(req.db);
    const commentsQueue = await commentDAO.findByStatus(status);
    
    res.status(200).json(commentsQueue);
  } catch (error) {
    console.error('Error in GET /api/admin/comments:', error);
    res.status(500).json({ message: 'Failed fetching target moderation comment streams.' });
  }
});

/**
 * @route   PATCH /api/admin/comments/:id
 * @desc    Approve and release a held traveler review into public visibility filters
 * @access  Protected (Admin only)
 */
router.patch('/comments/:id', verifyAdmin, async (req, res) => {
  const commentId = req.params.id;

  try {
    const commentDAO = new CommentModel(req.db);
    const result = await commentDAO.approve(commentId);

    if (!result) {
      return res.status(404).json({ message: 'Comment record not found or update failed.' });
    }

    res.status(200).json({ 
      success: true, 
      updatedComment: result 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/comments/:id:', error);
    res.status(500).json({ message: 'Failed applying approval modification patch.' });
  }
});

/**
 * @route   DELETE /api/admin/comments/:id
 * @desc    Permanently drop rule-violating or spam feedback entries from system collections
 * @access  Protected (Admin only)
 */
router.delete('/comments/:id', verifyAdmin, async (req, res) => {
  const commentId = req.params.id;

  try {
    const commentDAO = new CommentModel(req.db);
    const wasDeleted = await commentDAO.delete(commentId);

    if (!wasDeleted) {
      return res.status(404).json({ message: 'Target comment already missing or removed.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Comment wiped from collections.' 
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/comments/:id:', error);
    res.status(500).json({ message: 'Failed executing comments deletion pipeline.' });
  }
});

module.exports = router;
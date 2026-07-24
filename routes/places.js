const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const verifyAdmin = require('../middleware/auth'); // JWT auth middleware [cite: 58]
const PlaceModel = require('../models/Place'); // Native DAO [cite: 93]

/**
 * @route   POST /api/admin/places
 * @desc    Add a new tourist attraction entry with automatic fallback default updates [cite: 20, 21, 66]
 * @access  Protected (Admin only) [cite: 18, 58]
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
    } = req.body || {}; // Guard against undefined body [cite: 87]

    // Validation guard rails
    if (!name || !stateId || !category || !summary || !details || !bestTime) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, stateId, category, summary, details, and bestTime are required.' 
      });
    }

    const placeDAO = new PlaceModel(req.db);

    // Create location record via native DAO [cite: 70]
    const createdPlace = await placeDAO.create({
      name,
      stateId,
      category,
      summary,
      details,
      bestTime,
      keyHighlights,
      isFallbackDefault
    });

    console.log('New destination created:', createdPlace);
    res.status(201).json({
      success: true,
      message: 'Destination added successfully!',
      data: createdPlace
    });

  } catch (error) {
    console.error('Error in POST /api/admin/places:', error);
    res.status(500).json({ message: 'Failed writing destination profile onto database.' });
  }
});

/**
 * @route   GET /api/admin/places
 * @desc    Retrieve all places for admin management table
 * @access  Protected (Admin only) [cite: 58]
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
 * @route   DELETE /api/admin/places/:id
 * @desc    Remove an existing destination record
 * @access  Protected (Admin only) [cite: 58]
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

module.exports = places;
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const PlaceModel = require('../models/Place');

/**
 * @route   GET /api/places
 * @desc    Fetch places filtered by stateId and/or category with dynamic fallback protection
 * @access  Public
 */
router.get('/', async (req, res) => {
  const { stateId, category } = req.query;

  try {
    const placeDAO = new PlaceModel(req.db);
    
    // Execute search with automatic fallback logic handled by PlaceModel DAO
    const places = await placeDAO.findByCategoryWithFallback(stateId, category);

    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Failed fetching location records from server.' });
  }
});

/**
 * @route   GET /api/places/search
 * @desc    Search destinations by keyword (e.g., "temple", "fort", "beach")
 * @access  Public
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required for search.' });
  }

  try {
    const searchRegex = new RegExp(q, 'i'); // Case-insensitive regex match
    
    const results = await req.db.collection('places').find({
      $or: [
        { name: searchRegex },
        { summary: searchRegex },
        { details: searchRegex },
        { category: searchRegex },
        { keyHighlights: searchRegex }
      ]
    }).toArray();

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ message: 'Search query execution failed.' });
  }
});

/**
 * @route   GET /api/places/:id
 * @desc    Fetch a single destination profile by its ObjectId
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid place ID format.' });
  }

  try {
    const place = await req.db.collection('places').findOne({ _id: new ObjectId(id) });

    if (!place) {
      return res.status(404).json({ message: 'Destination profile not found.' });
    }

    res.status(200).json(place);
  } catch (error) {
    console.error('Error fetching place by ID:', error);
    res.status(500).json({ message: 'Failed to retrieve place details.' });
  }
});

module.exports = router;
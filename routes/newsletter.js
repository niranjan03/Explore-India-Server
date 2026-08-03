const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const NewsletterModel = require('../models/Newsletter');

/**
 * @route   GET /api/newsletter/subscribe
 * @desc    Subscribe a user to the newsletter
 * @access  Public  
 *  */
router.get('/subscribe', async (req, res) => {
  const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email query parameter is required for subscription.' });

    }
});

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe a user to the newsletter
 * @access  Public
 */
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  const newsletter = new NewsletterModel(req.db); // Assuming you have access to the database instance
  const result = await newsletter.subscribe(email);
  res.json(result);
});

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Unsubscribe a user from the newsletter
 * @access  Public
 */
router.post('/unsubscribe', async (req, res) => {
    const { email } = req.body;
    const newsletter = new NewsletterModel(db); // Assuming you have access to the database instance
    const result = await newsletter.unsubscribe(email);
    res.json(result);
}
);

module.exports = router;

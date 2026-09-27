const express = require('express');
const analyticsService = require('../services/analytics');

const router = express.Router();

router.post('/track', (req, res) => {
  try {
    const { page, durationMinutes, country, city } = req.body || {};

    const result = analyticsService.trackVisit(req, {
      page,
      durationMinutes,
      country,
      city
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Analytics track failed:', error);
    res.status(500).json({ message: 'Failed to track website visit.' });
  }
});

router.get('/report', (req, res) => {
  try {
    const summary = analyticsService.getAnalyticsSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Analytics report failed:', error);
    res.status(500).json({ message: 'Failed to read analytics report.' });
  }
});

router.get('/visits', (req, res) => {
  try {
    const analytics = analyticsService.readAnalytics();
    res.status(200).json({
      count: analytics.sessions.length,
      sessions: analytics.sessions
    });
  } catch (error) {
    console.error('Analytics visits failed:', error);
    res.status(500).json({ message: 'Failed to fetch visit records.' });
  }
});

module.exports = router;

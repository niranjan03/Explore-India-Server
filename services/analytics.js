const fs = require('fs');
const path = require('path');

const ANALYTICS_FILE = path.join(__dirname, '../data/analytics.json');


function ensureAnalyticsFile() {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    const initialData = {
      totalVisits: 0,
      uniqueVisitors: 0,
      totalMinutes: 0,
      totalHours: 0,
      visitors: {},
      sessions: []
    };

    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readAnalytics() {
  ensureAnalyticsFile();

  try {
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
    const parsed = raw && raw.trim() ? JSON.parse(raw) : {};

    return {
      totalVisits: Number(parsed.totalVisits) || 0,
      uniqueVisitors: Number(parsed.uniqueVisitors) || 0,
      totalMinutes: Number(parsed.totalMinutes) || 0,
      totalHours: Number(parsed.totalHours) || 0,
      visitors: parsed.visitors || {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch (error) {
    console.error('Error reading analytics file:', error.message);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      totalMinutes: 0,
      totalHours: 0,
      visitors: {},
      sessions: []
    };
  }
}

function writeAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeLocation(value) {
  return String(value || 'Unknown').trim();
}

function getClientInfo(req, payload = {}) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.ip || 'unknown');
  const userAgent = req.headers['user-agent'] || 'unknown';
  const country = normalizeLocation(payload.country || req.headers['x-country']);
  const city = normalizeLocation(payload.city || req.headers['x-city']);
  const page = payload.page || req.originalUrl || req.url || '/';

  return {
    ip,
    userAgent,
    country,
    city,
    page,
    language: req.headers['accept-language'] || 'unknown',
    referrer: req.headers.referer || 'direct'
  };
}

function getVisitorKey(info) {
  return `${info.ip}|${info.userAgent}`;
}

function trackVisit(req, payload = {}) {
  const analytics = readAnalytics();
  const info = getClientInfo(req, payload);
  const now = new Date();
  const durationMinutes = Number(payload.durationMinutes || 0);
  const visitorKey = getVisitorKey(info);

  if (!analytics.visitors[visitorKey]) {
    analytics.visitors[visitorKey] = {
      ip: info.ip,
      userAgent: info.userAgent,
      country: info.country,
      city: info.city,
      firstVisit: now.toISOString(),
      lastVisit: now.toISOString(),
      visitCount: 1
    };
    analytics.uniqueVisitors += 1;
  } else {
    analytics.visitors[visitorKey].lastVisit = now.toISOString();
    analytics.visitors[visitorKey].visitCount += 1;
  }

  const session = {
    id: `visit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    page: info.page,
    country: info.country,
    city: info.city,
    ip: info.ip,
    userAgent: info.userAgent,
    referrer: info.referrer,
    language: info.language,
    durationMinutes,
    durationHours: Number((durationMinutes / 60).toFixed(2)),
    visitedAt: now.toISOString()
  };

  analytics.totalVisits += 1;
  analytics.totalMinutes += durationMinutes;
  analytics.totalHours = Number((analytics.totalMinutes / 60).toFixed(2));
  analytics.sessions.push(session);

  writeAnalytics(analytics);

  return {
    message: 'Visit tracked successfully.',
    analytics: {
      totalVisits: analytics.totalVisits,
      uniqueVisitors: analytics.uniqueVisitors,
      totalMinutes: analytics.totalMinutes,
      totalHours: analytics.totalHours,
      lastSession: session
    }
  };
}

function getAnalyticsSummary() {
  const analytics = readAnalytics();
  const pageCounts = {};
  const locationCounts = {};

  analytics.sessions.forEach((session) => {
    const page = session.page || 'unknown';
    const locationKey = `${session.city || 'Unknown'}, ${session.country || 'Unknown'}`;

    pageCounts[page] = (pageCounts[page] || 0) + 1;
    locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
  });

  const mostVisitedPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0] || ['/', 0];
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0] || ['Unknown, Unknown', 0];

  return {
    totalVisits: analytics.totalVisits,
    uniqueVisitors: analytics.uniqueVisitors,
    totalMinutes: analytics.totalMinutes,
    totalHours: analytics.totalHours,
    avgMinutesPerVisit: analytics.totalVisits ? Number((analytics.totalMinutes / analytics.totalVisits).toFixed(2)) : 0,
    mostVisitedPage: {
      page: mostVisitedPage[0],
      count: mostVisitedPage[1]
    },
    topLocation: {
      location: topLocation[0],
      count: topLocation[1]
    },
    recentSessions: analytics.sessions.slice(-10).reverse(),
    visitors: Object.values(analytics.visitors)
  };
}

module.exports = {
  trackVisit,
  getAnalyticsSummary,
  readAnalytics,
  ensureAnalyticsFile
};

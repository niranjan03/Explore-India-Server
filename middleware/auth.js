const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. Security authorization token missing.' });
  }

  // Expect token format: "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_india_heritage_key');
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden. Administrative privileges required.' });
    }
    req.admin = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired authorization token.' });
  }
};
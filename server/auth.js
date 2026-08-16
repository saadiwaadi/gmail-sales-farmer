const SETUP_KEY = process.env.SETUP_KEY || 'change-me-before-deploy';

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  next();
}

module.exports = {
  requireAuth,
  SETUP_KEY
};

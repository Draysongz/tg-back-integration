
// If you're using dotenv
require('dotenv').config();

module.exports = function (req, res, next) {
	const adminToken = req.header('admin-token');

	// Check for admin token
	if (!adminToken) {
		return res.status(401).json({ msg: 'No admin token, authorization denied' });
	}

	// Compare the provided token with the one stored in the configuration
	if (adminToken !== process.env.ADMIN_TOKEN) {
		return res.status(401).json({ msg: 'Invalid admin token' });
	}

	// Token is valid
	next();
};
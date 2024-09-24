const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
	const token = req.header('x-auth-token');

	// Check for token
	if (!token) {
		return res.status(401).json({ msg: 'No token, authorization denied' });
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Add user from payload
		req.user = await User.findById(decoded.user.id);

		next();
	} catch (e) {
		res.status(400).json({ msg: 'Token is not valid' });
	}
};
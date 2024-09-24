module.exports = function (req, res, next) {
	const ipAddress =
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		(req.connection.socket ? req.connection.socket.remoteAddress : null);

	req.ipAddress = ipAddress;
	next();
};

const express = require('express');
const router = express.Router();
const DailyWord = require('../models/DailyWord');
const moment = require('moment');
const adminAuth = require('../middleware/adminAuth');

// @route  POST /api/admin/daily-word/set
// @desc   Set today's daily word
// @access Private (Admin only)
router.post('/daily-word/set', adminAuth, async (req, res) => {
	try {
		const { word, reward } = req.body;

		if (!word || typeof word !== 'string') {
			return res.status(400).json({ msg: 'Invalid word format.' });
		}

		if (!reward || typeof reward !== 'number') {
			return res.status(400).json({ msg: 'Invalid reward value.' });
		}

		const todayStart = moment().startOf('day');
		const todayEnd = moment().endOf('day');

		// Remove existing daily word for today if any
		await DailyWord.deleteMany({
			date: {
				$gte: todayStart.toDate(),
				$lte: todayEnd.toDate(),
			},
		});

		// Create new daily word for today
		const newDailyWord = new DailyWord({
			word,
			reward,
			date: new Date(), // Sets to current date and time
		});

		await newDailyWord.save();

		res.json({ msg: "Today's daily word has been set successfully.", dailyWord: newDailyWord });
	} catch (err) {
		console.error('Error setting daily word:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;

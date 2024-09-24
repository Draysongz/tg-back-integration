const express = require('express');
const router = express.Router();
const Combo = require('../models/Combo');
const adminAuth = require('../middleware/adminAuth');
const moment = require('moment');

// @route  POST /api/admin/combo/set
// @desc   Set today's combo
// @access Private (Admin only)
router.post('/combo/set', adminAuth, async (req, res) => {
	try {
		const { correctCombination, reward } = req.body;

		if (!correctCombination || !Array.isArray(correctCombination)) {
			return res.status(400).json({ msg: 'Invalid combination format.' });
		}

		if (!reward || typeof reward !== 'number') {
			return res.status(400).json({ msg: 'Invalid reward value.' });
		}

		const today = moment().startOf('day');

		// Remove existing combo for today if any
		await Combo.deleteMany({
			date: {
				$gte: today.toDate(),
				$lt: moment(today).endOf('day').toDate(),
			},
		});

		// Create new combo for today
		const newCombo = new Combo({
			correctCombination,
			reward,
			date: new Date(), // Sets to current date and time
		});

		await newCombo.save();

		res.json({ msg: "Today's combo has been set successfully.", combo: newCombo });
	} catch (err) {
		console.error('Error setting combo:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
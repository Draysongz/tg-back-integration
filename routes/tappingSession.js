// routes/tappingSession.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Referral = require('../models/Referral');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');
const addReferralEarnings = require('../utils/referralHelper');

// @route  POST /api/tapping-session/complete
// @desc   Complete a tapping session
// @access Private
router.post('/complete', auth, async (req, res) => {
	try {
		const user = req.user;
		const { taps } = req.body;

		const REQUIRED_TAPS_PER_SESSION = 60;
		const MAX_SESSIONS_PER_CYCLE = 5;
		const COOLDOWN_DURATION = 20 * 60 * 60 * 1000; // 20 hours in milliseconds

		// Validate taps
		if (taps < REQUIRED_TAPS_PER_SESSION) {
			return res.status(400).json({ msg: 'Not enough taps to complete the session.' });
		}

		// Check for cooldown
		const now = Date.now();
		if (user.cooldownStartTimestamp && now < user.cooldownStartTimestamp + COOLDOWN_DURATION) {
			const timeRemaining = user.cooldownStartTimestamp + COOLDOWN_DURATION - now;
			return res.status(400).json({
				msg: `You are on cooldown. Please wait ${Math.ceil(timeRemaining / 3600000)} hours.`,
			});
		}

		// Check session count
		if (user.sessionCount >= MAX_SESSIONS_PER_CYCLE) {
			// Start cooldown
			user.cooldownStartTimestamp = now;
			user.sessionCount = 0;
			await user.save();
			return res.status(400).json({
				msg: 'You have reached the maximum sessions for this cycle. Cooldown started.',
			});
		}

		// Increment session count and reward user
		user.sessionCount += 1;
		const reward = 100; // Set your reward amount

		// Modify user balance and log transaction
		await updateUserBalance(user._id, reward, 'Tapping Session Reward');

		await user.save();

		// Referral bonus calculation
		if (user.referredBy) {
			await addReferralEarnings(user._id, reward)
		}

		res.json({
			msg: `Session completed! You have earned ${reward} tokens.`,
			balance: user.balance,
			sessionCount: user.sessionCount,
		});
	} catch (err) {
		console.error('Error completing tapping session:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;

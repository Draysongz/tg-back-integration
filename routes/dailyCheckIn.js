const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');
const addReferralEarnings = require('../utils/referralHelper');

// @route  POST /api/daily-checkin/claim
// @desc   Claim daily check-in reward
// @access Private
router.post('/claim', auth, async (req, res) => {
	try {
		var user = req.user;

		// Initialize dailyCheckIn if undefined
		if (!user.dailyCheckIn) {
			user.dailyCheckIn = {
				streak: 0,
				lastCheckInDate: null,
			};
		}

		// Initialize lastDailyCheckInClaimDate if undefined


		const today = moment().startOf('day');
		const lastClaimDate = user.dailyCheckIn.lastClaimDate
			? moment(user.dailyCheckIn.lastClaimDate).startOf('day')
			: null;

		// Check if the user has already claimed today
		if (lastClaimDate && today.isSame(lastClaimDate)) {
			return res.status(400).json({ msg: 'You have already claimed your daily check-in reward today.' });
		}

		// Calculate reward based on current streak
		const currentStreak = user.dailyCheckIn.streak || 0;
		const reward = currentStreak * 100; // 100 coins per day, up to 700

		// Assign reward
		user = await updateUserBalance(
			user._id,
			reward,
			`Completed daily check-in streak "${currentStreak}"`,
		);

		// Update lastDailyCheckInClaimDate to today
		user.dailyCheckIn.lastClaimDate = new Date();
		await user.save();

		// Referral bonus calculation
		if (user.referredBy) {
			await addReferralEarnings(user._id, reward);
		}

		res.json({
			msg: `You have claimed ${reward} coins for Day ${currentStreak}!`,
			balance: user.balance,
			streak: currentStreak,
		});

	} catch (error) {
		console.error('Error in daily check-in claim:', error.message);
		res.status(500).send('Server Error');
	}
});


module.exports = router;
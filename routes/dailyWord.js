const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const DailyWord = require('../models/DailyWord');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');
const addReferralEarnings = require('../utils/referralHelper');

// @route  POST /api/daily-word/guess
// @desc   Submit daily word guess
// @access Private
router.post('/guess', auth, async (req, res) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ msg: 'User not authenticated.' });
		}

		const { word } = req.body;

		if (!word) {
			return res.status(400).json({ msg: 'No word provided.' });
		}

		const now = moment();
		const todayStart = moment().startOf('day');
		const todayEnd = moment().endOf('day');

		// Check if the user has already received the daily word reward today
		let lastDailyWordRewardDate = null;
		if (user.lastDailyWordRewardDate) {
			lastDailyWordRewardDate = moment(user.lastDailyWordRewardDate).startOf('day');
		}

		if (lastDailyWordRewardDate && todayStart.isSame(lastDailyWordRewardDate)) {
			// Calculate time until next daily word becomes available
			const nextDailyWordAvailableIn = todayEnd.diff(now, 'seconds');
			return res.status(200).json({
				msg: 'You have already received the daily word reward today.',
				nextDailyWordAvailableIn,
			});
		}

		// Fetch today's daily word
		const dailyWord = await DailyWord.findOne({
			date: {
				$gte: todayStart.toDate(),
				$lte: todayEnd.toDate(),
			},
		});

		if (!dailyWord) {
			return res.status(200).json({ msg: 'No daily word is set for today. Please try again later.' });
		}

		// Compare the guess
		if (word.trim().toLowerCase() === dailyWord.word.trim().toLowerCase()) {
			// Calculate the reward
			const reward = dailyWord.reward;

			// Modify user balance and log transaction
			const newBalance = (await updateUserBalance(user._id, reward, 'Daily Word Reward')).balance;

			user.lastDailyWordRewardDate = new Date();
			await user.save();

			// Referral bonus calculation
			if (user.referredBy) {
				await addReferralEarnings(user._id, reward)
			}

			// Calculate time until next daily word
			const nextDailyWordTime = moment(user.lastDailyWordRewardDate).add(1, 'day').startOf('day');
			const timeUntilNextDailyWord = nextDailyWordTime.diff(moment(), 'seconds');

			res.json({
				msg: `Correct! You have earned ${dailyWord.reward} tokens.`,
				balance: newBalance,
				nextDailyWordAvailableIn: timeUntilNextDailyWord,
			});

		} else {
			res.json({ msg: 'Incorrect word. Try again!' });
		}
	} catch (err) {
		console.error('Error in daily word guess:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
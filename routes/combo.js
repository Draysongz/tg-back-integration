const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Combo = require('../models/Combo');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');
const addReferralEarnings = require('../utils/referralHelper');

// @route  POST /api/combo/guess
// @desc   Submit emoji combination guess
// @access Private

router.post('/guess', auth, async (req, res) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ msg: 'User not authenticated.' });
		}

		const { guess } = req.body; // expect an array of emojis

		if (!guess || !Array.isArray(guess)) {
			return res.status(400).json({ msg: 'Invalid guess format.' });
		}

		const now = moment();
		const today = moment().startOf('day');

		// Calculate next combo open countdown (time until next midnight)
		const nextMidnight = moment().endOf('day').add(1, 'second');
		const nextComboOpenCountdown = nextMidnight.diff(now, 'seconds');

		// Check if the user has already received the combo reward today
		let lastComboRewardDate = null;
		if (user.lastComboRewardDate) {
			lastComboRewardDate = moment(user.lastComboRewardDate).startOf('day');
		}

		if (lastComboRewardDate && today.isSame(lastComboRewardDate)) {
			return res.status(200).json({
				msg: 'You have already received the combo reward today.',
				nextComboOpenCountdown,
			});
		}

		// Fetch today's combo
		let combo = await Combo.findOne({
			date: {
				$gte: today.toDate(),
				$lt: moment(today).endOf('day').toDate(),
			},
		});

		if (!combo) {
			// If today's combo is missing, fetch the last available combo
			combo = await Combo.findOne().sort({ date: -1 });
			if (!combo) {
				return res.status(200).json({ msg: 'No combo is set currently.' });
			}
		}

		// Compare the guess
		const isCorrect =
			JSON.stringify(guess) === JSON.stringify(combo.correctCombination);

		if (isCorrect) {
			const newUserBalance = (await updateUserBalance(user._id, combo.reward, 'Combo Guess Correct')).balance;
			user.lastComboRewardDate = new Date(); // Update the reward date to now
			await user.save();

			// Referral bonus calculation
			if (user.referredBy) {
				await addReferralEarnings(user._id, combo.reward)
			}

			// Calculate time until next combo
			const nextComboTime = moment(user.lastComboRewardDate).add(1, 'day').startOf('day');
			const timeUntilNextCombo = nextComboTime.diff(moment(), 'seconds');


			res.json({
				msg: `Correct! You have earned ${combo.reward} coins.`,
				balance: newUserBalance,
				nextComboOpenCountdown,
			});
		} else {
			res.json({
				msg: 'Incorrect combination. Try again!',
				nextComboOpenCountdown,
			});
		}
	} catch (err) {
		console.error('Error in combo guess:', err.message);
		res.status(500).json({ msg: 'Server Error' });
	}
});


module.exports = router;
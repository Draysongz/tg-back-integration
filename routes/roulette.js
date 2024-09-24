// In routes/roulette.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');

// Utility function to shuffle an array
function shuffleArray(array) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
	return array
}

// @route  GET /api/roulette/config
// @desc   Get roulette configuration for the user
// @access Private
router.get('/config', auth, async (req, res) => {
	try {
		const user = req.user;

		const today = moment().startOf('day');

		// Check if the user's roulette configuration is for today
		if (
			!user.rouletteConfig ||
			!user.rouletteConfig.dateCreated ||
			!moment(user.rouletteConfig.dateCreated).isSame(today, 'day')
		) {
			// Generate new roulette configuration for today

			// Create an array of rewards from 100 to 1000 in increments of 100
			const rewards = [];
			for (let i = 100; i <= 1000; i += 100) {
				rewards.push(i);
			}

			// Shuffle the rewards array to randomize placement
			const shuffledRewards = shuffleArray(rewards);

			// Randomly select a reward index (since we have 10 rewards, index will be from 0 to 9)
			const selectedIndex = Math.floor(Math.random() * shuffledRewards.length);

			// Update user's roulette configuration
			user.rouletteConfig = {
				rewards: shuffledRewards,
				selectedIndex,
				dateCreated: today.toDate(),
			};
			await user.save();
		}

		// Check if user has already spun today
		let hasSpunToday = false;
		if (user.rouletteConfig.lastRouletteSpinDate) {
			hasSpunToday = moment(user.rouletteConfig.lastRouletteSpinDate).isSame(today, 'day');
		}

		res.json({
			rewards: user.rouletteConfig.rewards,
			hasSpunToday,
			selectedIndex: user.rouletteConfig.selectedIndex, // Return the predetermined winning index
		});
	} catch (err) {
		console.error('Error getting roulette configuration:', err.message);
		res.status(500).send('Server Error');
	}
});

// @route  POST /api/roulette/spin
// @desc   Spin the roulette wheel
// @access Private
router.post('/spin', auth, async (req, res) => {
	try {
		const user = req.user;

		const today = moment().startOf('day');

		// Check if user has already spun today
		if (user.rouletteConfig.lastRouletteSpinDate && moment(user.rouletteConfig.lastRouletteSpinDate).isSame(today, 'day')) {
			return res.status(400).json({ msg: 'You have already spun the roulette today.' });
		}

		// Check if user has enough balance
		const spinCost = 0; // Cost to spin the roulette
		if (user.balance < spinCost) {
			return res.status(400).json({ msg: 'Insufficient balance to spin the roulette.' });
		}

		// Deduct the spin cost from user's balance
		await updateUserBalance(user._id, -spinCost, 'Roulette Spin Cost');

		// Ensure user's roulette configuration is for today
		if (
			!user.rouletteConfig ||
			!user.rouletteConfig.dateCreated ||
			!moment(user.rouletteConfig.dateCreated).isSame(today, 'day')
		) {
			return res.status(400).json({ msg: 'Roulette configuration not found. Please refresh the roulette screen.' });
		}

		const rewards = user.rouletteConfig.rewards;

		// Use the predetermined reward index
		const selectedIndex = user.rouletteConfig.selectedIndex;
		const reward = rewards[selectedIndex];

		// Add the reward to user's balance
		const newBalance = (await updateUserBalance(user._id, reward, 'Roulette Spin Reward')).balance;
		user.rouletteConfig.lastRouletteSpinDate = new Date();

		await user.save();

		// Add referral bonus
		if (user.referredBy) {
			await addReferralEarnings(user._id, reward); // 20% referral bonus
		}

		res.json({
			msg: `You have won ${reward} tokens!`,
			reward: reward,
			balance: newBalance,
			selectedIndex, // Index of the reward to animate on the frontend
		});
	} catch (err) {
		console.error('Error spinning roulette:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;

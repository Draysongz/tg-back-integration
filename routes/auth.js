const express = require('express');
const router = express.Router();
const User = require('../models/User');
const getIP = require('../middleware/getIP');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const generateReferralCode = require('../utils/generateReferralCode');
const {
	verifyJoinTelegramGroup,
	simulateTaskCompletion,
	verifyGuessDailyWords,
	verifyGuessCombo,
	verifyConnectTonWallet,
	verifyPremiumReferrals,
	verifyActiveReferrals,
	handleActiveReferralStatusUpdate,
	handlePremiumReferralStatusUpdate,
	verifyOpenAppStreak,
	verifyDailyCheckIn
} = require('../helpers/taskVerifiers'); // Adjusted path

// Your bot token from BotFather
const BOT_TOKEN = process.env.BOT_TOKEN;

// Helper function to validate initData
function validateInitData(initData) {
	// Parse the query string into key-value pairs
	const parsedData = new URLSearchParams(initData);
	const hash = parsedData.get('hash');
	parsedData.delete('hash');

	// Sort the parameters in alphabetical order
	const sortedParams = [...parsedData.entries()]
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join('\n');

	// Compute the secret key
	const secretKey = crypto
		.createHmac('sha256', 'WebAppData')
		.update(BOT_TOKEN)
		.digest();

	// Compute the HMAC SHA-256 hash
	const computedHash = crypto
		.createHmac('sha256', secretKey)
		.update(sortedParams)
		.digest('hex');

	// Compare hashes
	return computedHash === hash;
}

// @route  POST /api/auth/login
// @desc   Register or login user
// @access Public
router.post('/login', getIP, async (req, res) => {
	try {
		const { initData, referralCode } = req.body;
		const ipAddress = req.ipAddress;

		if (!initData) {
			return res.status(400).json({ msg: 'No initData provided' });
		}

		// Validate initData
		const isValid = validateInitData(initData);

		if (!isValid) {
			return res.status(400).json({ msg: 'Invalid initData' });
		}

		// Parse initDataUnsafe
		const parsedData = new URLSearchParams(initData);
		const userDataJson = parsedData.get('user');
		const authDate = parsedData.get('auth_date');

		if (!userDataJson) {
			return res.status(400).json({ msg: 'No user data available' });
		}

		const telegramUser = JSON.parse(userDataJson);
		const telegramId = telegramUser.id.toString();

		let user = await User.findOne({ telegramId });

		if (!user) {
			// Get country from IP address
			let country = 'Unknown';
			try {
				const response = await axios.get(
					`https://ipapi.co/${ipAddress}/json/`
				);
				country = response.data.country_name || 'Unknown';
			} catch (err) {
				console.log('IP lookup failed:', err.message);
			}

			// Generate a unique referral code
			const referralCodeForUser = await generateReferralCode()
			// Create new user
			user = new User({
				telegramId,
				username: telegramUser.username,
				first_name: telegramUser.first_name,
				last_name: telegramUser.last_name,
				photo_url: telegramUser.photo_url,
				language_code: telegramUser.language_code,
				is_premium: telegramUser.is_premium || false,
				allows_write_to_pm: telegramUser.allows_write_to_pm || false,
				auth_date: authDate,
				ipAddress,
				country,
				referralCode: referralCodeForUser,
				lastLogin: new Date(),
			});
			// Handle referral
			if (referralCode) {
				const referrer = await User.findOne({ referralCode });
				if (referrer && referrer._id.toString() !== user._id.toString()) {
					user.referredBy = referrer._id;

					// Save referral relationship
					const Referral = require('../models/Referral');
					const referral = new Referral({
						referrer: referrer._id,
						referee: user._id,
					});
					await referral.save();
				}
			}

			await user.save();
			console.log('New user registered:', user);
		} else {
			// Update last login date
			user.lastLogin = new Date();
			await user.save();
			console.log('User logged in:', user);
		}



		const today = moment().startOf('day');
		const lastCheckInDate = user.dailyCheckIn.lastCheckInDate
			? moment(user.dailyCheckIn.lastCheckInDate).startOf('day')
			: null;

		let currentStreak = user.dailyCheckIn.streak || 0;
		let hasClaimedToday = false;

		if (lastCheckInDate && today.isSame(lastCheckInDate)) {
			// User has already checked in today
			hasClaimedToday = true;
			// currentStreak remains the same
		} else if (lastCheckInDate && today.diff(lastCheckInDate, 'days') === 1) {
			// User can continue the streak
			currentStreak += 1;
			if (currentStreak > 7) {
				currentStreak = 1;
			}
		} else {
			// User's streak resets
			currentStreak = 1;
		}

		// Update streak and lastCheckInDate
		user.dailyCheckIn.streak = currentStreak;
		user.dailyCheckIn.lastCheckInDate = new Date();

		await user.save();

		// Calculate today's and tomorrow's rewards (optional for frontend)
		const todayReward = currentStreak * 100; // 100 TonCoins per day as per your requirement

		let tomorrowStreak = currentStreak + 1;
		if (tomorrowStreak > 7) {
			tomorrowStreak = 1;
		}
		const tomorrowReward = tomorrowStreak * 100;

		// Call verifyOpenAppStreak if needed
		const openAppStreakResult = await verifyOpenAppStreak(user);



		// Generate JWT token
		const payload = {
			user: {
				id: user.id,
			},
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: '7d',
		});

		// Include daily check-in info in response
		res.json({
			msg: 'Success',
			user,
			token,
			dailyCheckIn: {
				currentDay: currentStreak,
				todayReward: todayReward,
				tomorrowReward: tomorrowReward,
				hasClaimedToday: hasClaimedToday,
			},
			openAppStreakResult
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
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
        console.log("Login initiated...", initData);
        const ipAddress = req.ipAddress;

        if (!initData) {
            return res.status(400).json({ msg: 'No initData provided' });
        }

        // Validate initData
        if (!validateInitData(initData)) {
            console.log("Invalid initData");
            return res.status(400).json({ msg: 'Invalid initData' });
        }

        const parsedData = new URLSearchParams(initData);
        const userDataJson = parsedData.get('user');
        const authDate = parsedData.get('auth_date');

        if (!userDataJson) {
            console.log("No user data available");
            return res.status(400).json({ msg: 'No user data available' });
        }

        const telegramUser = JSON.parse(userDataJson);
        const telegramId = telegramUser.id.toString();
        let user = await User.findOne({ telegramId });

        if (!user) {
            const country = await fetchCountryFromIP(ipAddress);
            const referralCodeForUser = await generateReferralCode();
            user = await createUser(telegramUser, authDate, ipAddress, country, referralCodeForUser, referralCode);
            console.log('New user registered:', user);
        } else {
            user.lastLogin = new Date();
            await user.save();
            console.log('User logged in:', user);
        }

        const dailyCheckInData = await handleDailyCheckIn(user);
        const token = generateToken(user.id);

        res.json({
            msg: 'Success',
            user,
            token,
            dailyCheckIn: dailyCheckInData,
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Helper functions
async function fetchCountryFromIP(ipAddress) {
    try {
        const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
        return response.data.country_name || 'Unknown';
    } catch (err) {
        console.log('IP lookup failed:', err.message);
        return 'Unknown';
    }
}

async function createUser(telegramUser, authDate, ipAddress, country, referralCodeForUser, referralCode) {
    const newUser = new User({
        telegramId: telegramUser.id.toString(),
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

    if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer && referrer._id.toString() !== newUser._id.toString()) {
            newUser.referredBy = referrer._id;
            await saveReferral(referrer, newUser);
        }
    }

    await newUser.save();
    return newUser;
}

async function saveReferral(referrer, referee) {
    const Referral = require('../models/Referral');
    const referral = new Referral({
        referrer: referrer._id,
        referee: referee._id,
    });
    await referral.save();
}

async function handleDailyCheckIn(user) {
    const today = moment().startOf('day');
    const lastCheckInDate = user.dailyCheckIn.lastCheckInDate
        ? moment(user.dailyCheckIn.lastCheckInDate).startOf('day')
        : null;

    let currentStreak = user.dailyCheckIn.streak || 0;
    let hasClaimedToday = false;

    if (lastCheckInDate && today.isSame(lastCheckInDate)) {
        hasClaimedToday = true;
    } else if (lastCheckInDate && today.diff(lastCheckInDate, 'days') === 1) {
        currentStreak = Math.min(currentStreak + 1, 7);
    } else {
        currentStreak = 1;
    }

    user.dailyCheckIn.streak = currentStreak;
    user.dailyCheckIn.lastCheckInDate = new Date();
    await user.save();

    const todayReward = currentStreak * 100;
    const tomorrowReward = Math.min(currentStreak + 1, 7) * 100;

    return {
        currentDay: currentStreak,
        todayReward,
        tomorrowReward,
        hasClaimedToday,
    };
}

function generateToken(userId) {
    const payload = { user: { id: userId } };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}


module.exports = router;
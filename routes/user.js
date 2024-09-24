// routes/user.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Referral = require('../models/Referral');

// @route  GET /api/user/transactions
// @desc   Get user's transaction history
// @access Private
router.get('/transactions', auth, async (req, res) => {
	try {
		const user = req.user;

		// Sort transactions by date in descending order
		const transactions = user.transactions.sort((a, b) => b.date - a.date);

		res.json({ transactions });
	} catch (err) {
		console.error('Error fetching transaction history:', err.message);
		res.status(500).send('Server Error');
	}
});


// @route  GET /api/user
// @desc   Get comprehensive user information
// @access Private
router.get('/', auth, async (req, res) => {
	try {
		const user = req.user;

		// Populate the referrer (if any)
		await user.populate('referredBy').execPopulate();

		// Fetch all referrals (friends) and their total earnings
		const referrals = await Referral.find({ referrer: user._id }).populate('referee');

		const friends = referrals.map(referral => ({
			id: referral.referee._id,
			username: referral.referee.username || '',
			firstName: referral.referee.first_name || '',
			lastName: referral.referee.last_name || '',
			photoUrl: referral.referee.photoUrl || '',
			totalEarningsFromReferee: referral.totalEarningsFromReferee || 0,
		}));

		// Structure the user data to send in response
		const userData = {
			id: user._id,
			telegramId: user.telegramId,
			username: user.username || '',
			firstName: user.first_name || '',
			lastName: user.last_name || '',
			photoUrl: user.photoUrl || '',
			languageCode: user.language_code || '',
			isPremium: user.is_premium || false,
			allowsWriteToPM: user.allows_write_to_pm || false,
			authDate: user.auth_date ? user.auth_date.toISOString() : null,
			ipAddress: user.ipAddress || '',
			country: user.country || '',
			referralCode: user.referralCode || '',
			referralLink: user.referralLink || '',
			referredBy: user.referredBy
				? {
					id: user.referredBy._id,
					username: user.referredBy.username || '',
					firstName: user.referredBy.first_name || '',
					lastName: user.referredBy.last_name || '',
				}
				: null,
			pendingReferralEarnings: user.pendingReferralEarnings || 0,
			totalReferralEarnings: user.totalReferralEarnings || 0,
			earningsSinceLastClaim: user.earningsSinceLastClaim || 0,
			lastReferralClaimDate: user.lastReferralClaimDate
				? user.lastReferralClaimDate.toISOString()
				: null,
			transactions: user.transactions.map(tx => ({
				amount: tx.amount,
				reason: tx.reason,
				date: tx.date ? tx.date.toISOString() : null,
			})),
			dailyCheckIn: {
				streak: user.dailyCheckIn.streak || 0,
				lastCheckInDate: user.dailyCheckIn.lastCheckInDate
					? user.dailyCheckIn.lastCheckInDate.toISOString()
					: null,
			},
			lastDailyWordRewardDate: user.lastDailyWordRewardDate
				? user.lastDailyWordRewardDate.toISOString()
				: null,
			lastRouletteSpin: user.rouletteConfig.lastRouletteSpinDate
				? user.rouletteConfig.lastRouletteSpinDate.toISOString()
				: null,
			rouletteConfig: user.rouletteConfig
				? {
					rewards: user.rouletteConfig.rewards || [],
					date: user.rouletteConfig.dateCreated
						? user.rouletteConfig.dateCreated.toISOString()
						: null,
					selectedIndex: user.rouletteConfig.selectedIndex || null,
				}
				: null,
			lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
			friends, // List of referees with their earnings
		};

		res.json(userData);
	} catch (err) {
		console.error('Error fetching user information:', err.message);
		res.status(500).json({ msg: 'Server Error' });
	}
});


module.exports = router;

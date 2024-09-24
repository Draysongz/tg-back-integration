// routes/referral.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Referral = require('../models/Referral');
const User = require('../models/User');
const moment = require('moment');
const updateUserBalance = require('../utils/updateUserBalance');

// @route  GET /api/referral/summary
// @desc   Get referral summary for the user
// @access Private
router.get('/summary', auth, async (req, res) => {
	try {
		const user = req.user;

		// Generate referral link if not already generated
		if (!user.referralLink) {
			const referralCode = user.referralCode || user._id.toString();
			user.referralLink = `https://yourapp.com/register?ref=${referralCode}`;
			user.referralCode = referralCode;
			await user.save();
		}

		// Check if user can claim today
		const today = moment().startOf('day');
		const lastClaimDate = user.lastReferralClaimDate
			? moment(user.lastReferralClaimDate).startOf('day')
			: null;

		let claimAvailable = true;
		let timeUntilNextClaim = 0;

		if (lastClaimDate && today.isSame(lastClaimDate)) {
			claimAvailable = false;
			const nextClaimTime = moment(user.lastReferralClaimDate).add(1, 'day').startOf('day');
			timeUntilNextClaim = nextClaimTime.diff(moment(), 'seconds');
		}

		const amountToClaim = user.pendingReferralEarnings;

		// Prepare friends list with earnings from each referral
		const referrals = await Referral.find({ referrer: user._id }).populate('referee');

		const friends = referrals.map((referral) => {
			const referee = referral.referee;
			return {
				photoUrl: referee.photoUrl || '',
				firstName: referee.first_name,
				lastName: referee.last_name,
				username: referee.username,
				totalEarningsFromReferee: referral.totalEarningsFromReferee || 0,
			};
		});
		claimAvailable = amountToClaim > 0 ? true : false;

		res.json({
			pendingReferralEarnings: amountToClaim,
			claimAvailable,
			timeUntilNextClaim,
			referralLink: user.referralLink,
			friends,
		});
	} catch (err) {
		console.error('Error getting referral summary:', err.message);
		res.status(500).send('Server Error');
	}
});

// @route  POST /api/referral/claim
// @desc   Claim referral earnings
// @access Private
router.post('/claim', auth, async (req, res) => {
	try {
		const user = req.user;

		// Check if user can claim today
		const today = moment().startOf('day');
		const lastClaimDate = user.lastReferralClaimDate
			? moment(user.lastReferralClaimDate).startOf('day')
			: null;

		if (lastClaimDate && today.isSame(lastClaimDate)) {
			const nextClaimTime = moment(user.lastReferralClaimDate).add(1, 'day').startOf('day');
			const timeUntilNextClaim = nextClaimTime.diff(moment(), 'seconds');
			return res.status(400).json({
				msg: 'You have already claimed your referral earnings today.',
				claimAvailable: false,
				timeUntilNextClaim,
			});
		}

		const amountToClaim = user.pendingReferralEarnings;

		if (amountToClaim <= 0) {
			return res.status(400).json({ msg: 'No referral earnings to claim.' });
		}

		// Modify user balance and log transaction
		await updateUserBalance(user._id, amountToClaim, 'Referral Earnings Claim');

		user.pendingReferralEarnings = 0;
		user.lastReferralClaimDate = new Date();

		// Reset earningsSinceLastClaim for all referrals
		await Referral.updateMany(
			{ referrer: user._id },
			{ $set: { earningsSinceLastClaim: 0 } }
		);

		await user.save();

		// Calculate time until next claim
		const nextClaimTime = moment(user.lastReferralClaimDate).add(1, 'day').startOf('day');
		const timeUntilNextClaim = nextClaimTime.diff(moment(), 'seconds');
		res.json({
			msg: `You have claimed ${amountToClaim} tokens from referrals.`,
			balance: user.balance,
			claimAvailable: false,
			timeUntilNextClaim,
		});
	} catch (err) {
		console.error('Error claiming referral earnings:', err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;

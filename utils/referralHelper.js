// utils/referralHelper.js

const Referral = require('../models/Referral');
const updateUserBalance = require('./updateUserBalance');
const User = require('../models/User'); // Import the User model

/**
 * Adds referral earnings to the referrer based on the amount earned by the referee.
 *
 * @param {mongoose.Types.ObjectId} refereeId - The ID of the referee.
 * @param {Number} amountEarned - The amount earned by the referee.
 * @param {Number} percentage - The referral percentage (e.g., 0.20 for 20%).
 */
async function addReferralEarnings(refereeId, amountEarned, percentage = 0.20) {
	const referral = await Referral.findOne({ referee: refereeId }).populate('referrer');

	if (referral && referral.referrer) {
		const referralBonus = amountEarned * percentage;

		// Update referrer's earnings
		referral.referrer.pendingReferralEarnings += referralBonus;
		referral.referrer.totalReferralEarnings += referralBonus;
		referral.referrer.earningsSinceLastClaim += referralBonus;

		// Log transaction for referrer
		await updateUserBalance(referral.referrer._id, referralBonus, `Referral Bonus from ${referral.referee.username || referral.referee.first_name}`);

		// Update Referral document
		referral.totalEarningsFromReferee += referralBonus;
		referral.earningsSinceLastClaim += referralBonus;
		await referral.save();
	}
}

/**
 * Counts the number of active referrals for a given user.
 * @param {String} userId - The ID of the user (referrer).
 * @returns {Number} - The count of active referrals.
 */
const countActiveReferrals = async (userId) => {
	try {
		// Find all referrals where the user is the referrer
		const referrals = await Referral.find({ referrer: userId }).populate('referee', 'balance');

		// Filter referrals where referee's balance > 0
		const activeReferrals = referrals.filter(ref => ref.referee && ref.referee.balance > 0);

		return activeReferrals.length;
	} catch (error) {
		console.error(`Error counting active referrals for user ${userId}:`, error.message);
		return 0;
	}
};


/**
 * Counts the number of premium referrals for a given user.
 * @param {String} userId - The ID of the user (referrer).
 * @returns {Number} - The count of premium referrals.
 */
const countPremiumReferrals = async (userId) => {
	try {
		// Find all referrals where the user is the referrer
		const referrals = await Referral.find({ referrer: userId }).populate('referee', 'is_premium');

		// Filter referrals where referee is premium
		const premiumReferrals = referrals.filter(ref => ref.referee && ref.referee.is_premium);

		return premiumReferrals.length;
	} catch (error) {
		console.error(`Error counting premium referrals for user ${userId}:`, error.message);
		return 0;
	}
};


module.exports = {
	addReferralEarnings,
	countActiveReferrals,
	countPremiumReferrals
	// Other referral helper functions can be exported here
};

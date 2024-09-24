// utils/generateReferralCode.js

const crypto = require('crypto');
const User = require('../models/User');

/**
 * Generates a unique referral code.
 *
 * @param {Number} length - The length of the referral code.
 * @returns {Promise<String>} - A unique referral code.
 */
async function generateReferralCode(length = 12) {
	let referralCode;
	let exists = true;

	while (exists) {
		referralCode = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
		const user = await User.findOne({ referralCode });
		if (!user) {
			exists = false;
		}
	}

	return referralCode;
}

module.exports = generateReferralCode;

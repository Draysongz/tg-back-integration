const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
	referrer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	referee: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	totalEarningsFromReferee: {
		type: Number,
		default: 0,
	},
	earningsSinceLastClaim: {
		type: Number,
		default: 0,
	},
});

module.exports = mongoose.model('Referral', ReferralSchema);

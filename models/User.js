const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	telegramId: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	username: String,
	first_name: String,
	last_name: String,
	language_code: String,
	is_premium: {
		type: Boolean,
		default: false,
	},
	allows_write_to_pm: {
		type: Boolean,
		default: false,
	},
	photo_url: String,
	auth_date: Number,
	ipAddress: String,
	country: String,
	balance: {
		type: Number,
		default: 0,
	},
	tapCount: {
		type: Number,
		default: 0,
	},
	sessionCount: {
		type: Number,
		default: 0,
	},
	lastSessionTimestamp: Date,
	cooldownStartTimestamp: Date,
	//Referal
	referralCode: {
		type: String,
		unique: true,
	},
	referredBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	pendingReferralEarnings: {
		type: Number,
		default: 0,
	},
	totalReferralEarnings: {
		type: Number,
		default: 0,
	},
	referralLink: String,

	// Transaction history
	transactions: [
		{
			amount: Number,
			reason: String,
			date: Date,
		},
	],
	// Add this field to store the referral link
	//
	lastReferralClaimDate: Date,
	dailyCheckIn: {
		streak: {
			type: Number,
			default: 0,
		},
		lastCheckInDate: {
			type: Date,
			default: null,
		},
		lastClaimDate: {
			type: Date,
			default: null,
		}
	},
	openAppStreak: { // New Field for 30-Day Streak
		streak: {
			type: Number,
			default: 0,
		},
		lastCheckInDate: {
			type: Date,
			default: null,
		},
	},

	tasksCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	lastComboRewardDate: Date,
	lastDailyWordRewardDate: Date,

	// Roulette configuration for the user
	// Roulette configuration for the user
	rouletteConfig: {
		rewards: [Number],   // Array of 10 reward values for the roulette
		selectedIndex: Number, // The predetermined index of the reward
		dateCreated: Date, 		// Date when the roulette configuration was generated
		lastRouletteSpinDate: Date, // Date when the user last spun the roulette
	},
	// Date when the user last spun the roulette
	lastLogin: Date,
	guessWordCombos: [Date], // Logs each day the user successfully guesses a daily word.
	guessCombos: [Date],
	tonWalletAddress: {
		type: String,
	},



}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
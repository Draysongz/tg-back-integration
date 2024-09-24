const mongoose = require('mongoose');

const DailyWordSchema = new mongoose.Schema({
	word: String,
	reward: Number,
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('DailyWord', DailyWordSchema);
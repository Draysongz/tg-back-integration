const mongoose = require('mongoose');

const ComboSchema = new mongoose.Schema({
	correctCombination: [String], // e.g., ['😀', '🎉', '🚀']
	reward: Number,
	date: {
		type: Date,
		default: Date.now, // Automatically sets to today's date when created
	},
});

module.exports = mongoose.model('Combo', ComboSchema);
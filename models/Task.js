// src/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true // Ensures each task name is unique
	},
	description: {
		type: String,
		required: true
	},
	reward: {
		type: Number,
		required: true
	},
	condition: {
		type: String, // e.g., "join_telegram_group"
		required: true
	},
	imageLink: {
		type: String, // URL or relative path to the task image
		required: true
	},
	isRepeatable: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Task', TaskSchema);

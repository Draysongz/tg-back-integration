// src/models/UserTask.js
const mongoose = require('mongoose');

const UserTaskSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true // Optimizes queries based on user
	},
	task: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task',
		required: true,
		index: true // Optimizes queries based on task
	},
	status: {
		type: String,
		enum: ['not_started', 'doing', 'done', 'failed'],
		default: 'not_started',
		required: true
	},
	progress: {
		type: mongoose.Schema.Types.Mixed,
		default: {} // Can store task-specific progress data
	},
	rewardsClaimed: {
		type: Boolean,
		default: false
	},
	completedAt: {
		type: Date
	}
}, { timestamps: true });

// Ensures a user cannot have multiple entries for the same task
UserTaskSchema.index({ user: 1, task: 1 }, { unique: true });

module.exports = mongoose.model('UserTask', UserTaskSchema);

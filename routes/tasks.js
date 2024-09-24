// routes/tasks.js

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const auth = require('../middleware/authMiddleware');
// caroci noi ne futem cu tasks acuma, teoretic noi am facut structuta si am facut get user listI
// dar la noi nu lucreaza corect verificare de task - uri in primu rind hz nahui
// anume ca ele tipa is scrise dar nu lucreaza corect ca nu - s integrate unde trebuie, plus la asta hz cum acolo se da rewards si daca se scrie asta in tranzactii
// anume unstem la partea asta de integrarea corect la task - uri daca sunt facute si la automatizarea lor si la punerea lor la locul potriviy, adica sa se verifice
// si anume sa se verifice cind asta trebuie, trebuie de testat de baza get tasks si start task de vazut ce face si daca se call la functii corect repsective
const {
	verifyJoinTelegramGroup,
	simulateTaskCompletion,
	verifyGuessDailyWords,
	verifyGuessCombo,
	verifyConnectTonWallet,
	verifyPremiumReferrals,
	verifyActiveReferrals,
	handleActiveReferralStatusUpdate,
	handlePremiumReferralStatusUpdate,
	verifyOpenAppStreak
} = require('../helpers/taskVerifiers'); // Adjusted path

/**
 * @route   GET /api/tasks
 * @desc    Fetch all tasks along with the user's status for each task
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
	try {
		const user = req.user; // Authenticated user

		// Extra check to ensure user exists
		if (!user) {
			return res.status(401).json({ msg: 'Unauthorized: User not found.' });
		}

		// 1. Fetch all tasks
		const tasks = await Task.find().lean(); // .lean() for faster Mongoose queries

		// 2. Fetch user's task statuses
		const userTasks = await UserTask.find({ user: user._id }).lean();

		// 3. Create a map of taskId to userTask for quick lookup
		const userTaskMap = {};
		userTasks.forEach(ut => {
			userTaskMap[ut.task.toString()] = ut;
		});

		// 4. Combine tasks with user-specific statuses
		const tasksWithStatus = tasks.map(task => {
			const userTask = userTaskMap[task._id.toString()];

			return {
				id: task._id,
				name: task.name,
				description: task.description,
				reward: task.reward,
				condition: task.condition,
				imageLink: task.imageLink,
				isRepeatable: task.isRepeatable,
				createdAt: task.createdAt,
				status: userTask ? userTask.status : 'not_started',
				rewardsClaimed: userTask ? userTask.rewardsClaimed : false,
				completedAt: userTask ? userTask.completedAt : null,
				progress: userTask ? userTask.progress : null
			};
		});

		res.json({ tasks: tasksWithStatus });
	} catch (error) {
		console.error('Error fetching tasks:', error);

		// Handle specific MongoDB errors
		if (error.name === 'MongoError') {
			return res.status(500).json({ msg: 'Database error occurred.' });
		}

		// Handle other specific errors if necessary

		// General server error
		res.status(500).json({ msg: 'Server Error' });
	}
});

/**
 * @route   POST /api/tasks/:taskId/start
 * @desc    Start a specific task
 * @access  Private
 */
router.post('/:taskId/start', auth, async (req, res) => {
	try {
		const user = req.user; // Authenticated user
		const { taskId } = req.params;
		// const { walletAddress } = req.body; // For "Connect TON Wallet" task

		// Find the task
		const task = await Task.findById(taskId);
		if (!task) {
			return res.status(404).json({ msg: 'Task not found.' });
		}

		// Check if the task is repeatable
		if (!task.isRepeatable) {
			// Check if user has already completed the task
			const existingUserTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (existingUserTask && existingUserTask.status === 'done') {
				return res.status(400).json({ msg: 'Task already completed.' });
			}
		}

		// Find or create a UserTask
		let userTask = await UserTask.findOne({ user: user._id, task: task._id });

		if (userTask) {
			if (userTask.status === 'doing') {
				return res.status(400).json({ msg: 'Task is already in progress.' });
			}
			if (userTask.status === 'done' && !task.isRepeatable) {
				return res.status(400).json({ msg: 'Task already completed.' });
			}
			// Reset UserTask if it's repeatable and already done
			userTask.status = 'doing';
			userTask.rewardsClaimed = false;
			userTask.completedAt = null;
			userTask.progress = {};
		} else {
			userTask = new UserTask({
				user: user._id,
				task: task._id,
				status: 'doing',
				progress: {}
			});
		}

		await userTask.save();

		// Handle task-specific logic
		switch (task.condition) {
			case 'join_telegram_group':
				// Immediately verify if the user is in the Telegram group
				setTimeout(() => {
					verifyJoinTelegramGroup(user, task);
				}, 5000);
				return res.json({ msg: 'Task started. Verification in progress.', task: userTask });

			case 'join_twitter_community':
			case 'join_tiktok_community':
				// Simulate task completion after 5 seconds
				simulateTaskCompletion(user, task, 5000);
				return res.json({ msg: 'Task started. Rewards will be credited shortly.', task: userTask });

			case 'guess_daily_words':
				// This task is verified when the user guesses a word
				return res.json({ msg: 'Task started. Continue guessing daily words to complete the task.', task: userTask });

			case 'guess_combo':
				// This task is verified when the user guesses a combo
				return res.json({ msg: 'Task started. Continue guessing combos to complete the task.', task: userTask });

			case 'connect_ton_wallet':
				// This task is verified when the user connect ton wallet
				// if (!walletAddress || walletAddress.trim() === '') {
				// 	return res.status(400).json({ msg: 'Invalid wallet address.' });
				// }
				// await verifyConnectTonWallet(user, task, walletAddress);
				return res.json({ msg: '', task: userTask });

			default:
				return res.status(400).json({ msg: 'Unknown task condition.' });
		}
	} catch (error) {
		console.error('Error starting task:', error);
		res.status(500).json({ msg: 'Server Error' });
	}
});

module.exports = router;

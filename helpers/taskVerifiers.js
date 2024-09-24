// helpers/taskVerifiers.js

const axios = require('axios');
const dotenv = require('dotenv');
const UserTask = require('../models/UserTask');
const Task = require('../models/Task');
const User = require('../models/User');
const updateUserBalance = require('../utils/updateUserBalance');
const addReferralEarnings = require('../utils/referralHelper');

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID; // e.g., '@yourgroup'

/**
 * Verifies if the user is a member of the Telegram group.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 */
const verifyJoinTelegramGroup = async (user, task) => {
	try {
		const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`, {
			params: {
				chat_id: TELEGRAM_GROUP_ID,
				user_id: user.telegramId
			}
		});

		if (response.data.ok) {
			const status = response.data.result.status;
			// Status can be 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
			if (['creator', 'administrator', 'member'].includes(status)) {
				// Update UserTask
				const userTask = await UserTask.findOne({ user: user._id, task: task._id });
				if (userTask && userTask.status !== 'done') {
					userTask.status = 'done';
					userTask.completedAt = new Date();
					userTask.rewardsClaimed = true;
					await userTask.save();

					// Credit user's balance
					user.tasksCompleted.push(task._id);
					await updateUserBalance(user._id, task.reward, `Completed task "${task.name}`);
					await user.save();

					if (user.referredBy) {
						await addReferralEarnings(user._id, task.reward)
					}

					console.log(`User ${user.username} completed task "${task.name}". Reward credited.`);
				}
			} else {
				console.log(`User ${user.username} is not a member of the Telegram group.`);
			}
		} else {
			console.error('Telegram API error:', response.data.description);
		}
	} catch (error) {
		console.error('Error verifying Telegram group membership:', error.message);
	}
};

/**
 * Simulates verification for "Join Twitter Community" and "Join TikTok Community".
 * Automatically completes the task after a specified delay.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {Number} delay - Delay in milliseconds before completing the task.
 */
const simulateTaskCompletion = (user, task, delay = 5000) => {
	setTimeout(async () => {
		try {
			const userTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (userTask && userTask.status !== 'done') {
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;
				await userTask.save();

				// Credit user's balance
				user.tasksCompleted.push(task._id);
				await updateUserBalance(user._id, task.reward, `Completed task "${task.condition}`);
				await user.save();
				if (user.referredBy) {
					await addReferralEarnings(user._id, task.reward)
				}
				console.log(`User ${user.username} completed task "${task.name}". Reward credited.`);
			}
		} catch (error) {
			console.error(`Error auto-completing task "${task.name}":`, error.message);
		}
	}, delay);
};

/**
 * Verifies "Guess Daily Words" task based on consecutive days.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {Number} requiredDays - Number of consecutive days required to complete the task.
 */
const verifyGuessDailyWords = async (user, task, requiredDays) => {
	try {
		const today = new Date().setHours(0, 0, 0, 0);
		const lastLogin = user.guessWordCombos[user.guessWordCombos.length - 1];
		const lastLoginDate = lastLogin ? new Date(lastLogin).setHours(0, 0, 0, 0) : null;

		if (lastLoginDate === today) {
			// User has already guessed today
			console.log(`User ${user.username} has already guessed today.`);
			return;
		}

		// Add today's login
		user.guessWordCombos.push(new Date());
		await user.save();

		// Check for consecutive days
		let consecutiveDays = 1;
		for (let i = user.guessWordCombos.length - 2; i >= 0; i--) {
			const currentDay = new Date(user.guessWordCombos[i]).setHours(0, 0, 0, 0);
			const expectedDay = today - 86400000 * consecutiveDays; // yesterday - consecutiveDays days
			if (currentDay === expectedDay) {
				consecutiveDays++;
				if (consecutiveDays >= requiredDays) break;
			} else {
				break;
			}
		}

		if (consecutiveDays >= requiredDays) {
			// Complete the task
			const userTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (userTask && userTask.status !== 'done') {
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;
				await userTask.save();

				// Credit user's balance
				user.tasksCompleted.push(task._id);
				await updateUserBalance(user._id, task.reward, `Completed task "${task.condition}`);
				await user.save();
				if (user.referredBy) {
					await addReferralEarnings(user._id, task.reward)
				}
				console.log(`User ${user.username} completed task "${task.name}". Reward credited.`);
			}
		}
	} catch (error) {
		console.error('Error verifying "Guess Daily Words" task:', error.message);
	}
};

/**
 * Verifies "Guess Combo" task based on consecutive combo guesses over days.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {Number} requiredCombos - Number of consecutive combo guesses required to complete the task.
 */
const verifyGuessCombo = async (user, task, requiredCombos) => {
	try {
		// Assuming user.guessCombos is an array of dates when combos were guessed
		const guessCombos = user.guessCombos || [];

		// Sort the dates in descending order
		guessCombos.sort((a, b) => new Date(b) - new Date(a));

		let consecutiveCombos = 0;
		let lastDate = null;

		for (let comboDate of guessCombos) {
			const currentDate = new Date(comboDate).setHours(0, 0, 0, 0);
			if (!lastDate) {
				consecutiveCombos++;
				lastDate = currentDate;
			} else {
				if (currentDate === lastDate - 86400000) { // Check if the date is consecutive
					consecutiveCombos++;
					lastDate = currentDate;
				} else {
					break;
				}
			}

			if (consecutiveCombos >= requiredCombos) break;
		}

		if (consecutiveCombos >= requiredCombos) {
			// Complete the task
			const userTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (userTask && userTask.status !== 'done') {
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;
				await userTask.save();

				// Credit user's balance
				user.tasksCompleted.push(task._id);
				await updateUserBalance(user._id, task.reward, `Completed task "${task.condition}`);
				await user.save();
				if (user.referredBy) {
					await addReferralEarnings(user._id, task.reward)
				}
				console.log(`User ${user.username} completed task "${task.name}". Reward credited.`);
			}
		}
	} catch (error) {
		console.error('Error verifying "Guess Combo" task:', error.message);
	}
};

/**
 * Verifies "Connect TON Wallet" task by checking if the wallet is connected.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {String} walletAddress - The user's TON wallet address.
 */
const verifyConnectTonWallet = async (user, task, walletAddress) => {
	try {
		if (walletAddress && walletAddress.trim() !== '') {
			// Update UserTask
			const userTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (userTask && userTask.status !== 'done') {
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;
				userTask.progress = { walletAddress };
				await userTask.save();

				// Credit user's balance
				user.tasksCompleted.push(task._id);
				await updateUserBalance(user._id, task.reward, `Completed task "${task.condition}`);
				await user.save();
				if (user.referredBy) {
					await addReferralEarnings(user._id, task.reward)
				}
				console.log(`User ${user.username} connected TON wallet. Task "${task.name}" completed. Reward credited.`);
			}
		} else {
			console.log(`User ${user.username} provided an invalid TON wallet address.`);
		}
	} catch (error) {
		console.error('Error verifying "Connect TON Wallet" task:', error.message);
	}
};





/**
 * Verifies tasks related to active referrals.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {Number} requiredActiveReferrals - Number of active referrals required.
 */
const verifyActiveReferrals = async (user, task, requiredActiveReferrals) => {
	try {
		const activeReferrals = await countActiveReferrals(user._id);

		if (activeReferrals >= requiredActiveReferrals) {
			// Complete the task
			const userTask = await UserTask.findOne({ user: user._id, task: task._id });
			if (userTask && userTask.status !== 'done') {
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;

				user.tasksCompleted.push(task._id);
				await userTask.save();

				// Credit user's balance and track task completion
				await updateUserBalance(user._id, task.reward, `Completed task "${task.condition}"`);
			}
		}
	} catch (error) {
		console.error(`Error verifying active referrals for task "${task.name}":`, error.message);
	}
};

/**
 * Verifies if the user has reached the required number of premium referrals.
 * If so, marks the corresponding task as completed and credits rewards.
 * @param {Object} user - The user object.
 * @param {Object} task - The task object.
 * @param {Number} requiredCount - The required number of premium referrals to complete the task.
 */
const verifyPremiumReferrals = async (user, task, requiredCount) => {
	try {
		const premiumReferralCount = await countPremiumReferrals(user._id);

		if (premiumReferralCount >= requiredCount) {
			// Find the UserTask
			let userTask = await UserTask.findOne({ user: user._id, task: task._id });

			if (userTask && userTask.status !== 'done') {
				// Mark the task as done
				userTask.status = 'done';
				userTask.completedAt = new Date();
				userTask.rewardsClaimed = true;

				user.tasksCompleted.push(task._id);
				await userTask.save();

				// Credit user's balance and track task completion
				await updateUserBalance(
					user._id,
					task.reward,
					`Completed task "${task.name}"`,
				);

				console.log(`User ${user.username} completed task "${task.name}".`);
			}
		}
	} catch (error) {
		console.error(`Error verifying premium referrals for user ${user._id}:`, error.message);
	}
};

const handlePremiumReferralStatusUpdate = async (refereeId) => {
	try {
		// Find the referral
		const referral = await Referral.findOne({ referee: refereeId }).populate('referrer');

		if (!referral) {
			console.log(`No referral found for referee ID ${refereeId}.`);
			return;
		}

		const referrer = referral.referrer;

		// Define task conditions and required counts
		const premiumTasks = [
			{ condition: 'invite_premium_10', requiredCount: 10 },
			{ condition: 'invite_premium_20', requiredCount: 20 },
			{ condition: 'invite_premium_50', requiredCount: 50 },
			{ condition: 'invite_premium_100', requiredCount: 100 },
		];

		// Iterate through premium tasks and verify
		for (const taskCondition of premiumTasks) {
			const task = await Task.findOne({ condition: taskCondition.condition });

			if (!task) {
				console.log(`Task with condition "${taskCondition.condition}" not found.`);
				continue;
			}

			await verifyPremiumReferrals(referrer, task, taskCondition.requiredCount);
		}

		// Similarly, implement verification for active referrals if needed
		// await verifyActiveReferrals(referrer, task, requiredCount);

	} catch (error) {
		console.error('Error handling referral status update:', error.message);
	}
};

const handleActiveReferralStatusUpdate = async (refereeId) => {
	try {
		// Find the referral
		const referral = await Referral.findOne({ referee: refereeId }).populate('referrer');

		if (!referral) {
			console.log(`No referral found for referee ID ${refereeId}.`);
			return;
		}

		const referrer = referral.referrer;

		// Define task conditions and required counts
		const premiumTasks = [
			{ condition: 'invite_active_10', requiredCount: 10 },
			{ condition: 'invite_active_30', requiredCount: 30 },
			{ condition: 'invite_active_50', requiredCount: 50 },
			{ condition: 'invite_active_100', requiredCount: 100 },
		];

		// Iterate through premium tasks and verify
		for (const taskCondition of premiumTasks) {
			const task = await Task.findOne({ condition: taskCondition.condition });

			if (!task) {
				console.log(`Task with condition "${taskCondition.condition}" not found.`);
				continue;
			}

			await verifyActiveReferrals(referrer, task, taskCondition.requiredCount);
		}

	} catch (error) {
		console.error('Error handling referral status update:', error.message);
	}
};



/**
 * Verifies and processes open app streaks for multiple milestones (7, 30, 100 days).
 * Initializes openAppStreak if it does not exist.
 * @param {Object} user - The user object.
 * @returns {Object} - Result message indicating the outcome.
 */
const verifyOpenAppStreak = async (user) => {
	try {
		// Initialize openAppStreak if undefined
		if (!user.openAppStreak) {
			user.openAppStreak = {
				streak: 0,
				lastOpenDate: null,
			};
		}

		const today = new Date().setHours(0, 0, 0, 0);
		const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);
		const lastOpen = user.openAppStreak.lastOpenDate
			? new Date(user.openAppStreak.lastOpenDate).setHours(0, 0, 0, 0)
			: null;

		if (lastOpen === today) {
			// User has already opened the app today
			return { message: 'Already opened the app today.' };
		}

		if (lastOpen === yesterday) { // Yesterday
			user.openAppStreak.streak += 1;
		} else {
			// Streak broken
			user.openAppStreak.streak = 1;
		}

		user.openAppStreak.lastOpenDate = new Date();

		await user.save();

		// Define the streak milestones and their corresponding conditions
		const streakMilestones = [
			{ days: 7, condition: 'open_app_7_days' },
			{ days: 30, condition: 'open_app_30_days' },
			{ days: 100, condition: 'open_app_100_days' }
		];

		let messages = [`App opened successfully! Current streak: ${user.openAppStreak.streak} days.`];

		// Iterate through each milestone to check if it has been achieved
		for (const milestone of streakMilestones) {
			if (user.openAppStreak.streak === milestone.days) {
				// Find the corresponding task
				const task = await Task.findOne({ condition: milestone.condition });

				if (!task) {
					console.log(`Task with condition "${milestone.condition}" not found.`);
					messages.push(`Streak of ${milestone.days} days achieved, but task not found.`);
					continue;
				}

				// Check if the task has already been completed
				const existingUserTask = await UserTask.findOne({ user: user._id, task: task._id });

				if (existingUserTask && existingUserTask.status === 'done') {
					messages.push(`Streak of ${milestone.days} days already rewarded.`);
					continue;
				}

				// Mark the task as completed
				if (existingUserTask) {
					existingUserTask.status = 'done';
					existingUserTask.completedAt = new Date();
					existingUserTask.rewardsClaimed = true;
					await existingUserTask.save();
				} else {
					const newUserTask = new UserTask({
						user: user._id,
						task: task._id,
						status: 'done',
						completedAt: new Date(),
						rewardsClaimed: true,
					});
					await newUserTask.save();
				}

				user.tasksCompleted.push(task._id);
				// Assign the reward
				await updateUserBalance(
					user._id,
					task.reward,
					`Completed task "${task.name}"`,
					// task._id
				);

				messages.push(`Congratulations! You have earned ${task.reward} coins for completing a ${milestone.days}-day streak.`);
			}
		}

		return { message: messages.join(' ') };
	} catch (error) {
		console.error(`Error verifying open app streak for user ${user._id}:`, error.message);
		throw new Error('Failed to process open app streak.');
	}
};


/**
 * Verifies and processes the daily check-in for days 1-7.
 * @param {Object} user - The user object.
 */
const verifyDailyCheckIn = async (user) => {
	try {
		const today = new Date().setHours(0, 0, 0, 0);
		const lastCheckIn = user.dailyCheckIn.lastCheckInDate
			? new Date(user.dailyCheckIn.lastCheckInDate).setHours(0, 0, 0, 0)
			: null;

		if (lastCheckIn === today) {
			// User has already checked in today
			return { message: 'Already checked in today.' };
		}

		if (lastCheckIn === today - 86400000) { // Yesterday
			user.dailyCheckIn.streak += 1;
		} else {
			// Streak broken
			user.dailyCheckIn.streak = 1;
		}

		user.dailyCheckIn.lastCheckInDate = new Date();

		// Reset if streak exceeds 7
		if (user.dailyCheckIn.streak > 7) {
			user.dailyCheckIn.streak = 1;
		}

		await user.save();

		// Determine reward based on streak
		const reward = user.dailyCheckIn.streak * 100; // 100 coins per day, up to 700

		// Assign reward
		await updateUserBalance(
			user._id,
			reward,
			`Completed daily checkin streak "${user.dailyCheckIn.streak}"`,
		);
		await user.save();

		return { message: `Check-in successful! You earned ${reward} coins.` };
	} catch (error) {
		console.error(`Error verifying daily check-in for user ${user._id}:`, error.message);
		throw new Error('Failed to process daily check-in.');
	}
};


module.exports = {
	verifyJoinTelegramGroup,
	simulateTaskCompletion,
	verifyGuessDailyWords,
	verifyGuessCombo,
	verifyConnectTonWallet,
	verifyPremiumReferrals,
	verifyActiveReferrals,
	handleActiveReferralStatusUpdate,
	handlePremiumReferralStatusUpdate,
	verifyOpenAppStreak,
	verifyDailyCheckIn
};
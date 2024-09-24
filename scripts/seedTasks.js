// scripts/seedTasks.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

const tasks = [
	// 1. Join Telegram Community
	{
		name: 'Join Telegram Community',
		description: 'Join our official Telegram community to stay updated.',
		reward: 100,
		condition: 'join_telegram_group',
		imageLink: 'https://yourdomain.com/images/join_telegram.png',
		isRepeatable: false
	},
	// 2. Join Twitter Community
	{
		name: 'Join Twitter Community',
		description: 'Follow and join our official Twitter community.',
		reward: 150,
		condition: 'join_twitter_community',
		imageLink: 'https://yourdomain.com/images/join_twitter.png',
		isRepeatable: false
	},
	// 3. Join TikTok Community
	{
		name: 'Join TikTok Community',
		description: 'Follow and join our official TikTok community.',
		reward: 150,
		condition: 'join_tiktok_community',
		imageLink: 'https://yourdomain.com/images/join_tiktok.png',
		isRepeatable: false
	},
	// 4. Open App for 7 Days in a Row
	{
		name: 'Open App for 7 Days in a Row',
		description: 'Open the app every day for 7 consecutive days.',
		reward: 200,
		condition: 'open_app_7_days',
		imageLink: 'https://yourdomain.com/images/open_app_7_days.png',
		isRepeatable: false
	},
	// 5. Open App for 30 Days in a Row
	{
		name: 'Open App for 30 Days in a Row',
		description: 'Open the app every day for 30 consecutive days.',
		reward: 500,
		condition: 'open_app_30_days',
		imageLink: 'https://yourdomain.com/images/open_app_30_days.png',
		isRepeatable: false
	},
	// 6. Open App for 100 Days in a Row
	{
		name: 'Open App for 100 Days in a Row',
		description: 'Open the app every day for 100 consecutive days.',
		reward: 1000,
		condition: 'open_app_100_days',
		imageLink: 'https://yourdomain.com/images/open_app_100_days.png',
		isRepeatable: false
	},
	// 7. Invite 10 Active Referrals
	{
		name: 'Invite 10 Active Referrals',
		description: 'Invite 10 active users to join the app.',
		reward: 200,
		condition: 'invite_active_10',
		imageLink: 'https://yourdomain.com/images/invite_active_10.png',
		isRepeatable: false
	},
	// 8. Invite 30 Active Referrals
	{
		name: 'Invite 30 Active Referrals',
		description: 'Invite 30 active users to join the app.',
		reward: 500,
		condition: 'invite_active_30',
		imageLink: 'https://yourdomain.com/images/invite_active_30.png',
		isRepeatable: false
	},
	// 9. Invite 50 Active Referrals
	{
		name: 'Invite 50 Active Referrals',
		description: 'Invite 50 active users to join the app.',
		reward: 800,
		condition: 'invite_active_50',
		imageLink: 'https://yourdomain.com/images/invite_active_50.png',
		isRepeatable: false
	},
	// 10. Invite 100 Active Referrals
	{
		name: 'Invite 100 Active Referrals',
		description: 'Invite 100 active users to join the app.',
		reward: 1500,
		condition: 'invite_active_100',
		imageLink: 'https://yourdomain.com/images/invite_active_100.png',
		isRepeatable: false
	},
	// 11. Invite 10 Premium Referral Users
	{
		name: 'Invite 10 Premium Referral Users',
		description: 'Invite 10 premium users to join the app.',
		reward: 300,
		condition: 'invite_premium_10',
		imageLink: 'https://yourdomain.com/images/invite_premium_10.png',
		isRepeatable: false
	},
	// 12. Invite 20 Premium Referral Users
	{
		name: 'Invite 20 Premium Referral Users',
		description: 'Invite 20 premium users to join the app.',
		reward: 600,
		condition: 'invite_premium_20',
		imageLink: 'https://yourdomain.com/images/invite_premium_20.png',
		isRepeatable: false
	},
	// 13. Invite 50 Premium Referral Users
	{
		name: 'Invite 50 Premium Referral Users',
		description: 'Invite 50 premium users to join the app.',
		reward: 1000,
		condition: 'invite_premium_50',
		imageLink: 'https://yourdomain.com/images/invite_premium_50.png',
		isRepeatable: false
	},
	// 14. Invite 100 Premium Referral Users
	{
		name: 'Invite 100 Premium Referral Users',
		description: 'Invite 100 premium users to join the app.',
		reward: 2000,
		condition: 'invite_premium_100',
		imageLink: 'https://yourdomain.com/images/invite_premium_100.png',
		isRepeatable: false
	},
	// 15. Guess Daily Words for 7 Days in a Row
	{
		name: 'Guess Daily Words for 7 Days in a Row',
		description: 'Guess the daily word correctly for 7 consecutive days.',
		reward: 250,
		condition: 'guess_daily_words_7',
		imageLink: 'https://yourdomain.com/images/guess_daily_words_7.png',
		isRepeatable: false
	},
	// 16. Guess Daily Words for 30 Days in a Row
	{
		name: 'Guess Daily Words for 30 Days in a Row',
		description: 'Guess the daily word correctly for 30 consecutive days.',
		reward: 600,
		condition: 'guess_daily_words_30',
		imageLink: 'https://yourdomain.com/images/guess_daily_words_30.png',
		isRepeatable: false
	},
	// 17. Guess Daily Words for 90 Days in a Row
	{
		name: 'Guess Daily Words for 90 Days in a Row',
		description: 'Guess the daily word correctly for 90 consecutive days.',
		reward: 1200,
		condition: 'guess_daily_words_90',
		imageLink: 'https://yourdomain.com/images/guess_daily_words_90.png',
		isRepeatable: false
	},
	// 18. Guess Combo for 7 Days in a Row
	{
		name: 'Guess Combo for 7 Days in a Row',
		description: 'Guess a combo correctly for 7 consecutive days.',
		reward: 300,
		condition: 'guess_combo_7',
		imageLink: 'https://yourdomain.com/images/guess_combo_7.png',
		isRepeatable: false
	},
	// 19. Guess Combo for 30 Days in a Row
	{
		name: 'Guess Combo for 30 Days in a Row',
		description: 'Guess a combo correctly for 30 consecutive days.',
		reward: 700,
		condition: 'guess_combo_30',
		imageLink: 'https://yourdomain.com/images/guess_combo_30.png',
		isRepeatable: false
	},
	// 20. Guess Combo for 90 Days in a Row
	{
		name: 'Guess Combo for 90 Days in a Row',
		description: 'Guess a combo correctly for 90 consecutive days.',
		reward: 1500,
		condition: 'guess_combo_90',
		imageLink: 'https://yourdomain.com/images/guess_combo_90.png',
		isRepeatable: false
	},
	// 21. Guess Combo for 120 Days in a Row
	{
		name: 'Guess Combo for 120 Days in a Row',
		description: 'Guess a combo correctly for 120 consecutive days.',
		reward: 2000,
		condition: 'guess_combo_120',
		imageLink: 'https://yourdomain.com/images/guess_combo_120.png',
		isRepeatable: false
	},
	// 22. Connect TON Wallet
	{
		name: 'Connect TON Wallet',
		description: 'Connect your TON wallet to the app.',
		reward: 500,
		condition: 'connect_ton_wallet',
		imageLink: 'https://yourdomain.com/images/connect_ton_wallet.png',
		isRepeatable: false
	}
];

const seedTasks = async () => {
	try {
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});

		console.log('Connected to MongoDB');

		for (const taskData of tasks) {
			const existingTask = await Task.findOne({ name: taskData.name });
			if (!existingTask) {
				const task = new Task(taskData);
				await task.save();
				console.log(`Inserted task: ${task.name}`);
			} else {
				console.log(`Task already exists: ${existingTask.name}`);
			}
		}

		console.log('Task seeding completed');
		process.exit(0);
	} catch (error) {
		console.error('Error seeding tasks:', error);
		process.exit(1);
	}
};

seedTasks();

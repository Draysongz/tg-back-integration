const simulateTwitterCommunityCompletion = async (userTask) => {
	setTimeout(async () => {
		try {
			// Simulate task completion
			userTask.status = 'done';
			userTask.completedAt = new Date();
			userTask.rewardsClaimed = true;
			await userTask.save();

			// Credit user's balance
			const user = await User.findById(userTask.user);
			if (user) {
				user.balance += userTask.task.reward;
				await user.save();
				console.log(`User ${user.username} completed task "${userTask.task.name}". Reward credited.`);
			}
		} catch (err) {
			console.error('Error auto-completing Twitter Community task:', err.message);
		}
	}, 5000); // 5 seconds delay
};

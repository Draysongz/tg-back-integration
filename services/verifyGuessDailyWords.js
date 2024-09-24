const verifyGuessDailyWords = async (user, guessedWord) => {
	// Implement your condition here, e.g., check if guessedWord matches today's word
	const todayWord = getTodayWord(); // Implement this function based on your logic

	if (guessedWord.toLowerCase() === todayWord.toLowerCase()) {
		// Find or create a UserTask for 'Guess Daily Words'
		let userTask = await UserTask.findOne({ user: user._id, task: 'guess_daily_words' });
		if (!userTask) {
			// Find the task
			const task = await Task.findOne({ name: 'Guess Daily Words' });
			if (!task) return { success: false, msg: 'Task not found.' };

			userTask = new UserTask({
				user: user._id,
				task: task._id,
				status: 'done',
				rewardsClaimed: true,
				completedAt: new Date(),
				progress: {}
			});
		} else if (userTask.status !== 'done') {
			userTask.status = 'done';
			userTask.rewardsClaimed = true;
			userTask.completedAt = new Date();
		} else {
			return { success: false, msg: 'Task already completed.' };
		}

		await userTask.save();

		// Credit user's balance
		user.balance += userTask.task.reward;
		await user.save();

		return { success: true, msg: 'Daily word guessed correctly. Reward credited.' };
	} else {
		return { success: false, msg: 'Incorrect word. Try again!' };
	}
};

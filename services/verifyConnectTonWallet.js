const verifyConnectTonWallet = async (user, walletAddress) => {
	if (!walletAddress || walletAddress.trim() === '') {
		return { success: false, msg: 'Invalid wallet address.' };
	}

	// Optionally, validate the wallet address format here

	// Find or create a UserTask for 'Connect TON Wallet'
	let userTask = await UserTask.findOne({ user: user._id, task: 'connect_ton_wallet' });
	if (!userTask) {
		// Find the task
		const task = await Task.findOne({ name: 'Connect TON Wallet' });
		if (!task) return { success: false, msg: 'Task not found.' };

		userTask = new UserTask({
			user: user._id,
			task: task._id,
			status: 'done',
			rewardsClaimed: true,
			completedAt: new Date(),
			progress: { walletAddress }
		});
	} else if (userTask.status !== 'done') {
		userTask.status = 'done';
		userTask.rewardsClaimed = true;
		userTask.completedAt = new Date();
		userTask.progress = { walletAddress };
	} else {
		return { success: false, msg: 'Task already completed.' };
	}

	await userTask.save();

	// Credit user's balance
	user.balance += userTask.task.reward;
	await user.save();

	return { success: true, msg: 'TON Wallet connected successfully. Reward credited.' };
};

// utils/balance.js

const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Modify a user's balance and log the transaction.
 *
 * @param {ObjectId} userId - The ID of the user to modify.
 * @param {Number} amount - The amount to add (positive) or subtract (negative) from the balance.
 * @param {String} reason - The reason for the balance modification.
 * @returns {Promise<Object>} - The updated user object.
 */

async function updateUserBalance(userId, amount, reason) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		if (amount < 0 && user.balance + amount < 0) {
			throw new Error('Insufficient balance');
		}

		user.balance += amount;
		user.transactions.push({
			amount,
			reason,
			date: new Date(),
		});

		await user.save();

		return user;
	} catch (error) {
		console.error(`Error updating user balance for user ${userId}:`, error.message);
		throw new Error('Failed to update user balance.');
	}
}
module.exports = updateUserBalance;
// services/verifyTelegram.js

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID; // e.g., '@yourgroup'

const verifyTelegramMembership = async (telegramId) => {
	try {
		const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`, {
			params: {
				chat_id: TELEGRAM_GROUP_ID,
				user_id: telegramId
			}
		});

		if (response.data.ok) {
			const status = response.data.result.status;
			// Status can be 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
			return ['creator', 'administrator', 'member'].includes(status);
		} else {
			console.error('Telegram API error:', response.data.description);
			return false;
		}
	} catch (error) {
		console.error('Error checking Telegram group membership:', error.message);
		return false;
	}
};

module.exports = verifyTelegramMembership;

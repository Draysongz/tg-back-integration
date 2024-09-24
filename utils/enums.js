// src/utils/enums.js

// Task Conditions Enum
const TaskConditions = {
	JOIN_TELEGRAM_GROUP: 0,
	JOIN_TWITTER_COMMUNITY: 1,
	JOIN_TIKTOK_COMMUNITY: 2,
	// Future conditions can be added here
};

const TaskConditionsReverse = {
	0: 'Join Telegram Community',
	1: 'Join Twitter Community',
	2: 'Join TikTok Community',
	// Future reverse mappings can be added here
};

// Task Statuses Enum
const TaskStatuses = {
	NOT_STARTED: 0,
	DOING: 1,
	DONE: 2,
	FAILED: 3
};

const TaskStatusesReverse = {
	0: 'not_started',
	1: 'doing',
	2: 'done',
	3: 'failed'
};

module.exports = {
	TaskConditions,
	TaskConditionsReverse,
	TaskStatuses,
	TaskStatusesReverse
};

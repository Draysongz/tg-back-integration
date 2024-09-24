// src/utils/helpers.js
const {
	TaskConditionsReverse,
	TaskStatusesReverse
} = require('./enums');

/**
 * Get task condition title from integer value
 * @param {Number} conditionInt 
 * @returns {String} condition title
 */
const getTaskConditionTitle = (conditionInt) => {
	return TaskConditionsReverse[conditionInt] || 'Unknown Condition';
};

/**
 * Get task status title from integer value
 * @param {Number} statusInt 
 * @returns {String} task status
 */
const getTaskStatusTitle = (statusInt) => {
	return TaskStatusesReverse[statusInt] || 'unknown_status';
};

module.exports = {
	getTaskConditionTitle,
	getTaskStatusTitle
};

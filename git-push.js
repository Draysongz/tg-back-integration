#!/usr/bin/env node

const { exec } = require('child_process');

// Retrieve the commit message from command line arguments
const commitMessage = process.argv[2] || 'Auto-commit'; // Default commit message if none is provided

// Sequence of Git commands
const gitCommands = `
    git add . &&
    git commit -m "${commitMessage}" &&
    git push origin main
`;

// Execute the git commands
exec(gitCommands, (error, stdout, stderr) => {
	if (error) {
		console.error(`Error: ${error.message}`);
		return;
	}

	if (stderr) {
		console.error(`stderr: ${stderr}`);
		return;
	}

	console.log(`stdout: ${stdout}`);
	console.log('Successfully pushed to GitLab');
});

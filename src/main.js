const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { getCommandFromAI, confirmAndExecute } = require('./aiAssistant');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/session.log' }),
        new winston.transports.Console()
    ],
});

function interactionLoop(userInput, rl, logStream) {
    getCommandFromAI(userInput)
        .then((aiResponse) => {
            logStream.write(`User: ${userInput}\nAI: ${aiResponse.responseToUser}\n`);
            // logger.info('AI Response:', aiResponse.responseToUser);

            console.log(`${aiResponse.responseToUser}\n`);

            if (aiResponse.executeCommand) {
                confirmAndExecute(aiResponse.executeCommand, rl, (feedback) => {
                    if (feedback) {
                        interactionLoop(feedback, rl, logStream);
                    } else {
                        rl.question('How can I assist you further? ', (input) => interactionLoop(input, rl, logStream));
                    }
                });
            } else {
                rl.question('\n\nHow can I assist you further?: ', (input) => interactionLoop(input, rl, logStream));
            }
        })
        .catch((error) => {
            logger.error('An unexpected error occurred:', error.message);
            logStream.write(`Error: ${error.message}\n`);
            rl.close();
        });
}

function startInteraction() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = path.join(__dirname, `logs/session-log-${timestamp}.txt`);

    try {
        const logStream = fs.createWriteStream(logFileName, { flags: 'a' });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        logStream.write(`Session started at ${new Date().toISOString()}\n`);

        rl.question('What would you like to do? ', (input) => interactionLoop(input, rl, logStream));

        rl.on('close', () => {
            logStream.write(`Session ended at ${new Date().toISOString()}\n`);
            logStream.end();
        });
    } catch (error) {
        logger.error(`Failed to create log file: ${error.message}`);
    }
}

module.exports = {
    startInteraction
};

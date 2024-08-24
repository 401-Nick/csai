const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { getCommandFromAI, confirmAndExecute } = require('./aiAssistant');
const logger = require('./logger');

function showLoadingIndicator() {
    const loadingStates = ['.', '..', '...'];
    let currentState = 0;
    
    return setInterval(() => {
        process.stdout.write(`\rLoading${loadingStates[currentState]}`);
        currentState = (currentState + 1) % loadingStates.length;
    }, 500);
}

function interactionLoop(userInput, rl, logStream) {
    const loadingInterval = showLoadingIndicator();

    getCommandFromAI(userInput)
        .then((aiResponse) => {
            clearInterval(loadingInterval);
            process.stdout.write('\r' + ' '.repeat(10) + '\r');
            logStream.write(`User: ${userInput}\nAI: ${aiResponse.responseToUser}\n`);

            console.log(`${aiResponse.responseToUser}\n`);

            if (aiResponse.executeCommand) {
                confirmAndExecute(aiResponse.executeCommand, rl, (feedback) => {
                    if (feedback) {
                        interactionLoop(feedback, rl, logStream);
                    } else {
                        rl.question('How can I assist you further? ', (input) => interactionLoop(input, rl, logStream));
                    }
                }, logStream);
            } else {
                rl.question('\n\nHow can I assist you further?: ', (input) => interactionLoop(input, rl, logStream));
            }
        })
        .catch((error) => {
            clearInterval(loadingInterval);
            process.stdout.write('\r' + ' '.repeat(10) + '\r');
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

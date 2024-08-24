const { spawn } = require('child_process');
const OpenAI = require('openai');
const os = require('os');
require('dotenv').config();
const logger = require('./logger');

// Determine the operating system
const platform = os.platform();
const isWindows = platform === 'win32';

// Initialize OpenAI client
let openai;
try {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing. Please set it in your .env file.');
    }

    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
    logger.error('Failed to initialize OpenAI client:', error.message);
    process.exit(1);
}

// Memory for storing conversation history with a limit of 10 messages
const memory = [];
const MAX_MEMORY_SIZE = 10;

function addToMemory(message) {
    memory.push(message);
    if (memory.length > MAX_MEMORY_SIZE) {
        memory.shift();
    }
}

// Define system prompts based on the operating system
const commonPrompt = `
You are a cybersecurity assistant with the ability to execute commands on a ${isWindows ? 'Windows' : 'Linux'} system.
Your goal is to help the user securely and effectively.
Always respond in the following JSON format:
{
    "responseToUser": "Your detailed explanation here.",
    "executeCommand": "The exact command to be run or an empty string if no command is needed."
}
Keep commands minimal and safe.
`;

const windowsCommands = `
Your available commands are:
- dir
- cd
- cls
- ipconfig
- ping
- tracert
- netstat
- tasklist
- taskkill
- net user
- net localgroup
- net start
- net stop
`;

const linuxCommands = `
Your available commands are:
- ls
- cd
- clear
- ifconfig
- ping
- traceroute
- netstat
- ps
- kill
- whoami
- groups
- systemctl
`;

const toolsList = `
Your available tools are:
- nmap
- wireshark
- metasploit
- john the ripper
- hashcat
- hydra
- sqlmap
- burpsuite
- nikto
- sqlninja
- wpscan
`;

const systemPrompt = commonPrompt + (isWindows ? windowsCommands : linuxCommands) + toolsList;

async function getCommandFromAI(userInput) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let parsedResponse;

    while (attempt < MAX_RETRIES) {
        try {
            if (attempt > 0) {
                logger.warn('Retrying with a reminder to respond in JSON format.');
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                ...memory,
                { role: 'user', content: userInput }
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: messages,
                temperature: 0.5,
            });

            const response = completion.choices[0].message;
            if (!response) throw new Error('No response from OpenAI API.');

            parsedResponse = JSON.parse(response.content);

            if (typeof parsedResponse.responseToUser === 'string' && typeof parsedResponse.executeCommand === 'string') {
                addToMemory({ role: 'assistant', content: response.content });
                return parsedResponse;
            } else {
                throw new Error('Invalid response format from AI.');
            }
        } catch (error) {
            attempt += 1;
            logger.error(`Error fetching AI response (Attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

            if (attempt >= MAX_RETRIES) {
                return {
                    responseToUser: 'An error occurred while trying to fetch a valid response from the AI.',
                    executeCommand: ''
                };
            }
        }
    }
}

function executeCommand(command, callback, logStream) {
    logger.info(`Executing command: ${command}`);
    logStream.write(`Executing command: ${command}\n`);

    const spawnedProcess = spawn(command, { shell: true });

    let stdoutData = '';
    let stderrData = '';

    spawnedProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    spawnedProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    spawnedProcess.on('close', (code) => {
        const feedback = code === 0
            ? stdoutData || 'Command executed successfully with no output.'
            : stderrData || `Command exited with code ${code}.`;

        logger.info(`Command "${command}" executed with feedback: ${feedback.trim()}`);
        logStream.write(`Command "${command}" executed with feedback: ${feedback.trim()}\n`);

        addToMemory({
            role: 'user',
            content: `The command "${command}" was executed with the following output:\n${feedback}`
        });

        callback(feedback);
    });

    spawnedProcess.on('error', (error) => {
        const errorMessage = `Failed to start command "${command}": ${error.message}`;
        logger.error(errorMessage);
        logStream.write(`${errorMessage}\n`);

        addToMemory({
            role: 'user',
            content: errorMessage
        });
        callback(`Error: ${error.message}`);
    });
}

function confirmAndExecute(command, rl, callback, logStream) {
    rl.question(`Are you sure you want to execute the following command: "${command}"? (yes/no): `, (answer) => {
        if (['yes', 'y'].includes(answer.trim().toLowerCase())) {
            executeCommand(command, callback, logStream);
        } else {
            logger.info('Command execution cancelled by user.');
            logStream.write('Command execution cancelled by user.\n');
            callback(null);
        }
    });
}

module.exports = {
    getCommandFromAI,
    confirmAndExecute
};

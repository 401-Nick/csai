const { spawn } = require('child_process');
const OpenAI = require('openai');
const winston = require('winston');
require('dotenv').config();

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/app.log' }),
        new winston.transports.Console()
    ],
});

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

const systemPrompt = `
You are a cybersecurity assistant with the ability to execute commands on a Windows command prompt or terminal.
Your goal is to help the user securely and effectively.
Always respond in the following JSON format:
{
    "responseToUser": "Your detailed explanation here.",
    "executeCommand": "The exact command to be run or an empty string if no command is needed."
}
Keep commands minimal and safe.

Your main commands for windows are:
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

Your main commands for linux are:
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

Your main tools are:
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

async function getCommandFromAI(userInput) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let parsedResponse;

    while (attempt < MAX_RETRIES) {
        try {
            if (attempt > 0) {
                logger.warn('Retrying with a reminder to respond in JSON format.');
                addToMemory({ role: 'system', content: systemPrompt });
            } else {
                addToMemory({ role: 'user', content: userInput });
            }

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...memory
                ],
            });

            const response = completion.choices[0].message;
            if (!response) throw new Error('No response from OpenAI API.');

            // logger.info('AI Response:', response.content);

            parsedResponse = JSON.parse(response.content);

            if (parsedResponse.responseToUser !== undefined && parsedResponse.executeCommand !== undefined) {
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

function executeCommand(command, callback) {
    // logger.info(`Executing command: ${command}`);

    const [mainCommand, ...args] = command.split(' ');
    const spawnedProcess = spawn(mainCommand, args, { shell: true });

    let stdoutData = '';
    let stderrData = '';

    spawnedProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    spawnedProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    spawnedProcess.on('close', (code) => {
        let feedback = code === 0 ? stdoutData || 'Command executed successfully with no output.' : stderrData || `Command exited with code ${code}.`;

        addToMemory({
            role: 'user',
            content: `The command "${command}" was executed with the following output:\n${feedback}`
        });

        callback(feedback);
    });

    spawnedProcess.on('error', (error) => {
        logger.error(`Failed to start command "${command}": ${error.message}`);
        addToMemory({
            role: 'user',
            content: `Failed to execute command "${command}": ${error.message}`
        });
        callback(`Error: ${error.message}`);
    });
}

function confirmAndExecute(command, rl, callback) {
    rl.question(`Are you sure you want to execute the following command: "${command}"? (yes/no): `, (answer) => {
        if (['yes', 'y'].includes(answer.trim().toLowerCase())) {
            executeCommand(command, callback);
        } else {
            // logger.info('Command execution cancelled by user.');
            callback(null);
        }
    });
}

module.exports = {
    getCommandFromAI,
    confirmAndExecute
};

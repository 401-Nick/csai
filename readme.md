KEEP IN MIND YOU ARE DISCLOSING ALL INFORMATION TO OPENAI. DO NOT DO ANYTHING MALICIOUS. THIS IS NOT A TRULY SECURE APPLICATION. DO NOT USE THIS APPLICATION FOR ANYTHING THAT REQUIRES SECURITY. THIS IS A LEARNING PROJECT AND SHOULD BE TREATED AS SUCH.

Cybersecurity Assistant CLI

This is a command-line interface (CLI) application designed to interact with a cybersecurity assistant powered by OpenAI's GPT-4. The assistant can execute system commands and provide detailed explanations, helping users perform cybersecurity tasks on Windows and Linux systems.

Features

- AI-Powered Assistance: Interact with an AI assistant that can execute system commands securely and effectively.
- Session Logging: Each interaction session is logged, including executed commands and their results.

Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- OpenAI API Key

Installation

1. Clone the repository:
   git clone https://github.com/401-Nick/csai.git
   cd csai

2. Install dependencies:
   npm install

3. Set up your OpenAI API key:
   - Create a `.env` file in the project root:
     touch .env
   - Add your OpenAI API key to the `.env` file:
     OPENAI_API_KEY="your-api-key-here"

Usage

1. Start the application:
   npm start

2. Interaction:
   - The assistant will prompt you with a question: `What would you like to do?`
   - Type your request, and the assistant will respond with advice or execute commands as necessary.

3. Session Logs:
   - All interactions are logged in the `logs/` directory. Each session log is named with a timestamp for easy reference.

   be good plz!
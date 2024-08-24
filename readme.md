# Cybersecurity Assistant CLI

This is a command-line interface (CLI) application designed to interact with a cybersecurity assistant powered by OpenAI's GPT-4. The assistant can execute system commands and provide detailed explanations, helping users perform cybersecurity tasks on Windows and Linux systems.

## Features

- **AI-Powered Assistance**: Interact with an AI assistant that can execute system commands securely and effectively.
- **Session Logging**: Each interaction session is logged, including executed commands and their results.

## Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- OpenAI API Key

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/cybersecurity-assistant-cli.git
    cd cybersecurity-assistant-cli
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up your OpenAI API key**:
    - Create a `.env` file in the project root:
      ```bash
      touch .env
      ```
    - Add your OpenAI API key to the `.env` file:
      ```bash
      OPENAI_API_KEY=your-api-key-here
      ```

## Usage

1. **Start the application**:
    ```bash
    node main.js
    ```

2. **Interaction**:
    - The assistant will prompt you with a question: `What would you like to do?`
    - Type your request, and the assistant will respond with advice or execute commands as necessary.

3. **Loading Indicator**:
    - While waiting for the AI to process your request, a simple loading indicator (`"."`, `".."`, `"..."`) will be displayed.

4. **Session Logs**:
    - All interactions are logged in the `logs/` directory. Each session log is named with a timestamp for easy reference.

## File Structure


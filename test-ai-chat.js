/**
 * This is a simple test script to verify the AI chatbot functionality
 * It tests both the OpenAI API integration and the fallback mock response system
 */
const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = 'http://localhost:3333/api/chat';
const TEST_MESSAGES = [
  {
    language: 'English',
    message: 'Hello, how can I find a pediatric nurse?'
  },
  {
    language: 'Arabic',
    message: 'مرحبا، كيف يمكنني العثور على ممرض متخصص بالأطفال؟'
  },
  {
    language: 'English',
    message: 'What services do you provide for diabetes patients?'
  },
  {
    language: 'Arabic',
    message: 'ما هي خدماتكم للمرضى المصابين بالسكري؟'
  }
];

async function testChatbot() {
  console.log(chalk.blue('===== AI CHATBOT TEST ====='));
  console.log(chalk.blue('Testing both OpenAI integration and fallback system\n'));
  
  for (const test of TEST_MESSAGES) {
    console.log(chalk.yellow(`Testing ${test.language} message: "${test.message}"`));
    
    try {
      const startTime = Date.now();
      const response = await axios.post(API_URL, { message: test.message });
      const responseTime = Date.now() - startTime;
      
      console.log(chalk.green('Success! Response received in', responseTime, 'ms'));
      console.log(chalk.white('Response:'), response.data.message);
      console.log('\n');
    } catch (error) {
      console.log(chalk.red('Error:', error.response?.data?.message || error.message));
      console.log('\n');
    }
  }
  
  console.log(chalk.blue('===== TEST COMPLETED ====='));
}

// Run the test
testChatbot();

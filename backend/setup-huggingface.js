#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚗 Cruise AI - Hugging Face Setup');
console.log('=====================================\n');

console.log('To get unique AI responses like ChatGPT Voice, you need a Hugging Face API key.');
console.log('This will allow Cruise AI to generate unique, conversational responses.\n');

console.log('Steps to get your API key:');
console.log('1. Go to https://huggingface.co and create a free account');
console.log('2. Go to your profile settings → Access Tokens');
console.log('3. Create a new token with "read" permissions');
console.log('4. Copy the token (starts with "hf_...")\n');

rl.question('Enter your Hugging Face API key (or press Enter to skip): ', (apiKey) => {
  if (!apiKey.trim()) {
    console.log('\n⚠️  No API key provided. Cruise AI will use enhanced predefined responses.');
    console.log('You can add your API key later by editing the .env file.');
    rl.close();
    return;
  }

  // Validate API key format
  if (!apiKey.startsWith('hf_')) {
    console.log('\n❌ Invalid API key format. Hugging Face API keys start with "hf_"');
    rl.close();
    return;
  }

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Add or update HUGGING_FACE_API_KEY
  if (envContent.includes('HUGGING_FACE_API_KEY=')) {
    envContent = envContent.replace(
      /HUGGING_FACE_API_KEY=.*/,
      `HUGGING_FACE_API_KEY=${apiKey}`
    );
  } else {
    envContent += `\nHUGGING_FACE_API_KEY=${apiKey}`;
  }

  // Write to .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Hugging Face API key saved to .env file!');
  console.log('🚀 Cruise AI will now generate unique responses using Hugging Face models.');
  console.log('\nNote: The free tier has rate limits, so responses may be slower at times.');

  rl.close();
});

rl.on('close', () => {
  console.log('\n🎉 Setup complete! Run "npm start" to start the server.');
  process.exit(0);
}); 
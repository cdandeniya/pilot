#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎤 Cruise AI - AssemblyAI Speech-to-Text Setup');
console.log('===============================================\n');

console.log('To get real speech-to-text functionality (instead of simulated responses),');
console.log('you need an AssemblyAI API key. This will allow Cruise AI to actually');
console.log('understand what you\'re saying.\n');

console.log('Steps to get your API key:');
console.log('1. Go to https://assemblyai.com and create a free account');
console.log('2. Go to your dashboard');
console.log('3. Copy your API key');
console.log('4. Paste it below\n');

console.log('Free tier includes:');
console.log('- 5 hours of audio transcription per month');
console.log('- Real-time speech recognition');
console.log('- High accuracy transcription\n');

rl.question('Enter your AssemblyAI API key (or press Enter to skip): ', (apiKey) => {
  if (!apiKey.trim()) {
    console.log('\n⚠️  No API key provided. Cruise AI will use simulated speech recognition.');
    console.log('You can add your API key later by editing the .env file.');
    rl.close();
    return;
  }

  // Validate API key format (AssemblyAI keys are typically long)
  if (apiKey.length < 20) {
    console.log('\n❌ Invalid API key format. AssemblyAI API keys are typically longer.');
    rl.close();
    return;
  }

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Add or update ASSEMBLYAI_API_KEY
  if (envContent.includes('ASSEMBLYAI_API_KEY=')) {
    envContent = envContent.replace(
      /ASSEMBLYAI_API_KEY=.*/,
      `ASSEMBLYAI_API_KEY=${apiKey}`
    );
  } else {
    envContent += `\nASSEMBLYAI_API_KEY=${apiKey}`;
  }

  // Write to .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ AssemblyAI API key saved to .env file!');
  console.log('🎤 Cruise AI will now use real speech-to-text recognition.');
  console.log('\nNote: Free tier includes 5 hours of transcription per month.');

  rl.close();
});

rl.on('close', () => {
  console.log('\n🎉 Setup complete! Run "npm start" to start the server.');
  process.exit(0);
}); 
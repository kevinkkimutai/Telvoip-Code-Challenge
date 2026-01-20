#!/usr/bin/env node

/**
 * QuickPay Backend Setup Script
 * Helps initialize the backend server with proper configuration
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function checkEnvironment() {
  console.log(colorize('\n🔍 Checking environment configuration...', 'cyan'))
  
  const envPath = path.join(__dirname, '.env')
  const envExamplePath = path.join(__dirname, '.env.example')
  
  if (!fs.existsSync(envPath)) {
    console.log(colorize('❌ .env file not found!', 'red'))
    
    if (fs.existsSync(envExamplePath)) {
      console.log(colorize('📄 Copying .env.example to .env...', 'yellow'))
      fs.copyFileSync(envExamplePath, envPath)
      console.log(colorize('✅ .env file created from example', 'green'))
      console.log(colorize('⚠️  Please configure your Supabase credentials in .env', 'yellow'))
      return false
    } else {
      console.log(colorize('❌ .env.example file not found either!', 'red'))
      return false
    }
  }

  // Check if required env vars are configured
  require('dotenv').config()
  
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.log(colorize('❌ Missing required environment variables:', 'red'))
    missing.forEach(key => console.log(colorize(`   - ${key}`, 'red')))
    console.log(colorize('\nPlease configure these in your .env file', 'yellow'))
    return false
  }
  
  console.log(colorize('✅ Environment configuration looks good!', 'green'))
  return true
}

function checkDependencies() {
  console.log(colorize('\n📦 Checking dependencies...', 'cyan'))
  
  const packagePath = path.join(__dirname, 'package.json')
  const nodeModulesPath = path.join(__dirname, 'node_modules')
  
  if (!fs.existsSync(packagePath)) {
    console.log(colorize('❌ package.json not found!', 'red'))
    return false
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(colorize('❌ node_modules not found!', 'red'))
    console.log(colorize('Run: npm install', 'yellow'))
    return false
  }
  
  console.log(colorize('✅ Dependencies are installed', 'green'))
  return true
}

function printServerInfo() {
  const port = process.env.PORT || 7200
  const nodeEnv = process.env.NODE_ENV || 'development'
  const apiVersion = process.env.API_VERSION || 'v1'
  
  console.log(colorize('\n🚀 QuickPay Backend Server', 'bright'))
  console.log(colorize('═'.repeat(50), 'blue'))
  console.log(`${colorize('Server URL:', 'cyan')}     http://localhost:${port}`)
  console.log(`${colorize('API Base:', 'cyan')}       http://localhost:${port}/api/${apiVersion}`)
  console.log(`${colorize('Health Check:', 'cyan')}   http://localhost:${port}/health`)
  console.log(`${colorize('Environment:', 'cyan')}    ${nodeEnv}`)
  console.log(colorize('═'.repeat(50), 'blue'))
  
  console.log(colorize('\n📚 Available Endpoints:', 'bright'))
  console.log(`${colorize('Payments:', 'green')}     GET    /api/${apiVersion}/payments`)
  console.log(`${colorize('Invoices:', 'green')}     POST   /api/${apiVersion}/invoices`)
  console.log(`${colorize('Clients:', 'green')}      GET    /api/${apiVersion}/clients`)
  console.log(`${colorize('Statistics:', 'green')}   GET    /api/${apiVersion}/stats/dashboard`)
  
  console.log(colorize('\n🛠️ Development Commands:', 'bright'))
  console.log(`${colorize('Start Dev:', 'yellow')}    npm run dev`)
  console.log(`${colorize('Start Prod:', 'yellow')}   npm start`)
  console.log(`${colorize('View API:', 'yellow')}     curl http://localhost:${port}/api/${apiVersion}`)
}

function main() {
  console.log(colorize('\n🎯 QuickPay Backend Setup', 'bright'))
  console.log(colorize('=' + '='.repeat(48), 'blue'))
  
  const envOk = checkEnvironment()
  const depsOk = checkDependencies()
  
  if (!envOk || !depsOk) {
    console.log(colorize('\n❌ Setup incomplete. Please fix the issues above.', 'red'))
    process.exit(1)
  }
  
  printServerInfo()
  
  console.log(colorize('\n✅ Setup complete! Ready to start the server.', 'green'))
  console.log(colorize('\n💡 Tip: Make sure your Supabase database has the schema from database/schema.sql', 'cyan'))
}

if (require.main === module) {
  main()
}

module.exports = {
  checkEnvironment,
  checkDependencies,
  printServerInfo
}
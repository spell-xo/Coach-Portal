#!/bin/bash

# AI Reports Feature Setup Script
# This script sets up the AI-powered player reports feature

echo "=================================================="
echo "  AIM Coach Portal - AI Reports Setup"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the aim-coach-portal-ui directory."
    exit 1
fi

echo "✓ Found package.json"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

echo ""
echo "✓ Dependencies installed successfully"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file for API keys..."
    echo "# Anthropic API Key for Claude AI" > .env
    echo "# Get your key from: https://console.anthropic.com/" >> .env
    echo "# REACT_APP_ANTHROPIC_API_KEY=your_api_key_here" >> .env
    echo ""
    echo "✓ Created .env file (you can add your API key later)"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=================================================="
echo "  Setup Complete! 🎉"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   npm start"
echo ""
echo "2. Navigate to any player profile page"
echo ""
echo "3. Click the 'Overview' tab to see the AI report"
echo ""
echo "4. Toggle between view modes:"
echo "   - Comprehensive: Detailed analysis"
echo "   - Compact: Quick summary"
echo "   - Dashboard: Metrics-focused"
echo ""
echo "=================================================="
echo ""
echo "📚 For more information, see:"
echo "   AI_REPORT_IMPLEMENTATION.md"
echo ""
echo "🔧 To use the real Claude API:"
echo "   1. Get an API key from https://console.anthropic.com/"
echo "   2. Add it to .env: REACT_APP_ANTHROPIC_API_KEY=your_key"
echo "   3. In aiReportService.js, set useHardcodedData = false"
echo ""
echo "=================================================="

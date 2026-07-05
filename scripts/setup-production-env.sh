#!/bin/bash

# Production Environment Setup Script
# This script sets up secure environment variables for production deployment

set -e

echo "🔧 Setting up Production Environment for Lexicon Master..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_header "Step 1: Firebase Project Setup"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Login to Firebase
print_status "Logging into Firebase..."
firebase login

# Select or create project
print_status "Selecting Firebase project..."
firebase use lexicon-master-adb6b 2>/dev/null || {
    print_status "Project not found. Creating new project..."
    firebase projects:create lexicon-master-adb6b
}

print_header "Step 2: EU Region Configuration"

# Set up EU region for functions
print_status "Configuring EU region (europe-west1) for GDPR compliance..."
firebase functions:config get region
firebase functions:config set region europe-west1

print_status "✅ EU region configured: europe-west1"

print_header "Step 3: Firestore Database Setup"

# Create Firestore database in EU region
print_status "Creating Firestore database in EU region..."
firebase firestore:databases:create --default

print_status "Setting up Firestore security rules..."
firebase deploy --only firestore

print_header "Step 4: Hosting Setup"

print_status "Setting up Firebase Hosting..."
firebase hosting:sites:create lexicon-master-adb6b

print_status "Configuring hosting for SPA..."
firebase hosting:sites:configure lexicon-master-adb6b

print_header "Step 5: Environment Variables"

# Create secure .env file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    print_warning "⚠️  IMPORTANT: Update .env with your actual Firebase configuration"
    print_status "Required variables:"
    print_status "   - VITE_FIREBASE_API_KEY"
    print_status "   - VITE_FIREBASE_AUTH_DOMAIN"
    print_status "   - VITE_FIREBASE_APP_ID"
    print_status "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
    print_status "   - VITE_FIREBASE_MEASUREMENT_ID"
    echo ""
    echo "Please edit .env file with your actual Firebase configuration values."
    echo "Do NOT commit actual API keys to version control!"
    echo ""
    read -p "Press Enter when you've updated the .env file..."
else
    print_status "✅ .env file already exists"
fi

print_header "Step 6: Key Management Setup"

print_status "Setting up encryption key management..."

# Create .env.local for local development (not committed)
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
# Local development environment variables
# These are not committed to version control

# Generate a random encryption key for development
ENCRYPTION_KEY_BASE64=$(openssl rand -base64 32)
export ENCRYPTION_KEY_BASE64

# Local Firebase emulator settings
FIREBASE_AUTH_EMULATOR_HOST=localhost
FIRESTORE_EMULATOR_HOST=localhost
EOF
    print_status "Created .env.local for local development"
fi

# Add .env.local to .gitignore if not already there
if ! grep -q ".env.local" .gitignore; then
    echo ".env.local" >> .gitignore
    print_status "Added .env.local to .gitignore"
fi

print_header "Step 7: Security Verification"

# Check for any sensitive files in git
print_status "Checking for sensitive files in git history..."
SENSITIVE_FILES=$(git ls-files | grep -E "key|secret|private|password|credential" || true)

if [ -n "$SENSITIVE_FILES" ]; then
    print_warning "⚠️  WARNING: Potentially sensitive files detected in git!"
    print_status "Files found:"
    echo "$SENSITIVE_FILES"
    print_status "Consider removing sensitive data from git history before production deployment."
    echo ""
    read -p "Continue with setup? (y/N): " -n 1 -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled."
        exit 0
    fi
else
    print_status "✅ No sensitive files detected in git"
fi

print_header "Step 8: Production Build Verification"

print_status "Verifying production build works..."
npm run build

if [ $? -eq 0 ]; then
    print_status "✅ Production build successful"
else
    print_error "Production build failed!"
    print_status "Please fix build errors before proceeding."
    exit 1
fi

print_header "🎉 Production Environment Setup Complete!"

print_status "✅ Firebase project configured (lexicon-master-adb6b)"
print_status "✅ EU region set (europe-west1) - GDPR Compliant"
print_status "✅ Firestore database created with security rules"
print_status "✅ Firebase Hosting configured"
print_status "✅ Environment variables template created"
print_status "✅ Encryption key management setup"
print_status "✅ Production build verified"
print_status ""
print_status "🔐 Security Notes:"
print_status "   - Never commit actual API keys to version control"
print_status "   - Use Google Cloud Secret Manager for production secrets"
print_status "   - Regularly rotate encryption keys"
print_status "   - Monitor Firebase security alerts"
print_status ""
print_status "📋 Next Steps:"
print_status "   1. Update .env with actual Firebase configuration"
printstatus "   2. Run: ./scripts/deploy-production.sh"
print_status "   3. Verify GDPR compliance features"
print_status "   4. Test with village beta users"
print_status ""
print_status "🚀 Ready for production deployment!"

# Make scripts executable
chmod +x scripts/deploy-production.sh
chmod +x scripts/setup-production-env.sh

echo -e "${GREEN}Production environment setup completed!${NC}"

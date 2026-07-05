#!/bin/bash

# Lexicon Master Production Deployment Script
# This script handles GDPR-compliant deployment to EU region

set -e

echo "🚀 Starting Lexicon Master Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

print_header "Step 1: Pre-Deployment Checks"

# Run tests to ensure everything is working
print_status "Running test suite..."
npm test
if [ $? -ne 0 ]; then
    print_error "Tests failed! Please fix issues before deploying."
    exit 1
fi

# Run type checking
print_status "Running TypeScript type checking..."
npm run typecheck
if [ne 0 ]; then
    print_error "TypeScript errors found! Please fix before deploying."
    exit 1
fi

# Run linting
print_status "Running linting..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting warnings found. Please review before proceeding."
    read -p "Continue with deployment? (y/N): " -n 1 -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

print_header "Step 2: Firebase Configuration"

# Check if Firebase project is configured
if [ ! -f ".firebaserc" ]; then
    print_status "Setting up Firebase project..."
    firebase use lexicon-master-adb6b
else
    print_status "Firebase project already configured."
fi

# Verify EU region configuration
print_status "Verifying Firebase EU region configuration..."
if grep -q "europe-west1" firebase.json; then
    print_status "✅ EU region (europe-west1) configured correctly"
else
    print_error "EU region not configured in firebase.json"
    print_status "Please ensure 'region': 'europe-west1' is set in functions section"
    exit 1
fi

print_header "Step 3: Security Configuration"

# Check for encryption keys in source control (security risk)
print_status "Checking for encryption keys in source control..."
if git ls-files | grep -q "key.*\.pem\|.*private.*key\|.*secret.*"; then
    print_error "⚠️  WARNING: Potential encryption keys found in source control!"
    print_status "Please remove any encryption keys from git history before deploying."
    read -p "Continue anyway? (not recommended): (y/N): " -n 1 -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled for security reasons."
        exit 0
    fi
else
    print_status "✅ No encryption keys found in source control"
fi

print_header "Step 4: Environment Variables"

# Check for required environment variables
print_status "Checking environment variables..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_status "⚠️  Please update .env with your actual Firebase configuration values:"
    print_status "   - VITE_FIREBASE_API_KEY"
    print_status "   - VITE_FIREBASE_AUTH_DOMAIN"
    print_status "   - VITE_FIREBASE_APP_ID"
    print_status "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
    print_status "   - VITE_FIREBASE_MEASUREMENT_ID"
    echo ""
    read -p "Press Enter after updating .env file..."
else
    print_status "✅ .env file found"
fi

# Verify critical environment variables
source .env
if [ -z "$VITE_FIREBASE_API_KEY" ] || [ "$VITE_FIREBASE_API_KEY" = "your_api_key_here" ]; then
    print_error "Please set VITE_FIREBASE_API_KEY in .env file"
    exit 1
fi

print_header "Step 5: Production Build"

# Build the application
print_status "Building production version..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed! Please fix build errors."
    exit 1
fi

print_status "✅ Production build completed"

print_header "Step 6: Firebase Deployment"

# Deploy to Firebase Hosting
print_status "Deploying to Firebase Hosting (EU region)..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    print_status "✅ Hosting deployment successful"
else
    print_error "Hosting deployment failed!"
    exit 1
fi

# Deploy Firestore rules
print_status "Deploying Firestore security rules..."
firebase deploy --only firestore

if [ $? -eq 0 ]; then
    print_status "✅ Firestore rules deployed"
else
    print_error "Firestore rules deployment failed!"
    exit 1
fi

print_header "Step 7: Post-Deployment Verification"

# Verify the deployment
print_status "Verifying deployment..."
SITE_URL="https://lexicon-master-adb6b.web.app"

# Check if the site is accessible
if curl -s "$SITE_URL" > /dev/null; then
    print_status "✅ Site is accessible at $SITE_URL"
else
    print_warning "Site may still be propagating. Please check manually."
fi

print_header "🎉 Deployment Complete!"

print_status "Lexicon Master has been successfully deployed to production!"
print_status ""
print_status "📍  Production URL: $SITE_URL"
print_status "🇪🇺  Region: Europe (europe-west1) - GDPR Compliant"
print_status "🔒  Security: AES-256 encryption enabled"
print_status "📚  Privacy Policy: Available at ${SITE_URL}/privacy-policy"
print_status "📄  Terms of Service: Available at ${SITE_URL}/terms-of-service"
print_status ""
print_status "Next Steps:"
print_status "1. Test the deployment in your browser"
print_status "2. Verify language switching works correctly"
print_status "3. Test user registration with terms acceptance"
print_status "4. Verify GDPR compliance features"
print_status ""
print_status "🏘️  Village Beta Testing:"
print_status "Consider sharing with village friends for real-world testing:"
print_status "   - Language toggle functionality"
print_status "   - GDPR compliance (data export/deletion requests)"
print_status "   - Accessibility features"
print_status "   - Game performance with encrypted data"
print_status ""
print_status "📞  Support: privacy@lexicon-master.com"
print_status "🔧  Technical: tech-support@lexicon-master.com"

echo -e "${GREEN}Deployment completed successfully!${NC}"

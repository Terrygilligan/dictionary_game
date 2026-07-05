# Lexicon Master Documentation

## Overview

Lexicon Master is a multilingual dictionary game platform designed for village communities, built with privacy and GDPR compliance at its core.

## Documentation Structure

### Legal & Compliance
- [**Privacy Policy**](./PrivacyPolicy.md) - Comprehensive GDPR-compliant privacy policy
- [**Terms of Service**](./TermsOfService.md) - User terms and conditions
- **Data Protection** - Information about data processing and user rights

### Technical Documentation
- **Architecture** - System architecture and design patterns
- **Security** - Crypto-shredding and encryption implementation
- **API** - Service interfaces and data structures
- **Deployment** - Setup and configuration guides

### User Documentation
- **Getting Started** - Quick start guide for new users
- **Game Rules** - How to play different game modes
- **Language Support** - Available languages and localization
- **Accessibility** - Features for users with disabilities

## Key Features

### 🌍 Multilingual Support
- **Languages:** English, Dutch, Bulgarian, Indonesian, French, German
- **Real-time Switching:** Change language without page reload
- **Community Contributions:** Framework for village-contributed translations

### 🔒 Privacy & Security
- **GDPR Compliant:** Full compliance with EU data protection laws
- **Crypto-Shredding:** Encryption keys can be destroyed for permanent data deletion
- **EU-Based Storage:** All data stored in European Union data centers
- **Data Minimization:** Only essential data collected and processed

### 🎮 Game Features
- **Multiple Game Modes:** Dictionary quiz, word selection challenges
- **Progress Tracking:** Comprehensive statistics and achievement system
- **Social Features:** Friend connections and community interaction
- **Accessibility:** Full support for screen readers and keyboard navigation

## Architecture Highlights

### Feature-Sliced Design (FSD)
```
app/ → pages/ → features/ → entities/ → shared/
```

### Event Sourcing
- **Immutable Event Log:** All state changes recorded as events
- **Deterministic Replay:** State can be reconstructed from event history
- **Blind Arbiter:** Game logic remains pure and testable

### Security Architecture
- **AES-256 Encryption:** All sensitive data encrypted at rest
- **Key Management:** Secure key rotation and destruction
- **Zero-Knowledge:** Service providers cannot access user data

## GDPR Compliance

### Data Protection Principles
- **Lawfulness, Fairness, Transparency:** Clear data processing policies
- **Purpose Limitation:** Data collected only for specified purposes
- **Data Minimization:** Only necessary data collected
- **Accuracy:** Regular data validation and correction
- **Storage Limitation:** Data retained only as long as necessary
- **Integrity & Confidentiality:** Robust security measures
- **Accountability:** Regular compliance audits and assessments

### User Rights Implementation
- **Right to Access:** Users can request all personal data
- **Right to Rectification:** Inaccurate data can be corrected
- **Right to Erasure:** "Right to be forgotten" via crypto-shredding
- **Right to Portability:** Data provided in machine-readable format
- **Right to Object:** Users can object to processing activities

## Security Implementation

### Crypto-Shredding System
```typescript
// Sensitive data encryption
const encrypted = encryptSensitiveData(user.email)

// Permanent deletion via key destruction
cryptoShredData(keyId) // Data becomes unrecoverable
```

### Encryption Standards
- **Algorithm:** AES-256-GCM for symmetric encryption
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Random Generation:** Cryptographically secure random values
- **Key Management:** Secure key rotation and destruction

## Deployment Information

### Firebase Configuration
- **Project ID:** lexicon-master-adb6b
- **Region:** Europe (europe-west1)
- **Services:** Firestore, Authentication, Storage
- **Security Rules:** Role-based access control

### Environment Setup
```bash
# Required environment variables
VITE_FIREBASE_PROJECT_ID=lexicon-master-adb6b
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=lexicon-master-adb6b.firebaseapp.com
```

## Contributing

### Development Guidelines
- **Code Quality:** All tests must pass, linting enforced
- **Architecture:** Strict adherence to FSD principles
- **Privacy:** Privacy impact assessment for new features
- **Accessibility:** WCAG 2.1 AA compliance required

### Community Contributions
- **Translations:** Community-sourced translations welcome
- **Bug Reports:** Use GitHub issues for bug reporting
- **Feature Requests:** Community feedback drives development
- **Security:** Security vulnerabilities reported privately

## Support

### Contact Information
- **General Support:** support@lexicon-master.com
- **Privacy Issues:** privacy@lexicon-master.com
- **Security Issues:** security@lexicon-master.com
- **GDPR Requests:** gdpr@lexicon-master.com

### Documentation Updates
- **Review Cycle:** Quarterly review of all documentation
- **Version Control:** All changes tracked and dated
- **Legal Review:** Legal review for policy changes
- **Community Feedback:** User feedback incorporated

## License

This project is licensed under the [MIT License](../LICENSE). See the license file for full details.

---

**Last Updated:** July 4, 2026  
**Version:** 1.0

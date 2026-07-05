# Security Advisory - Exposed API Key

## 🚨 CRITICAL SECURITY ISSUE

An exposed Google Firebase API key was detected in the git repository and has been removed.

### Affected Key
```
AIzaSyDZqGA5S4iaEPrJH7OYlKdjuqH060zl7DU
```

### Immediate Actions Required

#### 1. Revoke the Exposed Key
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select project: `lexicon-master-adb6b`
- Navigate to Project Settings → General → Web apps
- Find the API key and click "Regenerate key"
- **Delete the old key immediately**

#### 2. Generate New API Key
- In the same location, click "Generate new key"
- Copy the new key securely
- Update your local `.env` file:
  ```bash
  VITE_FIREBASE_API_KEY=your_new_api_key_here
  ```

#### 3. Update Deployment
- The current deployment uses the old key and may fail
- After updating the `.env` file locally:
  ```bash
  npm run build
  firebase deploy --only hosting
  ```

### Security Measures Implemented

✅ **Fixed in this commit:**
- Added `.env` to `.gitignore` to prevent future exposure
- Removed `.env` file from git tracking
- Replaced exposed key with placeholder
- Maintained safe `.env.example` template

### Best Practices for Future

1. **Never commit `.env` files** to version control
2. **Use environment-specific keys** for development/staging/production
3. **Regularly rotate API keys** especially if exposure is suspected
4. **Monitor Firebase console** for unusual activity
5. **Use Firebase Security Rules** to restrict access even with valid keys

### Monitoring

After generating the new key:
- Monitor Firebase console for unusual activity
- Check that the application still functions properly
- Verify that authentication and database access work correctly

### Recovery Timeline

- **Immediate**: Revoke old key (5 minutes)
- **Immediate**: Generate new key (2 minutes)  
- **Immediate**: Update local environment (1 minute)
- **Within 1 hour**: Deploy with new key
- **Within 24 hours**: Monitor for any issues

---

**Status**: 🔴 CRITICAL - Action Required  
**Updated**: July 5, 2026  
**Next Review**: After key regeneration

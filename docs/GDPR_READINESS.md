# GDPR Readiness & Crypto-Shredding Strategy

**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Structural Implementation Complete, KMS Pending

---

## Executive Summary

The Lexicon Master application implements a crypto-shredding strategy to support the GDPR "Right to be Forgotten" while maintaining the immutability of our event-sourced architecture. This approach allows legally compliant data deletion without requiring risky physical purging of immutable event logs.

### Core Strategy
- **Identity Segregation**: All user data partitioned by `tenant_id` and `aggregate_id`
- **Encryption at the Edge**: Sensitive data encrypted before reaching the database
- **Key-Based Shredding**: Destroy encryption keys to render data cryptographically unreachable

---

## Architectural Principles

### 1. Identity Segregation
Every user operation carries explicit identity metadata:
- `tenant_id`: Unique identifier for the tenant (user, organization, etc.)
- `aggregate_id`: Unique identifier for the aggregate (user session, entity instance)

This ensures complete tenant isolation and enables per-user key management.

### 2. Encryption at the Edge
Sensitive user data is encrypted within the `UserProjectionService` before being written to Firestore:
- **Encrypted Fields**: `email`, `displayName`
- **Algorithm**: AES-256-GCM
- **Key Management**: Currently uses shared key (future: per-user keys via KMS)

### 3. Key-Based Shredding
By assigning each user a unique Data Encryption Key (DEK) identified by `encryption_key_id`, we can:
- Render all historical data (event store) cryptographically unreachable by destroying the DEK
- Render current read model data unreachable by destroying the DEK
- Maintain audit trail compliance while achieving legal deletion

---

## Current Implementation Status

### ✅ Completed
- Identity segregation via `tenant_id` and `aggregate_id` enforcement
- Encryption at edge implemented via `UserProjectionService`
- AES-256-GCM encryption for sensitive fields
- Structural preparation for `encryption_key_id` in event envelopes
- Structural preparation for `encryption_key_id` in Firestore documents
- Multi-tenant isolation enforcement with strict validation

### ⏳ In Progress
- Key Management Service (KMS) implementation
- Per-user encryption key generation and rotation
- `encryption_key_id` field activation in envelopes and documents

### ❌ Not Started
- Deletion orchestration handler (`user.deleted` event)
- Key destruction workflow
- GDPR compliance certification process

---

## Implementation Roadmap

### Phase 1: Structural Preparation ✅ COMPLETE
- [x] Add `encryption_key_id` field to `UserEventEnvelope` (commented)
- [x] Add `encryption_key_id` field to Firestore user documents (commented)
- [x] Document crypto-shredding strategy in SCRATCHPAD
- [x] Create this GDPR Readiness documentation

### Phase 2: Key Management Service (KMS) - PENDING
- [ ] Implement `src/services/KeyManagementService.ts`
- [ ] Create per-user DEK generation
- [ ] Implement key rotation mechanism
- [ ] Add key versioning support
- [ ] Implement key destruction workflow
- [ ] Add key access logging

### Phase 3: Event Schema Evolution - PENDING
- [ ] Uncomment `encryption_key_id` in `UserEventEnvelope`
- [ ] Update `createUserEventEnvelope` to accept `encryption_key_id`
- [ ] Modify `AuthCommandService` to generate and include `encryption_key_id`
- [ ] Update all user event types to support `encryption_key_id`

### Phase 4: Read Model Updates - PENDING
- [ ] Uncomment `encryption_key_id` in `UserProjectionService`
- [ ] Store `encryption_key_id` in Firestore user documents
- [ ] Update encryption functions to use per-user keys from KMS
- [ ] Add migration script for existing documents

### Phase 5: Deletion Orchestration - PENDING
- [ ] Create `user.deleted` domain event
- [ ] Implement deletion handler in `UserProjectionService`
- [ ] Add key destruction trigger on `user.deleted`
- [ ] Implement event store cleanup (optional)
- [ ] Add deletion audit logging

### Phase 6: Compliance & Testing - PENDING
- [ ] GDPR compliance audit
- [ ] Security penetration testing
- [ ] Data deletion verification testing
- [ ] Key rotation disaster recovery testing
- [ ] Legal review and certification

---

## Technical Specifications

### Encryption Implementation

**Location**: `src/shared/lib/security/cryptoShreddingBrowser.ts`

**Algorithm**: AES-256-GCM
- Key length: 256 bits
- IV length: 12 bytes
- Salt length: 32 bytes
- Auth tag: 16 bytes

**Encrypted Fields**:
- `email`: User email address
- `displayName`: User display name

**Key Management**:
- Current: Shared key for all users (placeholder)
- Future: Per-user keys via KMS
- Key storage: Encrypted in Firestore or external KMS

### Event Envelope Structure

```typescript
interface UserEventEnvelope {
  readonly type: string
  readonly tenant_id: string        // Multi-tenant identity
  readonly aggregate_id: string     // Aggregate identity
  readonly correlationId: string    // Audit trail
  readonly timestamp: string        // Event timestamp
  readonly eventType: string        // Event type
  readonly payload: unknown         // Event payload
  // readonly encryption_key_id?: string  // Future: Per-user key ID
}
```

### Firestore Document Structure

```typescript
interface UserDocument {
  // Encrypted sensitive fields
  email: string           // Encrypted
  displayName: string     // Encrypted
  
  // Non-sensitive fields
  emailVerified: boolean
  createdAt: string
  
  // Multi-tenant metadata
  tenant_id: string
  aggregate_id: string
  
  // Audit metadata
  correlationId: string
  projectedAt: Timestamp
  
  // Future: Crypto-shredding support
  // encryption_key_id: string
}
```

---

## Security Considerations

### Key Security Requirements
1. **Key Storage**: Keys must be stored securely (encrypted at rest)
2. **Key Access**: Strict access controls and logging
3. **Key Rotation**: Regular key rotation with versioning
4. **Key Destruction**: Secure key deletion with verification
5. **Backup Recovery**: Disaster recovery for key management

### Data Protection Requirements
1. **Encryption at Rest**: All sensitive data encrypted before storage
2. **Encryption in Transit**: TLS for all network communications
3. **Access Control**: Role-based access to user data
4. **Audit Logging**: Complete audit trail for data access
5. ** breach Notification**: Automated breach detection and notification

### Compliance Requirements
1. **Right to Access**: User can request their data
2. **Right to Rectification**: User can correct their data
3. **Right to Erasure**: User can request deletion (crypto-shredding)
4. **Right to Portability**: User can export their data
5. **Right to Object**: User can object to processing

---

## Operational Procedures

### User Registration Flow
1. User registers via `AuthCommandService`
2. Event published to outbox with tenant_id and aggregate_id
3. OutboxProcessor routes to UserEventBus
4. UserProjectionService subscribes and processes event
5. Sensitive data encrypted before Firestore write
6. Document stored with multi-tenant metadata

### User Deletion Flow (Future)
1. User requests deletion via command
2. `user.deleted` event published
3. Deletion handler triggered
4. KMS destroys user's encryption key
5. All user data becomes cryptographically unreachable
6. Audit log records deletion completion

### Key Rotation Flow (Future)
1. KMS generates new DEK for user
2. New key ID assigned to user
3. Existing data re-encrypted with new key
4. Old key scheduled for destruction
5. Audit log records rotation completion

---

## Monitoring and Alerting

### Key Metrics
- Encryption key generation rate
- Key rotation success rate
- Key destruction success rate
- Data deletion completion time
- Encryption/decryption latency

### Alert Conditions
- Key generation failures
- Key rotation failures
- Key destruction failures
- Data deletion failures
- Encryption errors
- Unauthorized key access attempts

---

## References

### Internal Documentation
- SCRATCHPAD.md Entry 0013: GDPR & Crypto-Shredding Readiness
- AGENTS.md: Lexicon Master Architecture Manifesto
- ARCHITECTURAL_MANIFESTO.md: Overall architecture documentation

### External References
- GDPR Regulation (EU) 2016/679
- NIST Special Publication 800-57: Key Management
- OWASP Cryptographic Storage Cheat Sheet

---

## Contact and Governance

**Architecture Owner**: Development Team  
**Security Review**: Pending  
**Legal Review**: Pending  
**Compliance Certification**: Pending

---

*This document is a living reference and will be updated as the crypto-shredding implementation progresses.*

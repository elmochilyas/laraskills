# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Column-level RSA encryption with key rotation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Ciphertext Column Too Small**: Using `string(255)` for encrypted columns â€” ciphertext is 200-300+ chars, silently truncates
- [ ] Prevent anti-pattern: Encrypted Columns in WHERE/LIKE Clauses**: Non-deterministic encryption makes equality searches always miss
- [ ] Prevent anti-pattern: No Encrypted Field Logging Redaction**: Encrypted-then-decrypted values appear in plaintext in Laravel logs
- [ ] RSA keys generated and stored securely (not in version control)
- [ ] `Encryptable` trait added to models with sensitive fields
- [ ] Encrypted attributes listed in `$encryptable` array
- [ ] Encrypted columns not used in WHERE or LIKE queries
- [ ] Key rotation procedure documented
- [ ] Avoid: Mistake
- [ ] Avoid: Encrypting all columns
- [ ] Avoid: Storing private key in database

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `eloquent-encryption` package, publish config and migration
- Add `EncryptedAttribute` trait to models
- Define encrypted attributes in model's `$casts`: `'ssn' => 'encrypted'`
- Store RSA private key in server file (restricted permissions), Vault, or environment variable
- Store public key in application code or config (public key is not secret)
- Key rotation: batch job reads all records, decrypts with old key, encrypts with new key

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] RSA keys generated and stored securely (not in version control)
- [ ] - [ ] `Encryptable` trait added to models with sensitive fields
- [ ] - [ ] Encrypted attributes listed in `$encryptable` array
- [ ] - [ ] Encrypted columns not used in WHERE or LIKE queries

# Performance Checklist
- RSA decrypt: ~1-5ms per field (2048-bit key). Multiple encrypted fields compound the cost.
- Encrypt on write, decrypt on read â€” read-heavy workloads feel the overhead.
- Cannot index encrypted columns for equality or range queries.
- Search over encrypted data requires application-level decryption and matching â€” slow for large datasets.
- Consider deterministic encryption for searchable fields (less secure but searchable).

# Security Checklist
- **Key Separation**: The RSA private key is the root of all encrypted data. Store it separately from the database and application code.
- **Key Rotation**: When the private key is compromised, all data encrypted with the corresponding public key must be re-encrypted with a new key.
- **Backup Encryption**: Database backups contain encrypted data â€” the private key is required to decrypt. Ensure key backups are separate from database backups.
- **Timing Attacks**: RSA decryption time varies slightly with input â€” consider constant-time implementations for high-security contexts.

# Reliability Checklist
- [ ] Ensure: Column-level encryption encrypts specific database fields individually rather th...

# Testing Checklist
- [ ] RSA keys generated and stored securely (not in version control)
- [ ] `Encryptable` trait added to models with sensitive fields
- [ ] Encrypted attributes listed in `$encryptable` array
- [ ] Encrypted columns not used in WHERE or LIKE queries
- [ ] Key rotation procedure documented
- [ ] Private key access restricted to application only
- [ ] Avoid: Mistake
- [ ] Avoid: Encrypting all columns
- [ ] Avoid: Storing private key in database

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Ciphertext Column Too Small**: Using `string(255)` for encrypted columns â€” ciphertext is 200-300+ chars, silently truncates
- [ ] Prevent: Encrypted Columns in WHERE/LIKE Clauses**: Non-deterministic encryption makes equality searches always miss
- [ ] Prevent: No Encrypted Field Logging Redaction**: Encrypted-then-decrypted values appear in plaintext in Laravel logs
- [ ] Prevent: Round-Trip Test Omission**: No feature test verifying ciphertext is stored (not plaintext)
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Encrypting all columns
- [ ] Avoid mistake: Storing private key in database
- [ ] Avoid mistake: Not planning key rotation
- [ ] Avoid mistake: Encrypting indexed/searchable fields

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Ciphertext Column Too Small**: Using `string(255)` for encrypted columns â€” ciphertext is 200-300+ chars, silently truncates
- Encrypted Columns in WHERE/LIKE Clauses**: Non-deterministic encryption makes equality searches always miss
- No Encrypted Field Logging Redaction**: Encrypted-then-decrypted values appear in plaintext in Laravel logs
- Round-Trip Test Omission**: No feature test verifying ciphertext is stored (not plaintext)
## Skills
- Encrypt Database Columns Transparently with eloquent-encryption



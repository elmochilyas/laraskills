# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Laravel Crypt facade (AES-256-CBC/GCM)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Try-Catch Around Decrypt**: All decrypt calls missing exception handling
- [ ] Prevent anti-pattern: Same APP_KEY Across Environments**: Dev can decrypt production data
- [ ] Prevent anti-pattern: Encrypted Data in VARCHAR(255)**: Payload truncated, data corrupted
- [ ] `APP_KEY` is a secure 32-byte base64-encoded string
- [ ] Encrypted data stored as-is (no manual unserialization of encrypted payload)
- [ ] `DecryptException` handled when data cannot be decrypted
- [ ] Encrypted fields never used in WHERE clauses or indexes
- [ ] Key rotation plan documented if `APP_KEY` changes
- [ ] Avoid: Mistake
- [ ] Avoid: Using Crypt for one-way hashing
- [ ] Avoid: Ignoring DecryptException

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- `Crypt::encryptString($value)` for raw strings stored in database columns
- `Crypt::encrypt($value)` for structured data (arrays, objects) â€” JSON serialized
- Encrypted values are safe for URLs (base64 encodes without URL-unsafe characters)
- Key rotation: decrypt all values with old key â†’ re-encrypt with new key
- Cache key in memory after first use â€” don't read APP_KEY on every encrypt/decrypt

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `APP_KEY` is a secure 32-byte base64-encoded string
- [ ] - [ ] Encrypted data stored as-is (no manual unserialization of encrypted payload)
- [ ] - [ ] `DecryptException` handled when data cannot be decrypted
- [ ] - [ ] Encrypted fields never used in WHERE clauses or indexes

# Performance Checklist
- Encrypt/decrypt: ~0.1-2ms per operation depending on data size and algorithm
- AES-256-GCM is slightly faster than AES-256-CBC + HMAC
- Large payloads (1MB+) take proportionally longer â€” avoid encrypting large binary data
- No network overhead â€” all operations are local

# Security Checklist
- **APP_KEY is the Root of Trust**: All encryption security depends on APP_KEY secrecy. Store in environment variable, restrict file permissions.
- **Tamper Detection**: HMAC (CBC) or auth tag (GCM) detects tampering. `DecryptException` on tampered data.
- **Key Rotation Invalidates Everything**: Changing APP_KEY makes all existing encrypted data unreadable. Plan rotation windows carefully.
- **No Authentication Without Crypt**: The Crypt facade is for encryption+integrity. For hashing (one-way), use `Hash` facade.

# Reliability Checklist
- [ ] Ensure: Laravel's `Crypt` facade provides symmetric encryption using AES-256-CBC (defaul...

# Testing Checklist
- [ ] `APP_KEY` is a secure 32-byte base64-encoded string
- [ ] Encrypted data stored as-is (no manual unserialization of encrypted payload)
- [ ] `DecryptException` handled when data cannot be decrypted
- [ ] Encrypted fields never used in WHERE clauses or indexes
- [ ] Key rotation plan documented if `APP_KEY` changes
- [ ] Avoid: Mistake
- [ ] Avoid: Using Crypt for one-way hashing
- [ ] Avoid: Ignoring DecryptException

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Try-Catch Around Decrypt**: All decrypt calls missing exception handling
- [ ] Prevent: Same APP_KEY Across Environments**: Dev can decrypt production data
- [ ] Prevent: Encrypted Data in VARCHAR(255)**: Payload truncated, data corrupted
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Crypt for one-way hashing
- [ ] Avoid mistake: Ignoring DecryptException
- [ ] Avoid mistake: Same APP_KEY across environments
- [ ] Avoid mistake: Encrypting with CBC and assuming GCM

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
- No Try-Catch Around Decrypt**: All decrypt calls missing exception handling
- Same APP_KEY Across Environments**: Dev can decrypt production data
- Encrypted Data in VARCHAR(255)**: Payload truncated, data corrupted
## Skills
- Encrypt and Decrypt Data Using Laravel's Crypt Facade



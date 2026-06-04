# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Envelope encryption DEK/KEK (Sealcraft)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No KMS Fallback Strategy**: Application crashes when KMS is unreachable â€” no DEK cache fallback
- [ ] Prevent anti-pattern: No KMS Audit Monitoring**: KMS decryption requests not monitored â€” unauthorized access goes undetected
- [ ] Prevent anti-pattern: Regional KEK Lock-In**: Multi-region deployment with single-region KEK â€” cross-region latency and access errors
- [ ] Sealcraft installed and configured with KMS provider
- [ ] KEK stored in KMS (not in application code or config)
- [ ] DEK caching implemented (not per-field KMS call)
- [ ] Per-record DEK strategy used (not one DEK for all)
- [ ] KMS IAM policies restricted to application service role
- [ ] Avoid: Mistake
- [ ] Avoid: Not caching DEKs
- [ ] Avoid: One DEK for all records

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `crumbls/sealcraft` via Composer
- Configure KMS provider in `config/sealcraft.php`
- Define which fields are envelope-encrypted via custom casts
- Each encrypted field stores: `base64(ciphertext) || . || base64(encrypted_dek)`
- KEK is never stored in the application â€” only referenced by KMS key ID/alias

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Sealcraft installed and configured with KMS provider
- [ ] - [ ] KEK stored in KMS (not in application code or config)
- [ ] - [ ] DEK caching implemented (not per-field KMS call)
- [ ] - [ ] Per-record DEK strategy used (not one DEK for all)

# Performance Checklist
- KEK decrypt: one KMS HTTP call per unique DEK â€” 10-100ms
- DEK encrypt (data): AES-256 â€” ~0.1ms per field
- DEK cache in memory: subsequent reads of same record skip KMS call
- Batch processing: decrypt DEK once, process many records
- KMS API rate limits: monitor and implement retry/backoff

# Security Checklist
- **KMS Access Control**: The KEK in KMS must have strict IAM policies â€” only the application's service role can use it.
- **DEK in Memory**: The plaintext DEK exists in application memory. Secure memory dumps, avoid logging.
- **KMS Audit Trail**: KMS provides an audit log of all key usage â€” monitor for unauthorized decryption requests.
- **KEK Deletion**: If the KEK is deleted from KMS, all data encrypted under it is permanently unrecoverable. Enable KMS key deletion recovery.
- **Region Lock**: If KEK is in a specific region, application in other regions cannot decrypt without cross-region KMS access.

# Reliability Checklist
- [ ] Ensure: Envelope encryption is a cryptographic pattern that wraps a Data Encryption Key ...

# Testing Checklist
- [ ] Sealcraft installed and configured with KMS provider
- [ ] KEK stored in KMS (not in application code or config)
- [ ] DEK caching implemented (not per-field KMS call)
- [ ] Per-record DEK strategy used (not one DEK for all)
- [ ] KMS IAM policies restricted to application service role
- [ ] KMS audit logging enabled and monitored
- [ ] Avoid: Mistake
- [ ] Avoid: Not caching DEKs
- [ ] Avoid: One DEK for all records

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No KMS Fallback Strategy**: Application crashes when KMS is unreachable â€” no DEK cache fallback
- [ ] Prevent: No KMS Audit Monitoring**: KMS decryption requests not monitored â€” unauthorized access goes undetected
- [ ] Prevent: Regional KEK Lock-In**: Multi-region deployment with single-region KEK â€” cross-region latency and access errors
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not caching DEKs
- [ ] Avoid mistake: One DEK for all records
- [ ] Avoid mistake: No KMS fallback
- [ ] Avoid mistake: KEK in wrong region

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
- No KMS Fallback Strategy**: Application crashes when KMS is unreachable â€” no DEK cache fallback
- No KMS Audit Monitoring**: KMS decryption requests not monitored â€” unauthorized access goes undetected
- Regional KEK Lock-In**: Multi-region deployment with single-region KEK â€” cross-region latency and access errors
## Skills
- Implement Envelope Encryption (DEK/KEK) for Large Payload Encryption



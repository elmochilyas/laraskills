# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** s3-compatible-storage-minio
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] MinIO container running and Console accessible
- [ ] `use_path_style_endpoint` set to `true` in config
- [ ] Bucket created matching `AWS_BUCKET`
- [ ] File upload/download works via Laravel Storage facade
- [ ] Presigned URLs generated and accessible
- [ ] CI has MinIO as service container
- [ ] Production `.env` uses real S3 endpoint
- [ ] Performance: - Local MinIO: <5ms latency per operation
- [ ] Performance: - Memory: 50-200MB depending on file count
- [ ] Performance: - Storage: equals total file size

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - MinIO in docker-compose.yml as optional service
- [ ] Architecture guideline: - Same `'s3'` disk config across environments; different endpoint/credentials in .env
- [ ] Architecture guideline: - Dev: `AWS_ENDPOINT=http://minio:9000`, `use_path_style_endpoint=true`
- [ ] Architecture guideline: - Prod: omit endpoint or use real S3 URL

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure MinIO for S3-Compatible Storage

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Local MinIO: <5ms latency per operation
- [ ] - Memory: 50-200MB depending on file count
- [ ] - Storage: equals total file size
- [ ] - CI: 5-10s setup overhead, fast operations

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only; no encryption, access logging, or backup
- [ ] - Don't store production or sensitive data in MinIO
- [ ] - Environment-specific credentials â€” dev creds (minioadmin) not valid in production

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] MinIO container running and Console accessible
- [ ] `use_path_style_endpoint` set to `true` in config
- [ ] Bucket created matching `AWS_BUCKET`
- [ ] File upload/download works via Laravel Storage facade
- [ ] Presigned URLs generated and accessible
- [ ] CI has MinIO as service container
- [ ] Production `.env` uses real S3 endpoint

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using MinIO for production storage -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Storing production-like PII in MinIO -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Configure MinIO for S3-Compatible Storage
### Anti-Patterns (from 08)
- Using MinIO for production storage
- Storing production-like PII in MinIO
### Related Rules (from 06 skills)
- MINIO-RULE-001: Environment-based disk selection
- MINIO-RULE-002: Set `use_path_style_endpoint` to true
- MINIO-RULE-003: Create buckets ahead
- MINIO-RULE-004: Use presigned URLs
- MINIO-RULE-005: CI service pattern
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Manage Laravel Environment Files


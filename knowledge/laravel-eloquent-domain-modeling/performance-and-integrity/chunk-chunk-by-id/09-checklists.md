# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** chunk-chunk-by-id
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `chunkById()` used instead of `chunk()` when dataset may mutate
- [ ] Key column is indexed
- [ ] Chunk size between 100 and 1000
- [ ] Callback wrapped in `DB::transaction()` for write operations
- [ ] Key column is never modified inside callback
- [ ] Checkpoint mechanism exists for batch jobs
- [ ] Processing runs in queue/CLI, not web request
- [ ] Performance: - `chunkById()` leverages the primary key index for `WHERE id > ?` â€” consta...
- [ ] Performance: - `chunk()` with large offsets degrades: `OFFSET 100000 LIMIT 100` still scan...
- [ ] Performance: - Each chunk is a separate query â€” N chunks produce N queries. Monitor quer...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place chunked processing in a queue job or artisan command, never in a web request
- [ ] Architecture guideline: - Pass the last processed ID as a job parameter to support resumability
- [ ] Architecture guideline: - Set batch size between 100 and 1000 â€” smaller batches reduce per-query memory but increase qu...
- [ ] Architecture guideline: - Use `chunkById()` over `chunk()` by default unless the dataset is proven read-only
- [ ] Decision: chunk() vs chunkById() Selection - ensure correct choice is made
- [ ] Decision: Batch Size Selection - ensure correct choice is made
- [ ] Decision: Checkpoint Strategy - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Mutation-Safe Batch Processing with chunkById

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `chunkById()` leverages the primary key index for `WHERE id > ?` â€” constant-time lookups regardless of page number
- [ ] - `chunk()` with large offsets degrades: `OFFSET 100000 LIMIT 100` still scans 100,100 rows
- [ ] - Each chunk is a separate query â€” N chunks produce N queries. Monitor query volume in production.
- [ ] - Batch size tuning: smaller batches (100â€“500) reduce per-query memory but increase round trips; larger batches (10...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - No direct security implications â€” chunking is a memory management strategy
- [ ] - Ensure exported data respects authorization boundaries (do not chunk-export data the user should not see)

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
- [ ] `chunkById()` used instead of `chunk()` when dataset may mutate
- [ ] Key column is indexed
- [ ] Chunk size between 100 and 1000
- [ ] Callback wrapped in `DB::transaction()` for write operations
- [ ] Key column is never modified inside callback
- [ ] Checkpoint mechanism exists for batch jobs
- [ ] Processing runs in queue/CLI, not web request

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Implement Mutation-Safe Batch Processing with chunkById
### Decision Trees (from 07)
- chunk() vs chunkById() Selection
- Batch Size Selection
- Checkpoint Strategy
### Related Rules (from 06 skills)
- Default to chunkById for Mutable Datasets (performance-and-integrity/chunk-chunk-by-id)
- Wrap Chunk Callbacks in Transactions (performance-and-integrity/chunk-chunk-by-id)
- Store Checkpoints for Resumability (performance-and-integrity/chunk-chunk-by-id)
- Never Modify the Key Column Inside chunkById (performance-and-integrity/chunk-chunk-by-id)
- Ensure the Key Column Is Indexed (performance-and-integrity/chunk-chunk-by-id)
- Set Batch Size Between 100 and 1000 (performance-and-integrity/chunk-chunk-by-id)
- Do Not Run Chunked Processing in Web Requests (performance-and-integrity/chunk-chunk-by-id)
- Never Use chunkById on Non-Unique Columns (performance-and-integrity/chunk-chunk-by-id)
### Related Skills (from 06 skills)
- Implement Memory-Efficient Streaming with cursor
- Implement Batch Processing with lazyById
- Implement Bulk Upsert Operations


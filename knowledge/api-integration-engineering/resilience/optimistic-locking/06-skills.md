# Skill: Use Optimistic Locking for Concurrent Idempotent Operations

## Purpose
Apply optimistic locking (version-based) to prevent race conditions in concurrent idempotent API operations where multiple retries or duplicate requests arrive simultaneously.

## When To Use
- Concurrent requests with the same idempotency key
- Preventing duplicate processing of the same idempotent operation
- Race conditions between retries and original requests
- High-throughput, low-contention idempotent operations

## When NOT To Use
- High-contention scenarios (pessimistic locking or queue required)
- Single-threaded processing pipelines
- Read-only operations

## Prerequisites
- Database with versioning support (MySQL, PostgreSQL)
- Idempotency key already implemented

## Workflow
1. Add version column to idempotency key storage
2. On request: read current version, check if processed
3. If not processed: attempt atomic update with version check
4. Use `UPDATE ... WHERE id = ? AND version = ?` for atomicity
5. If update affected rows = 0, another request won (retry or return stored)
6. Handle version conflict: return stored response (not 409)
7. Use database transactions for processing + version update
8. Test concurrent requests with same idempotency key

## Validation Checklist
- [ ] Version column added to idempotency storage
- [ ] Atomic version check on processing
- [ ] Concurrent request handling: winner processes, loser waits/returns
- [ ] Database transactions wrap processing + version update
- [ ] Version conflicts tested with concurrent requests

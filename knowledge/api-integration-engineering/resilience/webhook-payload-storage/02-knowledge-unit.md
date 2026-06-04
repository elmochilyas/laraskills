# Metadata
Domain: API Integration Engineering
Subdomain: Idempotency & Data Consistency
Knowledge Unit: Webhook Payload Storage and Audit Trail Design
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Webhook payload storage provides an audit trail of all incoming and outgoing webhooks, enabling debugging, replay, compliance, and analysis. The design involves storing the raw payload, headers, delivery status, and processing results in a structured database table. Both incoming (spatie/laravel-webhook-client) and outgoing (spatie/laravel-webhook-server) webhooks are stored using a `WebhookCall` model with standardized schemas, configurable header retention, and automatic cleanup policies.

## Core Concepts
- **WebhookCall Model**: Central database record storing webhook payload, headers, URL (outgoing), status, and attempt info
- **Payload Storage**: Raw request/response body stored as JSON text column
- **Header Storage**: Configurable subset of headers stored alongside payload for debugging and verification audit
- **Delivery Status Tracking**: Status field transitioning through states: pending → processing → success/failed
- **Attempt Logging**: Each delivery attempt recorded with timestamp, HTTP status, latency, and response body
- **Audit Trail Requirements**: Immutable record of all webhook activity for compliance and debugging
- **Retention Policy**: Automatic cleanup of old records (30-90 days typical) via scheduled pruning

## Mental Models
- **Black Box Recorder**: Like an airplane's flight data recorder, storing every webhook event for post-incident analysis
- **Ledger**: Each webhook call is an immutable ledger entry recording what was sent/received and when
- **Replay Source**: The stored payload is the source of truth for replaying failed webhooks

## Internal Mechanics
- Incoming storage: `/POST` → signature verified → `WebhookCall` created with `payload`, `headers`, `name`, `url` → status `pending` → job dispatched
- Outgoing storage: `WebhookCall::create()` in pending → dispatch → status `processing` → response stored → status `success`/`failed`
- Spatie's schema: `id`, `name`, `url`, `headers` (JSON), `payload` (JSON), `exception` (JSON), `processed_at`, `created_at`, `updated_at`
- Status is implicit via `processed_at` (null = pending/unprocessed, not null = processed)
- Headers are stored selectively via `store_headers` config (`['Signature', 'webhook-id']` or `'*'` for all)
- The `exception` column stores serialized exception details for failed processing
- Cleanup: `delete_after_days` config controls when records are pruned via scheduled job

## Patterns
- **Immutable Payload**: Store raw payload on arrival; never modify payload after creation
- **Selective Header Storage**: Store only needed headers (`Signature`, `webhook-id`, `webhook-timestamp`) to save space
- **Result Column for Retry Tracking**: Store per-attempt results in a JSON `result` column for outgoing webhooks
- **Indexed Queries**: Index `name`, `created_at`, and `processed_at` for efficient querying and cleanup
- **Compressed Payloads**: Use MySQL compression or compress payloads > 10KB to save storage
- **Separate Archive Table**: Move old records to an archive table or cold storage after the active retention period

## Architectural Decisions
- Store payload as JSON text column for flexibility (payload shapes vary between providers and event types)
- Index `created_at` for time-range queries and cleanup; index `name` for per-provider filtering
- Store headers as JSON to accommodate varying header structures per provider
- Keep audit trails for at least 30 days (regulatory minimum for most industries)
- Use separate `webhook_calls` table (not polymorphic) for cleaner schema and simpler queries
- Store exception details only for failed records to minimize storage for successful webhooks

## Tradeoffs
- Storing full payloads increases database storage (may be significant for high-volume webhooks)
- JSON columns are flexible but not indexable for payload content queries
- Selective header storage saves space but may miss headers needed for debugging
- Long retention improves audit capability but increases database size and cleanup overhead
- Storing exceptions adds debugging value but may contain sensitive data needing redaction

## Performance Considerations
- Webhook storage write: INSERT with payload JSON, ~5-20ms depending on payload size
- JSON encoding/decoding overhead: negligible for typical payloads (<100KB)
- Large payloads (>1MB) should be stored in external storage (S3, GCS) with reference in database
- Cleanup operations should run during low-traffic periods and use batch deletion
- Query performance degrades on un-indexed time-range queries on large tables

## Production Considerations
- Set `delete_after_days` to match regulatory requirements (30-90 days typical)
- Implement a retention strategy: active DB → archive table → cold storage → deletion
- Monitor `webhook_calls` table size and growth rate
- Index the table appropriately for the query patterns used by your retry dashboard
- Implement row-level TTL in MySQL 8.0+ or use Redis for short-term hot storage
- Set up alerts for failed webhook counts per provider (monitor from audit trail)
- Redact sensitive data (API keys, PII) from stored payloads (store sanitized version)

## Common Mistakes
- Not indexing `created_at` or `name` columns (full table scans on cleanup queries)
- Storing entire request body without size limits (blowing up database with large payloads)
- Modifying payload after initial storage (violates audit trail integrity)
- Not implementing automated cleanup (unbounded table growth over time)
- Storing sensitive data (API keys, tokens, PII) in the payload column without redaction
- Using `TEXT` column instead of `JSON` type for MySQL 8.0+ (loses JSON validation and indexing)

## Failure Modes
- Payload exceeds MySQL `max_allowed_packet` (INSERT fails, webhook data lost)
- Database storage exhaustion from unbounded webhook retention
- JSON parsing failure in stored payload (legacy format, schema changes)
- Index fragmentation on large tables degrades query performance
- Backup/restore failures due to oversized `webhook_calls` table
- Regulatory non-compliance if retention doesn't meet requirements

## Ecosystem Usage
- Spatie's `WebhookCall` model (shared between webhook-client and webhook-server) is the standard schema
- Industry practice: store webhook payloads for at least 30 days; financial services require 3-7 years
- Stripe, GitHub, and other major providers recommend payload storage for debugging and replay
- Common compliance requirements (PCI-DSS, SOC2, GDPR) mandate webhook audit trail retention
- Webhook gateway services (Svix, Convoy) provide managed storage and replay capabilities

## Related Knowledge Units
- K011: Spatie laravel-webhook-client (incoming payload storage)
- K012: Spatie laravel-webhook-server (outgoing payload storage)
- K006: Idempotency Key Pattern (idempotency keys in webhook storage)
- K031-K034: Event Sourcing for Integrations (evolved pattern over basic payload storage)
- K018: Webhook Payload Storage (this document)

## Research Notes
- Spatie's `WebhookCall` schema includes `payload` (longText), `headers` (longText), `exception` (longText)
- Industry best practice: add `processed_at` index for status-based queries
- MySQL 8.0+ supports JSON column type with validation; earlier versions use TEXT
- Reddit r/PHP "Building a Production-Ready Webhook System for Laravel" discusses retention strategies
- Compliance-driven retention often exceeds operational requirements; separate tiered storage is common

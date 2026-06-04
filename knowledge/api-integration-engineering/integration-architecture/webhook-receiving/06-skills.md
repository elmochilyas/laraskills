# Skill: Build a Production-Grade Webhook Receiving Pipeline

## Purpose
Design a production-grade webhook receiving pipeline with signature verification, payload validation, async processing, monitoring, and error handling.

## When To Use
- Any production application receiving webhooks
- Webhooks from multiple providers
- Building reliable, observable webhook infrastructure

## When NOT To Use
- Simple, development-only webhook endpoints

## Prerequisites
- Laravel application with HTTP routing
- Queue driver for async processing

## Workflow
1. Define POST route with CSRF exclusion
2. Implement signature verification middleware
3. Validate payload schema against expected format
4. Store raw payload for audit trail
5. Dispatch processing job to queue
6. Return 200 immediately after validation and queue
7. Handle failures: retry with backoff, dead-letter
8. Add monitoring: receipt rate, processing latency, error rate

## Validation Checklist
- [ ] POST route defined with CSRF exclusion
- [ ] Signature verification middleware in place
- [ ] Payload schema validated
- [ ] Raw payload stored for audit
- [ ] Processing dispatched to queue
- [ ] 200 returned promptly
- [ ] Failure handling with retry and dead-letter
- [ ] Monitoring for receipt rate, latency, errors

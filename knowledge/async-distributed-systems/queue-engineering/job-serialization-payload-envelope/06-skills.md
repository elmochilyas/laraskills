# Skill: Minimize Job Payload Size and Avoid Serialization Failures

## Purpose
Reduce job payload size by passing IDs instead of models, keeping payloads minimal, and avoiding closure serialization for complex jobs — preventing SQS 256KB limit issues and deserialization overhead.

## When To Use
When creating new job classes, refactoring existing jobs with large payloads, or debugging serialization failures.

## When NOT To Use
Jobs that genuinely need complex data structures that cannot be decomposed — still pass exactly what's needed.

## Prerequisites
- Understanding of PHP serialize() and payload envelope structure
- Knowledge of backend payload limits (SQS 256KB, Redis memory)

## Inputs
- Job constructor parameters
- Model relationships and sizes
- Backend type (Redis, SQS, database)

## Workflow
1. Pass model IDs instead of full models in job constructors
2. Re-fetch models in `handle()`: `$order = Order::find($this->orderId)`
3. Keep payload to only the data the job needs — no extra context
4. For closures: limit to simple fire-and-forget tasks (cache warm, log cleanup)
5. For SQS: if payload approaches 256KB, use Laravel 11+ overflow storage or split job

## Validation Checklist
- [ ] Job constructors use IDs, not full model instances
- [ ] Payload contains only necessary data fields
- [ ] No loaded relations serialized in payload
- [ ] Complex jobs use class jobs, not closures
- [ ] Payload size fits within backend limits
- [ ] No post-construction property modification (changes may not serialize)

## Common Failures
- Passing Eloquent models with loaded relations — serializes entire object graph
- Closures in batch callbacks — fragile serialization, no $this support
- Modifying job properties after constructor — changes not reflected in serialized payload
- Payload exceeding SQS 256KB limit — job silently lost

## Decision Points
- Complex data: pass IDs + re-fetch in handle()
- Simple data: pass scalar values directly
- Closures: only for one-off fire-and-forget tasks

## Performance Considerations
- Serialization time scales with object complexity
- Base64 encoding adds ~33% overhead
- Payload size directly impacts Redis memory and SQS network transfer

## Security Considerations
- Minimize sensitive data in payload — it's stored in the queue backend
- Model IDs are preferable to full model data for information exposure

## Related Rules
- Rule 1: pass-ids-not-models
- Rule 2: keep-payloads-minimal
- Rule 3: avoid-closures-for-complex-jobs
- Rule 4: dont-modify-job-properties-after-construction

## Related Skills
- Use SerializesModels to Prevent Stale Data and Payload Bloat
- Use Closures as Queued Jobs Safely

## Success Criteria
Job payloads are small (< 1KB for most jobs), contain only necessary data, fit within all backend limits, and serialize/deserialize without errors.

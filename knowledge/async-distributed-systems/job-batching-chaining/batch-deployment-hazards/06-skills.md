# Skill: Make Batch Callbacks Survive Deploys

## Purpose
Write thin batch callbacks that only dispatch dedicated job classes, preventing serialization failures when code changes between deployment and callback execution.

## When To Use
Any batch with post-processing logic that must survive deploys; production systems with frequent deployments.

## When NOT To Use
Development environments where batch callbacks don't need to survive deploys; one-shot batch operations.

## Prerequisites
- Understanding of callback serialization in job_batches options column
- Dedicated job class for post-batch processing

## Inputs
- Batch callback logic
- Primitive values needed by callback

## Workflow
1. Replace inline callback logic with dedicated job dispatch
2. Capture only primitive values in `use ()`: `use ($orderId, $userId)`
3. Never capture `$this` or framework objects in `use()` clause
4. For critical deploys: drain in-flight batches before deploying
5. Monitor `failed_jobs` for `BatchCallbackJob` entries after deploys
6. Test callback serialization in CI with both old and new code

## Validation Checklist
- [ ] Callbacks are thin — only dispatch a dedicated job class
- [ ] No `$this` or framework objects in `use()` clause
- [ ] Only primitive values captured (strings, ints, arrays, DTOs)
- [ ] Post-deploy monitoring for BatchCallbackJob failures
- [ ] Callback serialization tested in CI
- [ ] In-flight batches drained before critical deploys

## Common Failures
- Capturing `$request` or `$this` in callback — serialization failure after deploy
- Renaming job classes referenced in callbacks — dispatching non-existent class
- Inline logic in `then()` / `catch()` — deserialization failure after deploy

## Decision Points
- Critical post-processing: thin callback dispatching a job
- Trivial (logging, cache flag): inline is acceptable
- Frequent deploys: always use thin callbacks

## Related Rules
- Rule 1: thin-callbacks-dispatch-jobs
- Rule 2: no-complex-captures-in-callbacks
- Rule 3: drain-batches-before-critical-deploys
- Rule 4: monitor-callback-failures-post-deploy
- Rule 5: test-callback-serialization-in-ci

## Related Skills
- Use Batch Callbacks for Post-Batch Processing
- Orchestrate Parallel Job Execution with Bus::batch

## Success Criteria
Callbacks survive deploys without deserialization failure, post-batch processing continues to work after code changes, and monitoring catches any callback failures immediately.

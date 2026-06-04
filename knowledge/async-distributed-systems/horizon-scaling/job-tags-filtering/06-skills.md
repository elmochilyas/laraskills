# Skill: Tag Jobs for Horizon Dashboard Filtering

## Purpose
Override the `tags()` method on job classes to return entity identifiers for filtering and correlation in the Horizon dashboard.

## When To Use
Entity-based correlation — tag jobs with entity ID (order:42, user:17); workflow tracking — tag with batch/pipeline identifiers; operational monitoring during incident response.

## When NOT To Use
PII or sensitive data in tags (visible to all dashboard users); high-cardinality unique values creating millions of Redis keys; very long tags (>100 chars); tags that should affect job routing (tags are metadata only).

## Prerequisites
- Job class with `SerializesModels` (for automatic model tags)
- Access to job constructor properties

## Inputs
- Entity identifiers to use as tags
- Naming convention (`{entity}:{id}` format)

## Workflow
1. Override `tags()` on the job class
2. Always call `parent::tags()` to preserve automatic model tags
3. Use short consistent convention: `'order:'.$this->order->id`
4. Never include PII (emails, names, phone numbers)
5. Use grouping tags for high cardinality (e.g., `region:eu` instead of per-order)
6. Monitor Redis memory from tag growth
7. Keep tag generation fast — called at dispatch time in the web request

## Validation Checklist
- [ ] `parent::tags()` called in override
- [ ] Tags follow `{entity}:{id}` convention
- [ ] No PII in tags
- [ ] Tags short (< 100 chars)
- [ ] High-cardinality tags use grouping strategy
- [ ] Redis memory monitored for tag growth
- [ ] Tag generation is fast (dispatch-time)

## Common Failures
- PII in tags — PII exposed in Horizon dashboard
- High-cardinality tags — millions of Redis keys, memory pressure
- Overriding without `parent::tags()` — lose automatic model tags
- Assuming tags affect execution — tags are metadata only

## Decision Points
- Entity correlation: `order:42`, `user:17`
- Grouping: `region:eu`, `date:2024-01-15`
- Workflow tracking: `workflow:abc-123`, `batch:xyz`

## Related Rules
- Rule 1: keep-tags-concise-consistent
- Rule 2: call-parent-tags-in-override
- Rule 3: never-put-pii-in-tags
- Rule 4: monitor-tag-cardinality-redis

## Related Skills
- Silence Jobs with ShouldBeSilenced
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time
- Configure Custom Pulse Recorders for Queue Depth

## Success Criteria
Tags are concise, follow consistent conventions, preserve automatic model tags via parent call, contain no PII, and use grouping strategies for high cardinality.

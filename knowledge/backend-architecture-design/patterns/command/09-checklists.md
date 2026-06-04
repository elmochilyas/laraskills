# Command pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** Command
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand queues and job serialization
- [ ] Know the Laravel Bus facade and command dispatch
- [ ] Familiar with CQRS command bus concepts

## Implementation Checklist
- [ ] Command encapsulates a request as an object (not logic in constructor)
- [ ] Command contains only data required for execution
- [ ] Handler separated from command (handler receives command and executes)
- [ ] Commands are serializable (no closures, resources, or non-serializable props)
- [ ] `ShouldQueue` consistently applied (not mixed sync/async per command type)
- [ ] Command validation before dispatch

## Verification Checklist
- [ ] Command doesn't perform logic in constructor (constructor only sets data)
- [ ] Command payload size is reasonable (not excessively large)
- [ ] Command serialization/deserialization works correctly
- [ ] Handler correctly resolves from container
- [ ] `ShouldQueue` implementation is consistent
- [ ] Non-serializable properties not present in commands

## Security Checklist
- [ ] Input validation before command dispatch
- [ ] Authorization checked before command execution
- [ ] Commands don't contain sensitive data in queue payload
- [ ] Encrypted job properties for sensitive command data

## Performance Checklist
- [ ] Command serialization: JSON encode for most queue drivers
- [ ] Large commands increase serialization cost
- [ ] Handler resolution via container adds ~0.1-1ms
- [ ] Individual command dispatch overhead multiplies for batch commands

## Production Readiness Checklist
- [ ] Command DTO size optimized for queue performance
- [ ] Commands have unit tests
- [ ] Command handlers covered by feature tests
- [ ] Command versioning considered for long-running queues

## Common Mistakes to Avoid
- [ ] Command containing too much data (large queue payloads, serialization issues)
- [ ] Command performing logic in constructor (constructor accessed during serialization)
- [ ] Not implementing `ShouldQueue` consistently (some commands sync, some async)
- [ ] Commands depending on container-resolved services (not available after deserialization)
- [ ] Commands with non-serializable properties (job fails at dispatch)

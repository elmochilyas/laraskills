# ECC Anti-Patterns — Request Duration Lifecycle Handlers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | Request Duration Lifecycle Handlers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single Global Threshold
2. Handler That Triggers Another Monitored Request
3. Logging Full Request Objects
4. Throwing Exceptions in Handlers
5. Disabling Handlers Instead of Tuning Thresholds

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — handlers monitor execution time, not query performance
- Premature Caching — N/A

---

## Anti-Pattern 1: Single Global Threshold

### Category
Observability

### Description
Using only one threshold (e.g., 1000ms) for all monitoring — no differentiation between warnings and critical alerts.

### Why It Happens
Developers register one handler and consider monitoring complete.

### Warning Signs
- Only one `whenRequestLifecycleIsLongerThan()` registration
- No severity differentiation in handler logic
- Same handler action for 500ms and 5000ms requests

### Why It Is Harmful
A single threshold provides no granularity. You cannot distinguish between minor slowdowns (500ms) and critical failures (5000ms). The single handler logs both identically, requiring manual filtering to identify severity.

### Preferred Alternative
Use multiple thresholds for severity tiers: 500ms → warning log, 2000ms → alert, 5000ms → page.

### Detection Checklist
- [ ] Single handler threshold
- [ ] No severity differentiation
- [ ] Same action for all slow requests

### Related Rules
Request Duration Handlers (05-rules.md): N/A

### Related Skills
Request Duration Handlers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Handler That Triggers Another Monitored Request

### Category
Reliability

### Description
A handler performs an HTTP call or queue dispatch that triggers another slow request — creating infinite recursion.

### Preferred Alternative
Use async logging, local logging, or queue with duplicate detection.

### Detection Checklist
- [ ] Handler makes HTTP calls
- [ ] Handler dispatches queue jobs
- [ ] Risk of infinite handler execution

### Related Rules
Request Duration Handlers (05-rules.md): N/A

### Related Skills
Request Duration Handlers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Logging Full Request Objects

### Category
Security

### Description
Dumping entire `$request` and `$response` objects to logs — exposing passwords, tokens, PII.

### Preferred Alternative
Log only sanitized metadata (URL, duration, status code, route name).

### Detection Checklist
- [ ] Full request/response objects in handler logs
- [ ] Sensitive data in monitoring output

### Related Rules
Request Duration Handlers (05-rules.md): N/A

### Related Skills
Request Duration Handlers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Throwing Exceptions in Handlers

### Category
Reliability

### Description
Not wrapping handler logic in try-catch — uncaught exceptions crash the terminate phase.

### Preferred Alternative
Always wrap handler logic in try-catch.

### Detection Checklist
- [ ] Exceptions in handlers not caught
- [ ] Terminate phase crashes

### Related Rules
Request Duration Handlers (05-rules.md): N/A

### Related Skills
Request Duration Handlers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Disabling Handlers Instead of Tuning Thresholds

### Category
Observability

### Description
Removing or commenting out handlers because they produce too much noise.

### Preferred Alternative
Tune thresholds higher or add filtering logic.

### Detection Checklist
- [ ] Handlers commented out
- [ ] High-noise handlers removed
- [ ] Thresholds not tuned

### Related Rules
Request Duration Handlers (05-rules.md): N/A

### Related Skills
Request Duration Handlers (06-skills.md): N/A

### Related Decision Trees
N/A

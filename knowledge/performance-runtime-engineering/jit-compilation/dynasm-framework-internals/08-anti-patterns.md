# Anti-Patterns: Standardized Knowledge: DynASM Framework Internals

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Standardized Knowledge: DynASM Framework Internals |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Treating JIT as a Black Box | Operations | Medium |
| 2 | Ignoring JIT Compilation Failures | Operations | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Treating JIT as a Black Box

### Category
Operations

### Description
Using JIT without understanding DynASM code generation making diagnosis impossible.

### Why It Happens
JIT internals considered too complex. Accept works without knowing how.

### Warning Signs
JIT bugs with no debugging approach. Performance blamed on JIT magic.

### Why Harmful
Without DynASM understanding regressions are undiagnosable.

### Consequences
Inability to debug JIT. Missed optimization opportunities.

### Alternative
Learn DynASM basics. Collect JIT debugging data.

### Refactoring Strategy
1. Study PHP JIT internals. 2. Configure debug logging. 3. Collect assembly dumps.

### Detection Checklist
- [ ] JIT internals understood
- [ ] Debug data collected as needed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: DynASM Framework Internals
- 05-rules.md: Learn JIT internals before debugging
- 05-rules.md: Collect debugging data systematically
- 06-skills.md: Debug PHP JIT Compilation with DynASM
- 07-decision-trees.md: JIT Debugging Approach

---

## Anti-Pattern 2: Ignoring JIT Compilation Failures

### Category
Operations

### Description
Not monitoring actual JIT status assuming JIT is active when it fell back.

### Why It Happens
JIT enabled in php.ini = it works. No monitoring of actual status.

### Warning Signs
Performance does not match expectations. 0 compiled functions.

### Why Harmful
JIT silently falls back to interpreter. Assumed active but not running.

### Consequences
Optimization for JIT wasted. Performance lower than expected.

### Alternative
Monitor opcache_get_status() JIT metrics. Alert on 0 compiled functions.

### Refactoring Strategy
1. Endpoint for JIT status. 2. Monitor compiled_funcs. 3. Alert on zero.

### Detection Checklist
- [ ] JIT status monitored
- [ ] compiled_funcs tracked
- [ ] Alert on fallback

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: DynASM Framework Internals
- 05-rules.md: Monitor actual JIT status
- 05-rules.md: Alert on compilation failures
- 06-skills.md: Verify JIT Active Compilation Status
- 07-decision-trees.md: JIT Monitoring Decision

---

# Anti-Patterns: Standardized Knowledge: FFI Optimization Through JIT

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Standardized Knowledge: FFI Optimization Through JIT |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using FFI for Simple Operations Better Done in PHP | Design | High |
| 2 | FFI Without JIT - Missing Full Benefit | Configuration | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Using FFI for Simple Operations Better Done in PHP

### Category
Design

### Description
Calling C libraries for trivial operations PHP handles efficiently.

### Why It Happens
C is always faster assumption. FFI overhead not measured.

### Warning Signs
FFI for trivial operations (strlen, simple math). No benchmark vs PHP native.

### Why Harmful
FFI has fixed overhead per call. For trivial ops overhead exceeds C runtime.

### Consequences
FFI slower than native PHP. Added complexity without benefit.

### Alternative
Benchmark before using FFI. Use only for operations with significant speedup.

### Refactoring Strategy
1. Benchmark PHP vs FFI. 2. If PHP competitive remove FFI. 3. Batch FFI calls.

### Detection Checklist
- [ ] FFI vs PHP benchmarked
- [ ] Decision documented
- [ ] Overhead measured

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FFI Optimization Through JIT
- 05-rules.md: Benchmark FFI before using
- 05-rules.md: Use only for significant speedup
- 06-skills.md: Evaluate FFI vs PHP-Native Performance
- 07-decision-trees.md: FFI Usage Decision

---

## Anti-Pattern 2: FFI Without JIT - Missing Full Benefit

### Category
Configuration

### Description
Using PHP FFI without JIT enabled paying full call overhead.

### Why It Happens
FFI works without JIT. Assumption FFI alone is enough.

### Warning Signs
FFI performance below expectations. JIT not enabled.

### Why Harmful
JIT optimizes FFI call sites by reducing marshaling and enabling inlining.

### Consequences
2-5x slower FFI calls without JIT.

### Alternative
Enable JIT when using FFI for performance-critical ops.

### Refactoring Strategy
1. Enable JIT. 2. Benchmark with/without JIT. 3. Verify active.

### Detection Checklist
- [ ] JIT enabled for FFI
- [ ] Benchmarked with/without
- [ ] JIT active verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FFI Optimization Through JIT
- 05-rules.md: Enable JIT when using FFI for performance
- 05-rules.md: Benchmark FFI with and without JIT
- 06-skills.md: Optimize FFI Calls with JIT
- 07-decision-trees.md: FFI and JIT Configuration

---

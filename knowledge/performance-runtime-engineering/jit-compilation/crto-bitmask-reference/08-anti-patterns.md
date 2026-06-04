# Anti-Patterns: Standardized Knowledge: CRTO Bitmask Reference

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Standardized Knowledge: CRTO Bitmask Reference |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Treating CRTO Bitmask as Magic Numbers | Documentation | Medium |
| 2 | Not Logging CRTO Value for Debugging | Operations | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Treating CRTO Bitmask as Magic Numbers

### Category
Documentation

### Description
Using JIT optimization level bitmasks without understanding what each bit controls.

### Why It Happens
CRTO docs are sparse. Developers copy values from blogs.

### Warning Signs
Optimization level set without understanding. Changed by trial and error.

### Why Harmful
Wrong CRTO disables useful optimizations or enables expensive ones for wrong workload.

### Consequences
Suboptimal JIT. Config not reproducible across environments.

### Alternative
Document CRTO bits. Adjust specific flags based on profile data.

### Refactoring Strategy
1. Study CRTO for your PHP version. 2. Log current value. 3. Adjust based on profile. 4. Verify.

### Detection Checklist
- [ ] CRTO bits documented
- [ ] Changes based on profile
- [ ] Benchmark verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: CRTO Bitmask Reference
- 05-rules.md: Document CRTO configuration
- 05-rules.md: Adjust based on profile data
- 06-skills.md: Interpret and Tune JIT CRTO Bitmask
- 07-decision-trees.md: JIT Optimization Configuration

---

## Anti-Pattern 2: Not Logging CRTO Value for Debugging

### Category
Operations

### Description
Not recording JIT optimization level in logs or documentation.

### Why It Happens
CRTO considered set and forget. Not part of config review.

### Warning Signs
Cannot confirm CRTO in production. Drift undetected between servers.

### Why Harmful
Without logging drift goes unnoticed. Performance comparison impossible.

### Consequences
Undetected drift. Inconsistent JIT performance across fleet.

### Alternative
Log opcache_get_status() jit opt_level at startup.

### Refactoring Strategy
1. Add CRTO logging to bootstrap. 2. Include in health check. 3. Monitor fleet-wide.

### Detection Checklist
- [ ] CRTO logged at startup
- [ ] In health check
- [ ] Fleet-wide monitoring

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: CRTO Bitmask Reference
- 05-rules.md: Log JIT CRTO at startup
- 05-rules.md: Monitor CRTO across fleet
- 06-skills.md: Monitor JIT CRTO Configuration
- 07-decision-trees.md: JIT Monitoring Strategy

---

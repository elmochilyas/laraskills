# Anti-Patterns â€” Controller Form Request Integration
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Form Request Integration |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Manual Validation Instead of Form Request | High | High | Controller validates inline instead of using Form Request |
| Missing Form Request Type Hint | High | Medium | Controller uses Request instead of typed Form Request |
| Controller Duplicates Form Request Logic | Medium | Medium | Controller adds validation after Form Request processed |
| Form Request Does Too Much | Medium | Medium | Form Request performs side effects |
| Inconsistent Form Request Usage | Medium | Medium | Some actions use Form Requests, others inline |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mixed Validation Strategies | Some endpoints use Form Requests, others validate() inline | Inconsistent behavior |
| Form Request Overuse | Form Request created for single-field validation | Unnecessary file proliferation |

## Anti-Pattern Details

### AP-CFI-01: Manual Validation Instead of Form Request
**Description**: Controller manually calls ->validate() instead of Form Request.
**Root Cause**: Quickest path without creating Form Request.
**Impact**: Validation scattered. Harder to test and reuse.
**Detection**: ->validate() calls in controllers.
**Solution**: Extract to Form Request classes and type-hint them.

### AP-CFI-02: Missing Form Request Type Hint
**Description**: Controller type-hints generic Request instead of specific Form Request.
**Root Cause**: Forgetting to update type hint.
**Impact**: Form Request validation and authorization not triggered.
**Detection**: Parameter is Request instead of specific class.
**Solution**: Type-hint the specific Form Request class.

### AP-CFI-03: Controller Duplicates Form Request Logic
**Description**: Controller adds validation after Form Request already processed.
**Root Cause**: Not trusting Form Request capabilities.
**Impact**: Validation split between layers.
**Detection**: Additional validate() calls after Form Request.
**Solution**: Put all validation in Form Request.

### AP-CFI-04: Form Request Does Too Much
**Description**: Form Request handles logging, dispatching jobs, modifying state.
**Root Cause**: Misunderstanding Form Request scope.
**Impact**: Side effects before validation completes.
**Detection**: Side effects (log, dispatch, DB writes) in Form Request.
**Solution**: Form Request handles validation only. Side effects belong in controller/action.

### AP-CFI-05: Inconsistent Form Request Usage
**Description**: Some endpoints use Form Requests, others validate inline.
**Root Cause**: No team convention.
**Impact**: Inconsistent validation behavior.
**Detection**: Mixed usage pattern.
**Solution**: Standardize: all API endpoints use Form Requests.

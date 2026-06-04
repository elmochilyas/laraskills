# Anti-Patterns â€” Thin Controller Enforcement
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Thin Controller Enforcement |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Automated Enforcement | High | Medium | No CI rules preventing fat controllers |
| Manual Code Review as Only Enforcement | Medium | High | Subjective review catches violations |
| Inconsistent Enforcement Across Team | Medium | Medium | Some reviewed, others not |
| No Defined Threshold for Thin | High | High | No concrete definition of thin (lines? methods?) |
| Enforcement Without Migration Support | Medium | Medium | Thin required but refactoring tools not provided |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Tooling for Metrics | No automated measurement | Can't objectively enforce |
| No Refactoring Documentation | Guidelines say thin but don't describe how | Can't achieve standard |

## Anti-Pattern Details

### AP-TCE-01: No Automated Enforcement
**Description**: No CI checks for controller size limits.
**Root Cause**: Relying on good intentions and review.
**Impact**: Controllers gradually grow fat.
**Detection**: No CI checks for controller metrics.
**Solution**: Add PHPStan/PHPCS rules for controller size.

### AP-TCE-02: Manual Code Review as Only Enforcement
**Description**: Only code review prevents fat controllers.
**Root Cause**: No tooling.
**Impact**: Inconsistent, subjective enforcement.
**Detection**: No objective metric collection.
**Solution**: Combine automated metrics with review.

### AP-TCE-03: Inconsistent Enforcement
**Description**: Some team members enforce rules, others don't.
**Root Cause**: Rules not codified.
**Impact**: Inconsistent quality.
**Detection**: Some controllers accepted with 500+ lines.
**Solution**: Document and automate limits.

### AP-TCE-04: No Defined Threshold
**Description**: No numerical definition of thin.
**Root Cause**: Abstract principle without metrics.
**Impact**: No objective standard.
**Detection**: No documented size limits.
**Solution**: Define concrete limits (max 200 lines, 4 deps).

### AP-TCE-05: Enforcement Without Migration Support
**Description**: Thin for new code but no migration help for existing.
**Root Cause**: Focus on new development.
**Impact**: Two standards: thin vs fat.
**Detection**: Legacy fat controllers never refactored.
**Solution**: Provide patterns, allocate time, document steps.

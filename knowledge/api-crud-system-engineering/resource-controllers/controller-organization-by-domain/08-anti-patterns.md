# Anti-Patterns â€” Controller Organization By Domain
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Organization By Domain |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Flat Controller Structure | Medium | High | All controllers in one directory without subdirectories |
| Mixed Domain and Generic Controllers | Medium | Medium | Domain-specific and utility controllers mixed |
| Cross-Domain Controller Responsibilities | High | Medium | Controller handles operations across multiple domains |
| No Namespace Convention | Medium | Medium | Namespaces don't match directory structure |
| Overly Granular Separation | Low | Medium | Too many subdirectories for trivial domains |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Domain Organization Convention | No standard for organizing by domain | Inconsistent structure |
| Domain Boundaries Not Reflected | Structure doesn't match domain boundaries | Architecture-to-code mapping unclear |

## Anti-Pattern Details

### AP-COBD-01: Flat Controller Structure
**Description**: All controllers in app/Http/Controllers without subdirectories.
**Root Cause**: Default structure never reorganized.
**Impact**: Dozens of files in one directory. Hard to navigate.
**Detection**: 20+ files in controllers directory.
**Solution**: Organize by domain subdirectories.

### AP-COBD-02: Mixed Domain and Generic Controllers
**Description**: Domain-specific and utility controllers mixed in same directory.
**Root Cause**: No classification system.
**Impact**: Hard to distinguish domain from cross-cutting controllers.
**Detection**: Billing, auth, admin controllers all in root.
**Solution**: Subdirectories for domains.

### AP-COBD-03: Cross-Domain Controller Responsibilities
**Description**: Controller spans multiple bounded contexts.
**Root Cause**: Feature needs data from multiple domains.
**Impact**: Tight coupling between domains.
**Detection**: Controller injects services from 3+ domains.
**Solution**: Split into domain-specific controllers.

### AP-COBD-04: No Namespace Convention
**Description**: Namespaces don't match directory structure.
**Root Cause**: Manual namespace errors or refactoring without updates.
**Impact**: Autoloading issues.
**Detection**: Namespace != directory path.
**Solution**: Ensure namespaces match directories.

### AP-COBD-05: Overly Granular Separation
**Description**: Too many subdirectories for trivial domains.
**Root Cause**: Over-engineering.
**Impact**: Complex navigation.
**Detection**: Single controller per subdirectory.
**Solution**: Flatten until justified.

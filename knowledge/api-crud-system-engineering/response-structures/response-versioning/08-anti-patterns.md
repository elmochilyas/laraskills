# Anti-Patterns â€” Response Versioning
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Response Versioning |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Response Versioning Strategy | High | High | No mechanism to version response structures |
| Breaking Changes Without New Version | High | High | Response fields changed, added, or removed without version bump |
| Multiple Response Versions in Single Code Path | Medium | Medium | Same code handles multiple response versions with conditionals |
| Inconsistent Version Application | Medium | Medium | Some endpoints versioned, others not â€” no consistent policy |
| Old Version Never Deprecated | Medium | High | Old response versions maintained indefinitely without deprecation plan |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Versioning Policy | No documented API versioning policy | Inconsistent versioning, breaking changes without notice |
| Versionless Response Changes | Response format changes without version consideration | Breaks existing clients |

## Anti-Pattern Details

### AP-RV-01: No Response Versioning Strategy
**Description**: API doesn't have any mechanism for versioning response structures.
**Root Cause**: API versioning considered unnecessary or too complex.
**Impact**: Any response change can break existing clients.
**Detection**: Response format changes cause client outages.
**Solution**: Implement API versioning strategy (URL, header, or media type-based).

### AP-RV-02: Breaking Changes Without New Version
**Description**: Response fields renamed, removed, or structurally changed without version increment.
**Root Cause**: Developer doesn't recognize the change as breaking.
**Impact**: Existing clients break on deployment.
**Detection**: Field name changes, type changes, or structural changes to response.
**Solution**: Always version breaking response changes. Document what constitutes breaking.

### AP-RV-03: Multiple Response Versions in Single Code Path
**Description**: Same controller code handles multiple response versions with if/else or strategy pattern.
**Root Cause**: Avoiding code duplication by branching within methods.
**Impact**: Complex, hard-to-maintain code. Hard to remove old versions.
**Detection**: Controller methods contain version checks.
**Solution**: Separate versioned code paths into version-specific controllers or transformers.

### AP-RV-04: Old Version Never Deprecated
**Description**: Old response versions maintained indefinitely without deprecation timeline.
**Root Cause**: No deprecation policy. Fear of breaking clients.
**Impact**: Maintenance burden increases with each version. Codebase becomes cluttered.
**Detection**: Multiple version code paths with no deprecation schedule.
**Solution**: Define and communicate deprecation timeline. Use sunset headers.

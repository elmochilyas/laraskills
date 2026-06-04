# Anti-Patterns â€” Controller Organization By Version
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Organization By Version |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Version Clutter in Single Controller | High | Medium | Single controller handles multiple versions with conditionals |
| Duplicated Controllers Across Versions | High | High | Full controller copy-pasted per version |
| Missing Base Version Controller | Medium | Medium | No base class for shared logic |
| Inconsistent Version Directory Structure | Medium | Medium | Different naming conventions for version dirs |
| Versioned Mixed with Unversioned | Medium | Medium | Some controllers versioned, others not |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Version Organization Convention | No standard for organizing by version | High maintenance cost |
| No Version Migration Strategy | No guidance on code movement between versions | Divergent controllers |

## Anti-Pattern Details

### AP-COBV-01: Version Clutter in Single Controller
**Description**: One controller handles multiple versions with if/else.
**Root Cause**: Avoiding file duplication.
**Impact**: Complex controller with version branching.
**Detection**: Version checks in controller methods.
**Solution**: Separate versioned controllers with base class.

### AP-COBV-02: Duplicated Controllers Across Versions
**Description**: Entire controller duplicated per version.
**Root Cause**: Copy-paste without extracting shared logic.
**Impact**: Changes must be made in N copies.
**Detection**: 90%+ identical code across versions.
**Solution**: Extract shared logic to base class or traits.

### AP-COBV-03: Missing Base Version Controller
**Description**: No shared base class for versioned controllers.
**Root Cause**: Independent creation.
**Impact**: Foundation logic duplicated.
**Detection**: Same helpers in multiple version controllers.
**Solution**: Create base API controller.

### AP-COBV-04: Inconsistent Version Directory Structure
**Description**: Different naming: V1, v1, Version1, api/v1.
**Root Cause**: Different developers at different times.
**Impact**: Navigation harder.
**Detection**: Inconsistent casing/naming.
**Solution**: Standardize on V1, V2.

### AP-COBV-05: Versioned Mixed with Unversioned
**Description**: Some controllers versioned, others not.
**Root Cause**: Partial versioning implementation.
**Impact**: Unclear which endpoints are versioned.
**Detection**: Some groups have version prefixes.
**Solution**: All API controllers versioned.

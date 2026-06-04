# Anti-Patterns â€” Data Wrapping Configuration
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Data Wrapping Configuration |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Data Wrapping | High | High | Some endpoints wrap data in data key, others don't |
| Always Wrapping Single Resources | Medium | Medium | Single resources wrapped inconsistently vs collection responses |
| No Wrapping Strategy Documentation | Medium | Medium | No documented decision for when data is wrapped |
| Wrapping Without Standard Envelope | Medium | Medium | Different wrapping structures used (data vs results vs items) |
| Client-Conflicting Wrapping Changes | High | Low | Changing wrapping strategy in a minor API version |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Wrapping Convention | No standard for whether data is wrapped in an envelope | Inconsistent API design, client confusion |
| Mixing Bare and Wrapped Responses | Same API uses both styles for different endpoints | Clients must check each endpoint individually |

## Anti-Pattern Details

### AP-DWC-01: Inconsistent Data Wrapping
**Description**: Some endpoints return data wrapped in {data: [...]}, others return bare arrays or objects.
**Root Cause**: No consistent response format policy.
**Impact**: Client code must handle both formats.
**Detection**: API responses show varying wrapping patterns.
**Solution**: Standardize on one wrapping convention across all endpoints.

### AP-DWC-02: Always Wrapping Single Resources
**Description**: Single resource responses wrapped in data key while collections are also wrapped â€” inconsistent with REST conventions.
**Root Cause**: Applying collection wrapping to all responses uniformly.
**Impact**: Single resources have unnecessary nesting.
**Detection**: GET /users/1 returns {data: {id: 1, ...}}.
**Solution**: Don't wrap single resources in data key unless using JSON:API convention.

### AP-DWC-03: No Wrapping Strategy Documentation
**Description**: The decision of when and how to wrap data isn't documented.
**Root Cause**: Wrapping strategy chosen implicitly.
**Impact**: New developers don't know when to add wrapping.
**Detection**: No response format documentation exists.
**Solution**: Document the wrapping strategy and rationale.

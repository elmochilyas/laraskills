# Anti-Patterns â€” Sparse Fieldset Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Sparse Fieldset Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Sparse Fieldset Support | High | High | No ields parameter to let clients select needed fields |
| Inconsistent Field Parameter Name | Medium | Medium | Different endpoints use different parameter names for field selection |
| Field Selection Applied After Data Loading | High | Medium | Fields filtered after full data retrieval (no DB optimization) |
| No Validation of Requested Fields | Medium | Medium | Invalid field names silently ignored instead of returning errors |
| Sparse Fieldsets Without Documentation | Low | Medium | Fields parameter exists but not documented |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Sparse Fieldset Convention | No standard implementation of sparse fieldsets | Inconsistent behavior across endpoints |
| Over-fetching Without Field Selection | No mechanism for clients to reduce response size | Large payloads for clients needing few fields |

## Anti-Pattern Details

### AP-SFD-01: No Sparse Fieldset Support
**Description**: No mechanism for clients to request only specific fields in responses.
**Root Cause**: Server-centric design, not considering client bandwidth constraints.
**Impact**: All clients download all fields regardless of need.
**Detection**: No ields parameter in API documentation.
**Solution**: Implement sparse fieldset support with a ields parameter.

### AP-SFD-02: Inconsistent Field Parameter Name
**Description**: Different endpoints use different parameter names: ields, ields[], select, only.
**Root Cause**: No team-wide convention for sparse fieldset parameter naming.
**Impact**: Clients must use different parameter names per endpoint.
**Detection**: Parameter names vary across endpoints.
**Solution**: Standardize on one parameter name (e.g., ields).

### AP-SFD-03: Field Selection Applied After Data Loading
**Description**: All fields loaded from database, then filtered to requested subset after retrieval.
**Root Cause**: Field selection applied at the serialization layer instead of query layer.
**Impact**: No performance benefit from sparse fieldsets â€” database still loads all columns.
**Detection**: SELECT * query even when specific fields requested.
**Solution**: Apply field selection at the query builder level to limit loaded columns.

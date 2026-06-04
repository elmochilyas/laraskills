# Anti-Patterns â€” Conditional Field Inclusion
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Conditional Field Inclusion |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Always Returning All Fields | High | High | Response includes every model attribute regardless of client need |
| No Sparse Fieldset Support | High | Medium | No ields parameter to let clients select needed fields |
| Conditional Logic Scattered in Resources | Medium | Medium | Field conditions spread across resource classes without centralization |
| Missing Authorization on Conditional Fields | High | Low | Sensitive fields conditionally included based on non-authorization criteria |
| Overly Complex Conditional Logic | Medium | Medium | Field inclusion logic too complex to understand or maintain |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Field Selection Standard | No protocol for clients to request specific fields | Over-fetching, large payloads, slow responses |
| Inconsistent Field Visibility | Same field name has different visibility rules in different contexts | Client confusion about when fields appear |

## Anti-Pattern Details

### AP-CFI-01: Always Returning All Fields
**Description**: API responses include every model attribute, even those not needed by the client (e.g., timestamps, internal IDs).
**Root Cause**: Developer returns the model directly without selecting fields.
**Impact**: Larger payloads, slower responses, potential data leakage.
**Detection**: Response contains fields client doesn't use.
**Solution**: Use API Resources to explicitly define returned fields.

### AP-CFI-02: No Sparse Fieldset Support
**Description**: No mechanism for clients to request specific subsets of fields via ields parameter.
**Root Cause**: Server-centric view â€” server decides what clients need.
**Impact**: Clients must download all fields even when they need only 2-3.
**Detection**: No ields parameter documented in API.
**Solution**: Implement sparse fieldset support using a ields parameter.

### AP-CFI-03: Missing Authorization on Conditional Fields
**Description**: Fields conditionally included based on request context but not authorized (e.g., admin-only fields visible to regular users).
**Root Cause**: Field visibility checks don't include authorization.
**Impact**: Sensitive data leakage.
**Detection**: Conditional field logic lacks authorization checks.
**Solution**: Always authorize conditional field inclusion based on user permissions.

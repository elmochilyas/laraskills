# Anti-Patterns â€” Response Format Decision Framework
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Response Format Decision Framework |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Response Format Decision Process | High | High | Response format chosen arbitrarily per endpoint |
| Inconsistent Format Across Similar Endpoints | High | Medium | Similar endpoints return different response formats |
| No Format Documentation | Medium | Medium | Response format decision not documented for future reference |
| Format Chosen for Developer Convenience | Medium | Medium | Response format based on what's easiest to code, not what's best for clients |
| No Migration Path for Format Changes | High | Low | Breaking changes to response format without versioning or migration |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Response Format Standards | No documented standards for API response format | Inconsistent API, confused clients |
| Every Endpoint Self-Determines Format | No centralized response formatting | Duplicate formatting logic, inconsistency |

## Anti-Pattern Details

### AP-RFD-01: No Response Format Decision Process
**Description**: Each endpoint's response format is determined ad-hoc without a decision framework.
**Root Cause**: No team-wide API response design guidelines.
**Impact**: Inconsistent response structures across the API.
**Detection**: API audit shows no discernible pattern in response format decisions.
**Solution**: Define and document a response format decision framework for the team.

### AP-RFD-02: Inconsistent Format Across Similar Endpoints
**Description**: Two similar endpoints return different response structures for the same operation type.
**Root Cause**: Different developers made independent format decisions.
**Impact**: Clients can't rely on consistent patterns for similar operations.
**Detection**: Compare responses for similar endpoints â€” they differ.
**Solution**: Standardize response formats by operation type (list, detail, create, etc.).

### AP-RFD-03: No Format Documentation
**Description**: The rationale for response format decisions isn't documented.
**Root Cause**: Format decisions made implicitly without recording reasoning.
**Impact**: Future developers can't understand why a format was chosen.
**Detection**: No response format decision record exists.
**Solution**: Document format decisions in API design documents.

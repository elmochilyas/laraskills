# Anti-Patterns â€” JSON API Compound Documents
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | JSON API Compound Documents |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Over-fetching Included Resources | High | Medium | Including all possible related resources regardless of request |
| Under-including Required Resources | Medium | Medium | Not including resources that client needs for rendering |
| Missing Resource Linkage | High | Medium | Compound document lacks resource linkage between primary and included data |
| Circular Includes | Medium | Low | Included resources recursively include each other without limit |
| No Include Depth Limit | High | Low | Clients can request arbitrarily deep nesting of included resources |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Include Strategy Documentation | No documented guidelines for what can be included | Inconsistent include behavior, performance issues |
| Missing Include Authorization | Included resources not authorized per user permissions | Data leakage through includes |

## Anti-Pattern Details

### AP-JCD-01: Over-fetching Included Resources
**Description**: Compound documents include all possible relationships even when the client didn't request them.
**Root Cause**: Default eager loading of all relationships.
**Impact**: Large responses, slow queries, data waste.
**Detection**: Response includes relationships client never accesses.
**Solution**: Only include resources explicitly requested via include parameter.

### AP-JCD-02: Missing Resource Linkage
**Description**: Compound document includes related resources but doesn't link them to the primary data via identifiers.
**Root Cause**: Including related data without proper resource identifier linkage.
**Impact**: Clients can't connect included resources to primary resources.
**Detection**: Included data has no relationship identifiers in primary resources.
**Solution**: Always include resource identifier objects in relationship sections.

### AP-JCD-03: No Include Depth Limit
**Description**: Clients can request includes like ?include=author.posts.comments.user without depth restriction.
**Root Cause**: No validation on include depth.
**Impact**: Unbounded query complexity, huge responses.
**Detection**: Deeply nested includes produce slow queries.
**Solution**: Limit include depth to 2-3 levels. Validate include parameter.

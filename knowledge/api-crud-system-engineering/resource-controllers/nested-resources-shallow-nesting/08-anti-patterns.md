# Anti-Patterns â€” Nested Resources Shallow Nesting
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Nested Resources Shallow Nesting |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Deep Nesting (3+ Levels) | High | Medium | Routes nested 3+ levels deep |
| Over-Nesting When Not Needed | Medium | Medium | Nesting when child can be referenced directly |
| Inconsistent Nesting Depth | Medium | Medium | Different depths for different resources |
| Ignoring Shallow Nesting Convention | High | Medium | Not using Laravel's shallow() for nested routes |
| Nesting Without Authorization Context | Medium | Medium | Nesting assumed for auth but not enforced |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Nesting Convention | No guidelines for when to nest vs use shallow | Inconsistent URL design |
| Mixed Nesting and Top-Level | Same resource via nested and top-level routes | Confusion, security concerns |

## Anti-Pattern Details

### AP-NSN-01: Deep Nesting (3+ Levels)
**Description**: Routes nested 3+ levels deep.
**Root Cause**: Modeling URL after DB relationships.
**Impact**: Long URLs, complex controllers, performance issues.
**Detection**: 3+ nested resource levels.
**Solution**: Limit to 2 levels. Use shallow nesting.

### AP-NSN-02: Over-Nesting When Not Needed
**Description**: Nesting when child has unique ID without parent context.
**Root Cause**: Assuming nesting always required.
**Impact**: Unnecessarily long URLs.
**Detection**: Child with unique ID always under parent.
**Solution**: Top-level routes with unique references.

### AP-NSN-03: Inconsistent Nesting Depth
**Description**: Different nesting depths across resources.
**Root Cause**: No standard.
**Impact**: Unpredictable URL patterns.
**Detection**: Varying nesting depths.
**Solution**: Establish team convention (max 2 levels).

### AP-NSN-04: Ignoring Shallow Nesting Convention
**Description**: Not using shallow() for nested routes.
**Root Cause**: Not aware of Laravel's shallow().
**Impact**: Longer URLs than necessary.
**Detection**: Nested routes without shallow().
**Solution**: Use Route::shallow() for appropriate nested routes.

### AP-NSN-05: Nesting Without Authorization Context
**Description**: Nesting assumed to provide auth but not enforced.
**Root Cause**: Authorization not implemented at each level.
**Impact**: Unauthorized resource access.
**Detection**: Nested routes without authorization checks.
**Solution**: Verify parent-child relationship with authorization.

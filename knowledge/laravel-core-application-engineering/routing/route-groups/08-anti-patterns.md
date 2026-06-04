# Anti-Patterns â€” Route Groups
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Groups |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Overly Broad Middleware Groups | High | Medium | Middleware group applied to routes that don't need it |
| Inconsistent Group Nesting | Medium | Medium | Groups nested arbitrarily without consistent depth limit |
| Group Prefixes That Duplicate Controller Namespaces | Medium | Medium | Route groups prefix duplicates controller namespace |
| Empty or Near-Empty Groups | Low | Medium | Groups created for a single route, over-engineering grouping |
| Group Middleware Conflicts with Route Middleware | High | Medium | Same middleware applied at group and route level, running twice |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Group Organization Convention | No standard for how routes are grouped | Inconsistent grouping, hard to understand route architecture |
| Over-nesting Groups | Groups nested 3+ levels deep | Complex route resolution, hard to debug |

## Anti-Pattern Details

### AP-RG-01: Overly Broad Middleware Groups
**Description**: Middleware groups applied to more routes than necessary.
**Root Cause**: Creating broad groups for convenience without considering each route's needs.
**Impact**: Unnecessary middleware processing on routes that don't need it.
**Detection**: Middleware group applied to routes that should be exceptions.
**Solution**: Create granular middleware groups. Use per-route middleware for exceptions.

### AP-RG-02: Inconsistent Group Nesting
**Description**: Route groups nested to varying depths across the codebase.
**Root Cause**: Different developers use different nesting conventions.
**Impact**: Hard to understand route structure. Debugging is more complex.
**Detection**: Some groups nested 2 levels, others 4+ levels.
**Solution**: Limit nesting to 2-3 levels max. Document the convention.

### AP-RG-03: Group Prefixes That Duplicate Controller Namespaces
**Description**: Route group prefix matches controller namespace, creating redundancy.
**Root Cause**: Both group prefix and controller namespace include same path segment.
**Impact**: Routes longer than necessary.
**Detection**: Route prefix 'admin/users' and controller namespace 'Admin\UsersController'.
**Solution**: Remove duplication. Use one or the other â€” not both.

### AP-RG-04: Empty or Near-Empty Groups
**Description**: Route groups created for a single route.
**Root Cause**: Anticipating future routes that never materialize.
**Impact**: Unnecessary abstraction. More files to navigate.
**Detection**: Route group wrapping a single route definition.
**Solution**: Don't create groups until there are at least 2-3 routes sharing the group.

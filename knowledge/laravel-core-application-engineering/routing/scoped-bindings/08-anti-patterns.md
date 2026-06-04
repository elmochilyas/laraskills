# Anti-Patterns â€” Scoped Bindings
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Scoped Bindings |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Missing Scoped Binding for Nested Resources | High | Medium | Nested routes don't scope child to parent, allowing parent-child mismatch |
| Manual Scoping Instead of Scoped Bindings | Medium | Medium | Controllers manually verify parent-child relationship instead of using scoped binding |
| Over-Scoping (Unnecessarily Strict) | Medium | Medium | Scoped binding applied where child has unique ID and scoping is unnecessary |
| Scoped Binding Without Proper Route Structure | Medium | Medium | Scoped binding configured but route parameters don't support it |
| Missing 404 on Parent-Child Mismatch | High | Medium | Accessing child with wrong parent returns child instead of 404 |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Scoping | Some nested routes scoped, others not | Unpredictable behavior for nested resource access |
| No Scoping Policy | No documented policy for when scoped binding is required | Developers must decide per endpoint |

## Anti-Pattern Details

### AP-SB-01: Missing Scoped Binding for Nested Resources
**Description**: Nested routes like /users/{user}/posts/{post} don't scope post to user, allowing access to any user's post.
**Root Cause**: Developer registers nested routes without considering scoping.
**Impact**: Users can access other users' posts via nested routes.
**Detection**: Nested resource route without scoped binding â€” child not validated against parent.
**Solution**: Use scoped bindings with ->scoped() on nested resource routes.

### AP-SB-02: Manual Scoping Instead of Scoped Bindings
**Description**: Controllers manually check $post->user_id === ->id instead of using Laravel's scoped binding.
**Root Cause**: Developer not aware of Laravel's scoped binding feature.
**Impact**: Consistent manual checks needed across all controllers. Easy to miss one.
**Detection**: Controller methods contain manual parent-child relationship checks.
**Solution**: Configure scoped binding in route definitions. Remove manual checks.

### AP-SB-03: Over-Scoping (Unnecessarily Strict)
**Description**: Scoped binding used where child has a globally unique ID and parent context is irrelevant.
**Root Cause**: Applying scoped binding uniformly to all nested routes.
**Impact**: Unnecessary database queries to verify parent.
**Detection**: Child resource has unique ID but still requires parent for lookup.
**Solution**: Don't scope when child can be uniquely identified. Keep nesting for organizational purposes only.

### AP-SB-04: Missing 404 on Parent-Child Mismatch
**Description**: Accessing a child with a valid ID but wrong parent returns the child instead of 404.
**Root Cause**: Missing scoped binding means parent-child relationship not validated.
**Impact**: Users can access resources across parent boundaries.
**Detection**: /users/1/posts/5 returns post 5 even though it belongs to user 2.
**Solution**: Implement scoped binding. It automatically returns 404 on parent-child mismatch.

# Anti-Patterns â€” Singleton Routes
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Singleton Routes |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Using Resource Instead of Singleton for Singletons | Medium | Medium | Standard resource routes for resources that logically exist once per parent |
| Singleton Without Show Route Awareness | Medium | Medium | Developer creates singleton but doesn't expose the default show route |
| Nesting Under Singleton | Medium | Low | Routes nested under a singleton when they should be under the parent |
| Missing Authorization in Singleton Context | High | Medium | No authorization check scoped within the parent context |
| Inconsistent Singleton Implementation | Medium | Medium | Some singletons use ->singleton(), others use manual single-route approach |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Singleton Route Standard | No standard for implementing singleton resources | Inconsistent approaches across the codebase |
| Confusion Between Singleton and Resource | Developers unclear when to use which route type | Incorrect route registration for singleton resources |

## Anti-Pattern Details

### AP-SIR-01: Using Resource Instead of Singleton for Singletons
**Description**: Using Route::resource() for resources that logically have one instance per parent (profile, settings).
**Root Cause**: Developer unaware of Laravel's singleton route method.
**Impact**: Extra routes registered (index, create). Clients can POST to create another instance.
**Detection**: Profile/settings routes use resource() with unnecessary methods.
**Solution**: Use Route::singleton() for resources with one instance per parent.

### AP-SIR-02: Singleton Without Show Route Awareness
**Description**: Developer expects singleton to only have edit/update but forgets show is also auto-registered.
**Root Cause**: Not reading singleton route documentation.
**Impact**: Clients may not know about the show route for retrieving singleton data.
**Detection**: Singleton resource used without knowing show route exists.
**Solution**: Document singleton routes include show by default. Test generated route list.

### AP-SIR-03: Nesting Under Singleton
**Description**: Resources nested under a singleton route, creating confusing URLs.
**Root Cause**: Treating singleton as a regular resource for nesting.
**Impact**: Long confusing URLs like /user/profile/comments/1.
**Detection**: Route definitions show nesting under singleton resources.
**Solution**: Nest under the parent resource directly instead of the singleton.

### AP-SIR-04: Missing Authorization in Singleton Context
**Description**: Singleton resource operations not authorized within the parent context.
**Root Cause**: Authorization assumes singleton is user-specific without explicit checks.
**Impact**: Users could access or modify other users' singleton resources.
**Detection**: Singleton controller lacks authorization checks scoped to parent.
**Solution**: Always authorize singleton operations within the parent context.

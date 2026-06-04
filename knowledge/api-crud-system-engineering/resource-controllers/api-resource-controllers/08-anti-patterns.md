# Anti-Patterns â€” API Resource Controllers
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | API Resource Controllers |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Fat Controller | High | High | Controller contains business logic, exceeding appropriate code limits |
| Non-API Resource Controller | Medium | Medium | Using web-specific methods (create, edit) for API endpoints |
| Missing API Controller Convention | Medium | Medium | No standardized pattern for API controller structure |
| Controller Performs Authorization Inline | Medium | Medium | Authorization scattered inside methods instead of using Policies |
| No Resourceful Method Consistency | Medium | High | Methods don't follow RESTful naming conventions |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Controller Structure | Different API controllers organized differently | Each controller must be learned individually |
| Mixed Web and API Controllers | Same controller handles both web and API concerns | Security issues, response confusion |

## Anti-Pattern Details

### AP-ARC-01: Fat Controller
**Description**: Controller methods contain business logic, DB queries, and response formatting beyond their responsibility.
**Root Cause**: Shortest path â€” putting logic directly in controller.
**Impact**: Untestable logic, duplicated code, SRP violation.
**Detection**: Methods exceeding 20 lines, multiple dependencies, raw DB queries.
**Solution**: Delegate business logic to service/action classes.

### AP-ARC-02: Non-API Resource Controller
**Description**: Using web methods (create, edit) in API controllers.
**Root Cause**: Using --resource instead of --api flag.
**Impact**: Unnecessary methods exposed. Route confusion.
**Detection**: Controller has create() or edit() methods.
**Solution**: Use --api flag or apiResource() for API-only routes.

### AP-ARC-03: Missing API Controller Convention
**Description**: No standardized pattern for API controller structure.
**Root Cause**: No team-wide convention.
**Impact**: Inconsistent codebase, harder onboarding.
**Detection**: Multiple controller patterns in use.
**Solution**: Define and document standard API controller pattern.

### AP-ARC-04: Controller Performs Authorization Inline
**Description**: Authorization logic scattered inside controller methods.
**Root Cause**: Quick implementation without extracting authorization.
**Impact**: Duplicated logic, harder to audit permissions.
**Detection**: if (auth()->user()->can()) checks in methods.
**Solution**: Use Laravel Policies with ->authorize().

### AP-ARC-05: No Resourceful Method Consistency
**Description**: Methods don't follow RESTful conventions (index, store, show, update, destroy).
**Root Cause**: Custom method names not matching resourceful routing.
**Impact**: Manual route mapping needed.
**Detection**: Methods outside standard resourceful set.
**Solution**: Follow RESTful method naming. Use resource routes.

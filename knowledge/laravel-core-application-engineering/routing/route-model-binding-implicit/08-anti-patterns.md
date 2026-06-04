# Anti-Patterns â€” Route Model Binding Implicit
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Model Binding Implicit |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Not Using Implicit Binding | High | High | Controller methods manually query models instead of type-hinting |
| Type-Hint Name Doesn't Match Route Parameter | High | Medium | Variable name  but route parameter {post} â€” binding fails |
| Forgetting Soft Delete Handling | High | Medium | Implicit binding includes soft-deleted models when they should be excluded |
| Expecting Binding on Non-Injected Controllers | Medium | Medium | Non-controller classes (services, actions) type-hint models expecting automatic resolution |
| Implicit Binding Without Route Key Customization | Medium | Medium | Binding uses id when slug or UUID is the actual route key |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mixed Manual and Implicit Resolution | Some controllers type-hint, others manually resolve | Inconsistent pattern, confusion about when to use which |
| No Soft Delete Binding Policy | No consistent policy for how soft deletes are handled with binding | Some endpoints include trashed, others don't |

## Anti-Pattern Details

### AP-RMBI-01: Not Using Implicit Binding
**Description**: Controller methods contain Post::findOrFail() instead of type-hinting Post .
**Root Cause**: Developer not aware of implicit binding or prefers explicit style.
**Impact**: More boilerplate code. No automatic 404 on missing model.
**Detection**: Controller parameter is  instead of type-hinted model.
**Solution**: Type-hint the Eloquent model in controller method signature with matching variable name.

### AP-RMBI-02: Type-Hint Name Doesn't Match Route Parameter
**Description**: Variable name doesn't match the route parameter name â€” binding returns null.
**Root Cause**: Route parameter is {post} but controller variable is .
**Impact**: Implicit binding fails silently.  gets the route parameter string, not the model.
**Detection**: Controller shows $postId used with Post::findOrFail() instead of receiving resolved model.
**Solution**: Ensure variable name exactly matches the route parameter name.

### AP-RMBI-03: Forgetting Soft Delete Handling
**Description**: Implicit binding returns soft-deleted models when they should be excluded.
**Root Cause**: Default implicit binding doesn't exclude soft-deleted records.
**Impact**: Soft-deleted records accessible via routes, potentially exposing deleted data.
**Detection**: Soft-deleted models appear in show/update/delete endpoints.
**Solution**: Use ->withTrashed() explicitly or override esolveRouteBinding on the model to exclude trashed.

### AP-RMBI-04: Implicit Binding Without Route Key Customization
**Description**: Binding uses id column when the URL uses a different identifier (slug, uuid).
**Root Cause**: Default binding uses $model->getRouteKeyName() which returns id.
**Impact**: Binding looks up by id but URL contains slug â€” always fails.
**Detection**: Route parameter type-hint returns ModelNotFoundException because slug doesn't match id.
**Solution**: Override getRouteKeyName() on the model to return the actual route key column.

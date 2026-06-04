# Anti-Patterns â€” Route Model Binding Explicit
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Model Binding Explicit |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Manual Model Resolution Instead of Explicit Binding | High | High | Controllers manually query models when explicit binding is configured |
| Explicit Binding Without Type Consistency | Medium | Medium | Binding resolves different types based on route parameter name |
| Missing Explicit Binding for Non-Integer Keys | High | Medium | UUID or slug lookups not configured, forcing manual resolution in controllers |
| Overriding Explicit Binding with Route Parameters | Medium | Medium | Explicit binding configured but overridden by route parameter manipulation |
| Explicit Binding to Wrong Column | High | Medium | Binding uses non-unique column, returning wrong model on duplicates |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mixed Binding Strategies | Some bindings explicit, others manual â€” no consistent pattern | Inconsistent model resolution across controllers |
| No Binding Registration Centralization | Bindings scattered across service providers | Hard to audit and maintain bindings |

## Anti-Pattern Details

### AP-RMBE-01: Manual Model Resolution Instead of Explicit Binding
**Description**: Controller methods contain Model::findOrFail() when explicit route model binding is configured.
**Root Cause**: Developer not aware of or not using the configured binding.
**Impact**: Duplicated resolution logic. Binding benefit (automatic 404, IDE support) lost.
**Detection**: Controller has Model::findOrFail() for a model that has explicit binding.
**Solution**: Use type-hinted route parameters. Let explicit binding resolve the model.

### AP-RMBE-02: Missing Explicit Binding for Non-Integer Keys
**Description**: UUID or slug-based lookups not configured, requiring manual resolution in every controller.
**Root Cause**: Developer assumes binding only works with integer IDs.
**Impact**: Every controller duplicates the resolution logic (find by slug, find by UUID).
**Detection**: Multiple controllers have ->whereSlug()->firstOrFail().
**Solution**: Configure explicit binding in RouteServiceProvider for non-integer keys.

### AP-RMBE-03: Explicit Binding to Wrong Column
**Description**: Binding configured to resolve by a non-unique column, potentially returning the wrong model.
**Root Cause**: Binding configured using a column without a unique constraint.
**Impact**: When duplicates exist, binding returns the first match which may be incorrect.
**Detection**: Binding uses ->where('status', ) or non-unique column.
**Solution**: Always bind using columns with unique constraints (id, uuid, slug).

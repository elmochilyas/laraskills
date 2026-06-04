# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Policies (Model-Centric Authorization)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Policy vs Gate for Authorization | Choosing code-based authorization mechanism | architectural, maintainability |
| 2 | Policy Auto-Discovery vs Manual Registration | How policies are resolved for models | maintainability, architectural |
| 3 | Controller Authorization: authorizeResource vs Manual authorize() | How to apply policy checks in controllers | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## Policy vs Gate for Authorization

---

## Decision Context

Choosing between Policy classes (model-centric) and Gate closures (action-centric) for code-based authorization.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the authorization check specific to a single Eloquent model?
↓
YES → Policy (model-specific, standard CRUD methods, auto-discovered)
NO → Is the authorization check for a non-model action (e.g., "view dashboard", "export reports")?
    YES → Gate (action-level, no model dependency)
    NO → Gate (default for non-model authorization)

Does the authorization vary per resource instance (e.g., "can user update THIS post")?
↓
YES → Policy (receives model instance, checks ownership/attributes)
NO → Gate (receives no model, checks user attribute only)

Will there be multiple actions per model (CRUD)?
↓
YES → Policy (organized methods per action, authorizeResource support)
NO → Gate (simple single-action check)

---

## Rationale

Policies are the standard for model-centric authorization — they follow conventions (`viewAny`, `view`, `create`, `update`, `delete`), integrate with `authorizeResource()`, and are auto-discovered. Gates are for non-model actions (dashboard access, feature flags) where no model instance is involved. Both support `$user->can()` and `@can()` consistently.

---

## Recommended Default

**Default:** Policy for any authorization involving an Eloquent model; Gate for non-model actions (dashboards, feature flags, admin access)
**Reason:** Policies provide structured, model-specific authorization with auto-discovery. Gates are simpler for non-model checks. Both integrate with the same `can()` method.

---

## Risks Of Wrong Choice

- Gate for model authorization: no auto-discovery, no authorizeResource, less structured
- Policy for non-model actions: no model to bind, awkward method signatures (null model parameter)
- No authorization at all: any user can perform any action on any resource
- Both for same logic: duplication, confusion about which is authorizing

---

## Related Rules

- Create One Policy Per Model With Standard CRUD Methods (05-rules.md)
- Use authorizeResource() in Resource Controllers (05-rules.md)
- Return Boolean From Policy Methods, Do Not Throw Exceptions (05-rules.md)

---

## Related Skills

- Create Model Policies for Resource-Based Authorization (06-skills.md)
- Design Role-Based Access Control (06-skills.md)

---

## Policy Auto-Discovery vs Manual Registration

---

## Decision Context

Whether to rely on Laravel's policy auto-discovery (convention-based) or manually register policies in `AuthServiceProvider`.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the policy class name follow the convention (`Model` + `Policy` suffix in `app/Policies/`)?
↓
YES → Auto-discovery (no manual registration needed)
NO → Manual registration required in `AuthServiceProvider::$policies`

Is the policy for a model in a non-standard namespace (e.g., `App\Models\Admin\Role`)?
↓
YES → Auto-discovery may not find it — verify or register manually
NO → Standard naming should work

Is auto-discovery working correctly (test it)?
↓
YES → Rely on auto-discovery (less code, simpler)
NO → Register manually (explicit, always works)

Do you want explicit visibility into policy-model mapping?
↓
YES → Manual registration (visible in AuthServiceProvider)
NO → Auto-discovery (less boilerplate)

---

## Rationale

Laravel's policy auto-discovery scans `app/Policies/` and maps policies to models by convention (`PostPolicy` → `Post`). This works for standard naming conventions. Manual registration is explicit and works for non-standard names or when auto-discovery causes issues. Auto-discovery is cached in production — clear the cache when adding new policies.

---

## Recommended Default

**Default:** Auto-discovery for all policies following naming conventions; manual registration only for non-standard model names
**Reason:** Auto-discovery reduces boilerplate and is the standard Laravel approach. Manual registration is only needed when the policy class name doesn't follow conventions or when explicit registration is preferred for documentation.

---

## Risks Of Wrong Choice

- Auto-discovery with non-standard naming: policy not found, 403 errors on all actions
- Manual registration forgotten: policy not registered, same 403 errors
- Auto-discovery cache not cleared: new policies not recognized until cache cleared
- Both registered: double processing, auto-discovery takes precedence

---

## Related Rules

- Create One Policy Per Model With Standard CRUD Methods (05-rules.md)
- Return Boolean From Policy Methods, Do Not Throw Exceptions (05-rules.md)

---

## Related Skills

- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## Controller Authorization: authorizeResource vs Manual authorize()

---

## Decision Context

Whether to use `authorizeResource()` in resource controllers (automatic mapping) or call `$this->authorize()` manually in each controller method.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the controller a standard resource controller (index, show, create, store, edit, update, destroy)?
↓
YES → `authorizeResource()` (automatic mapping to policy methods)
NO → Manual `$this->authorize()` calls per action

Are all resource controller actions used (no skipped/renamed methods)?
↓
YES → `authorizeResource()` (complete coverage)
NO → Manual `$this->authorize()` (partial or non-standard actions)

Does the resource controller have non-standard actions (publish, archive, restore)?
↓
YES → `authorizeResource()` for standard actions + manual `$this->authorize()` for custom actions
NO → `authorizeResource()` covers all standard actions

Do you need different authorization for custom show/index views?
↓
YES → `authorizeResource()` for standard + override specific actions with manual checks
NO → `authorizeResource()` handles all cases

---

## Rationale

`authorizeResource()` automatically calls the correct policy method for each standard resource action: `index`→`viewAny`, `show`→`view`, `create/store`→`create`, `edit/update`→`update`, `destroy`→`delete`. This eliminates the risk of forgetting to authorize an action. Manual `authorize()` is needed for non-resource actions (publish, archive, custom methods).

---

## Recommended Default

**Default:** `authorizeResource()` in resource controller constructors; manual `$this->authorize()` for non-standard actions
**Reason:** `authorizeResource()` provides automatic, consistent authorization mapping for all standard CRUD actions. Manual calls handle custom actions that don't fit the resource pattern. This combination ensures comprehensive coverage.

---

## Risks Of Wrong Choice

- Manual authorize() everywhere: easy to miss an action, inconsistent protection
- authorizeResource() for non-standard controllers: wrong policy methods called
- Neither: no authorization on controller actions, open access
- authorizeResource() without __construct call: no authorization applied at all

---

## Related Rules

- Use authorizeResource() in Resource Controllers (05-rules.md)
- Return Boolean From Policy Methods, Do Not Throw Exceptions (05-rules.md)
- Create One Policy Per Model With Standard CRUD Methods (05-rules.md)

---

## Related Skills

- Create Model Policies for Resource-Based Authorization (06-skills.md)

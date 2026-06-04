# Decision Trees: Inertia + Laravel Integration

## Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** LivewireInertia
**Knowledge Unit:** InertiaLaravel
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Middleware share() vs Service Provider share() | Configuration | Design |
| 2 | Redirect to Named Route vs Redirect Back | Design | Implement |
| 3 | API Resource vs Manual Transformation | Design | Implement |
| 4 | Form Request vs Inline Validation | Architecture | Design |
| 5 | MD5 Hash vs Version String | Configuration | Implement |

---

## Decision 1: Middleware share() vs Service Provider share()

### Context
Where to define Inertia shared data.

### Decision Tree
Does the shared data depend on the current request (auth user, session)?
- **YES** → Middleware `share()` method (per-request execution)
- **NO** → Continue

Is the shared data static (app name, locale)?
- **YES** → Service provider (evaluated once)
- **NO** → Middleware (request-scoped)

Does the shared data need to access the authenticated user?
- **YES** → Middleware (runs after auth)
- **NO** → Either location works

### Recommended Default
Middleware `share()` for all shared data. It provides consistent request-scoped evaluation.

### Risks
- Service provider for request-scoped data: stale data, authentication context issues
- Middleware for static data: unnecessary per-request closure invocation

---

## Decision 2: Redirect to Named Route vs Redirect Back

### Context
How to redirect after state-changing operations.

### Decision Tree
Does the operation need to show a confirmation or updated list?
- **YES** → Redirect to named route (index, show, etc.)
- **NO** → Continue

Is the user filling a form that stays on the same page?
- **YES** → Redirect back may be appropriate
- **NO** → Redirect to named route

Does the page use modals or drawers for the form?
- **YES** → Redirect to named route (close modal, show updated page)
- **NO** → Continue

### Recommended Default
Redirect to named route. Only use redirect back for cancel actions.

### Risks
- Redirect back: full page reload, lost client state, broken SPA feel
- Redirect to route: may cause unwanted navigation if the form was inline

---

## Decision 3: API Resource vs Manual Transformation

### Context
How to transform Eloquent models before passing as Inertia props.

### Decision Tree
Does the model output need to be consistent with API responses?
- **YES** → API Resource (consistent with API)
- **NO** → Continue

Is the transformation simple (select a few fields)?
- **YES** → Manual `map()` or field selection
- **NO** → Continue

Does the transformation involve relationships or computed attributes?
- **YES** → API Resource (structured, testable)
- **NO** → Manual transformation

### Recommended Default
API Resource for any non-trivial transformation. Manual for simple field selection.

### Risks
- Manual for complex: duplicated transformation logic, untestable
- API Resource for simple: over-engineering for 3-field selection

---

## Decision 4: Form Request vs Inline Validation

### Context
Where to define validation rules.

### Decision Tree
Does the endpoint have 3+ validation rules?
- **YES** → Form Request
- **NO** → Continue

Does the endpoint have authorization requirements?
- **YES** → Form Request (authorize() method)
- **NO** → Continue

Will the validation rules be reused elsewhere?
- **YES** → Form Request
- **NO** → Inline validation may suffice

### Recommended Default
Form Request for any endpoint with 3+ rules or authorization needs.

### Risks
- Inline: cannot be tested independently, cannot be reused
- Form Request: additional file, but testable and maintainable

---

## Decision 5: MD5 Hash vs Version String

### Context
How to implement Inertia asset versioning.

### Decision Tree
Do you use a build tool that generates a manifest (Vite)?
- **YES** → `md5_file(public_path('build/manifest.json'))` or read hash from manifest
- **NO** → Continue

Do you have a deployment version env variable?
- **YES** → Return `config('app.version')` or env variable
- **NO** → Continue

Do you need cache-busting control per deployment?
- **YES** → Version string (increment manually or via CI)
- **NO** → MD5 hash (automatic, no manual management)

### Recommended Default
MD5 of manifest file for Vite builds. Version string for non-Vite builds.

### Risks
- MD5: file must exist, recalculated on every request (negligible cost)
- Version string: must be manually incremented or set in CI

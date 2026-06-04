# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Policy Auto-Discovery
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Auto-Discovery vs Manual Registration | Policy resolution mechanism | maintainability, architectural |
| 2 | Standard vs Custom Model Directory | Model namespace configuration | architectural |

---

# Architecture-Level Decision Trees

---

## Auto-Discovery vs Manual Registration

---

## Decision Context

Whether to rely on Laravel's policy auto-discovery (convention-based) or manually register policies in `AuthServiceProvider`.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the policy class follow the naming convention (`PostPolicy` for `Post` model)?
↓
YES → Is the policy in `app/Policies/` directory?
    YES → Auto-discovery (no manual registration needed)
    NO → Manual registration required (non-standard directory)
NO → Manual registration required (non-standard name)

Does the policy serve a single model?
↓
YES → Auto-discovery (one model per policy)
NO → Manual registration (policy handles multiple models)

Is the model in `app/Models/`?
↓
YES → Auto-discovery works (standard directory)
NO → Manual registration (model in custom namespace/directory)

---

## Rationale

Auto-discovery reduces boilerplate and follows Laravel conventions. It works when: model is in `app/Models/`, policy is in `app/Policies/`, and naming follows convention (`PostPolicy` → `Post`). Manual registration is explicit and necessary for non-standard configurations. Auto-discovery is cached — always clear the cache after adding policies.

---

## Recommended Default

**Default:** Auto-discovery for all policies following standard conventions; manual registration only for edge cases
**Reason:** Auto-discovery eliminates the `AuthServiceProvider::$policies` mapping, reducing maintenance. The convention is well-documented and supported by `php artisan make:policy PostPolicy --model=Post`.

---

## Risks Of Wrong Choice

- Manual registration for all: extra boilerplate, registration can be forgotten, no benefit over auto-discovery
- Auto-discovery with non-standard names: policy not found, 403 errors on all model actions
- Manual AND auto-discovery: policy registered twice (Laravel merges, no error, but confusing)
- Auto-discovery cache not cleared: new policies not found until cache refresh

---

## Related Rules

- Follow Naming Convention: ModelName + Policy Suffix (05-rules.md)
- Clear Cache After Adding New Policies (05-rules.md)
- Keep Models in app/Models/ for Auto-Discovery (05-rules.md)

---

## Related Skills

- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)

---

## Standard vs Custom Model Directory

---

## Decision Context

Whether to keep Eloquent models in the standard `app/Models/` directory or use a custom domain-driven directory structure.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the application using Domain-Driven Design with per-domain model directories?
↓
YES → Custom directories (e.g., `app/Domain/Blog/Models/Post.php`)
    → Requires manual policy registration
NO → Standard `app/Models/` directory (auto-discovery works)

Are models already in a non-standard directory?
↓
YES → Register policies manually for each model; OR move models to `app/Models/`
NO → Keep models in standard directory for auto-discovery benefit

Is the team size and project complexity justifying DDD structure?
↓
YES → Accept manual policy registration as cost of DDD
NO → Standard directory simplifies authorization setup

---

## Rationale

Models in `app/Models/` enable policy auto-discovery without configuration. Custom model directories (DDD, modular) break auto-discovery and require manual `AuthServiceProvider` registration. The choice depends on whether the project benefits enough from DDD structure to accept the extra authorization configuration.

---

## Recommended Default

**Default:** Standard `app/Models/` directory with auto-discovery; custom directories only when DDD structure is explicitly justified
**Reason:** Auto-discovery works out of the box with the standard directory. The convenience of zero-configuration policy mapping outweighs the benefits of custom directories unless the project has clear DDD requirements.

---

## Risks Of Wrong Choice

- Custom directory without manual registration: policies not found, authorization always fails
- Moving models from standard to custom: all policies break until manually registered
- Mixing standard and custom: some policies auto-discovered, others not — confusion
- DDD without policy adjustment plan: authorization gaps discovered late in development

---

## Related Rules

- Keep Models in app/Models/ for Auto-Discovery (05-rules.md)
- Register Manually Only When Convention Cannot Be Followed (05-rules.md)
- Clear Cache After Adding New Policies (05-rules.md)

---

## Related Skills

- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)

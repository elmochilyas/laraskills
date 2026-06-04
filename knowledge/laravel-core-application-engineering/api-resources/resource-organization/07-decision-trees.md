# Decision Trees — Resource Organization

---

## Decision: Flat Directory vs Domain-Namespaced Resources

---

## Decision Context

Should all resource classes go in `App\Http\Resources\` regardless of domain, or should they be organized per domain/feature within the Resources directory?

---

## Decision Criteria

* **Application size:** How many resource classes does the application have?
* **Domain boundaries:** Is the application organized by domain or by layer?
* **Discovery:** How do developers find resources for a given feature?
* **Cross-domain reuse:** Are resources frequently shared across domains?

---

## Decision Tree

Need to organize resource classes in the project?

↓

Does the application use domain/feature-based directory structure for other layers (controllers, models, etc.)?

YES → Does the application have > 10 resource classes?

    YES → Namespace resources by domain: `App\Http\Resources\{Domain}\` — mirrors the domain structure

    NO → Domain nesting may add unnecessary depth; flat is fine for < 10 classes

NO → Does the application have > 20 resource classes?

    YES → Group by category (e.g., `Api/V1/`, `Admin/`, `Web/`)

    NO → Flat directory is simplest — all resources in `App\Http\Resources\`

---

## Rationale

Domain-namespaced resources align with a domain-driven directory structure, making it clear which domain owns each resource. This prevents a flat directory from becoming unwieldy (30+ resource files) and keeps related resources discoverable next to each other. For small applications (< 10 resources) with a traditional MVC structure, flat is simpler and has no downsides.

---

## Recommended Default

**Default:** Start flat in `App\Http\Resources\` for small applications; migrate to domain-namespaced when crossing 15-20 resource classes
**Reason:** Flat is simplest early on; the migration to domain subdirectories is purely organizational and has no breaking changes

---

## Risks Of Wrong Choice

Domain namespacing in a 5-resource app adds unnecessary import path complexity without benefit. Flat layout with 40 resources becomes a scrolling mess where developers hunt for files. Halfway refactoring (some domain, some flat) is the worst — two conventions to remember.

---

## Related Rules

* Rule: Domain-Namespace Resources When Application Exceeds 20 Classes (resource-organization/05-rules.md)
* Rule: All Resources in App\Http\Resources, Never Elsewhere (resource-organization/05-rules.md)

---

## Related Skills

* Resource Organization (resource-organization/06-skills.md)
* Feature-Based Structure (feature-based-structure/06-skills.md)

---

---

## Decision: Resource Grouping — Per-Entity vs Per-Action-Entity

---

## Decision Context

Should resources be grouped by entity (`UserResource`, `UserCollection`) or by action-entity (`UserListResource`, `UserDetailResource`, `UserStoreResource`, `UserUpdateResource`)?

---

## Decision Criteria

* **Shape variation:** Do the list, detail, and form responses for an entity differ significantly?
* **Strict resource isolation:** Is there a policy to avoid conditional logic in resources?
* **API surface:** Is the API read-heavy or write-heavy (store/update)?
* **Contract stability:** Do different endpoints need to evolve their response shapes independently?

---

## Decision Tree

Need to decide resource granularity for an entity?

↓

Do the list and detail responses for this entity return different field sets?

YES → Use per-action-entity naming: `UserListResource`, `UserDetailResource`

NO → Is there a strict policy against conditional logic (`when()`) in resources?

    YES → Use per-action-entity naming — each endpoint gets its own resource with no conditionals

    NO → Can the single resource handle all endpoint responses with minimal conditionals?

        YES → Use per-entity naming with conditionals: `UserResource`

        NO → Use per-action-entity naming — separate resources for distinct shapes

---

## Rationale

Per-action-entity resources enforce strict contracts per endpoint — each response shape is explicit and independently testable. Per-entity resources with conditionals are lighter but couple endpoint response shapes together. A change to a conditional in a shared resource affects all endpoints, requiring careful testing. The trade-off is class count vs. endpoint coupling.

---

## Recommended Default

**Default:** Per-entity (`UserResource`) with `whenLoaded()` / `when()` for small differences; per-action-entity only when response shapes diverge significantly
**Reason:** Minimizes class count while keeping conditionals trivially simple; per-action-entity is an optimization for contract clarity, not a starting point

---

## Risks Of Wrong Choice

Per-action-entity for every entity creates 4x the resource classes (list, detail, store, update) even when they are identical. Per-entity with heavy conditionals becomes a god class with 10+ conditional branches — impossible to test combinatorially and fragile to change.

---

## Related Rules

* Rule: Use Per-Entity Resources as Default; Extract Per-Action When Needed (resource-organization/05-rules.md)
* Rule: Domain-Namespace Resources When Application Exceeds 20 Classes (resource-organization/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

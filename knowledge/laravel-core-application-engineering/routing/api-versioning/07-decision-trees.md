# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** API Versioning
**Generated:** 2026-06-03

---

# Decision Inventory

* URI Versioning vs Header Versioning vs Query Parameter Versioning
* Controller Inheritance vs Full Duplication Across Versions
* Maximum Active Versions Policy vs Unlimited Version Support
* When to Start Versioning vs When to Add It Later

---

# Architecture-Level Decision Trees

---

## Decision 1: URI Versioning vs Header Versioning vs Query Parameter Versioning

---

## Decision Context

Which versioning strategy to use for the API: URI prefix, Accept header, or query parameter.

---

## Decision Criteria

* Whether the API has external consumers
* Whether the API needs to be cacheable (HTTP caching, CDN)
* Whether the API needs to be easily testable and documented

---

## Decision Tree

Is the API consumed by external third parties?
↓
YES → URI versioning — external consumers need explicit, visible versioning in URLs
NO → Is the API consumed by first-party clients (mobile apps, SPAs)?
    ↓
    YES → URI versioning — client developers need visible version context; debugging is easier with explicit URLs
    NO → Is the API internal-only (same deployment, no external consumers)?
        ↓
        YES → No versioning needed — all consumers can be updated simultaneously
        NO → URI versioning — explicit versioning is the safest choice for any multi-consumer API
NO → Is HTTP caching or CDN caching required?
    ↓
    YES → URI versioning — cache keys are unique per version; header/query versioning pollutes cache
    NO → Is easy debugging and documentation a priority?
        ↓
        YES → URI versioning — URLs are self-documenting; docs are simpler with explicit version prefixes
        NO → URI versioning is still preferred — all other strategies have significant downsides

---

## Rationale

URI versioning (`/api/v1/users`) is explicit, cacheable, testable, and self-documenting. Header versioning (`Accept: application/vnd.app.v1+json`) is theoretically more RESTful but makes URLs indistinguishable across versions — debugging requires inspecting headers, and HTTP caches don't version by header by default. Query parameter versioning (`/api/users?version=1`) pollutes cache keys and allows ambiguous route matching.

---

## Recommended Default

**Default:** URI versioning (`/api/v1/`, `/api/v2/`) for ALL APIs with external or multi-consumer requirements.
**Reason:** Explicit, cacheable, testable, self-documenting. All alternatives have significant tradeoffs in caching, debugging, or routing.

---

## Risks Of Wrong Choice

* Header versioning: URLs look identical across versions; debugging requires header inspection; CDN caching ignores headers
* Query parameter versioning: Cache key pollution; ambiguous URL matching; SEO issues
* No versioning: Breaking changes break all consumers simultaneously; no migration path
* URI versioning with incompatible paths: `/api/v1/users` and `/api/v2/admin/users` — inconsistent prefix nesting

---

## Related Rules

* Enforce URI Versioning Over Header or Query Parameter Versioning
* Enforce Controller Inheritance for V2+ Over Code Duplication
* Enforce Maximum of 2 Active Major Versions at Any Time

---

## Related Skills

* Use URI Versioning with Route Group Prefixes
* Implement Controller Inheritance Across Versions

---

---

## Decision 2: Controller Inheritance vs Full Duplication Across Versions

---

## Decision Context

Whether V2+ controllers should extend V1 controllers or be completely independent.

---

## Decision Criteria

* Whether the new version changes only a subset of endpoints
* Whether the controller logic is mostly shared between versions
* Whether the team expects significant divergence between versions

---

## Decision Tree

Does the new version change only a subset of endpoints (most are identical to previous version)?
↓
YES → Controller inheritance — extend V1 controller; override only changed methods
NO → Does the new version change the majority of endpoints?
    ↓
    YES → Full duplication — inheritance creates complex method resolution; controllers diverge significantly anyway
    NO → Does the team expect significant future divergence?
        ↓
        YES → Full duplication — starting with duplication is cleaner than refactoring inheritance later
        NO → Controller inheritance — most logic is shared; inheritance minimizes duplication
NO → Are the method signatures the same across versions?
    ↓
    YES → Controller inheritance — compatible signatures make inheritance straightforward
    NO → Full duplication — incompatible signatures break inheritance; avoid fragile overrides

---

## Rationale

Controller inheritance reduces code duplication by allowing V2 to inherit V1's unchanged methods. Only modified endpoints need overrides. This is the primary advantage over full duplication — bug fixes to V1's shared methods automatically apply to V2. However, if the versions diverge significantly, the inheritance chain becomes complex and a full rewrite is cleaner.

---

## Recommended Default

**Default:** Controller inheritance for the first 1-2 version migrations. Full duplication when the version diff exceeds 50% of endpoints.
**Reason:** Inheritance minimizes code for partial changes. Full duplication is clearer when most endpoints change.

---

## Risks Of Wrong Choice

* Inheritance with significant divergence: Complex override chains; hard to trace which version uses which method
* Full duplication for minor changes: Bug fixes must be applied to N copies; inevitable divergence
* Inheritance with incompatible signatures: PHP strict type errors; `Declaration of V2::show() must be compatible with V1::show()`
* Full duplication with shared services: Services should be shared, not duplicated — extract common logic

---

## Related Rules

* Enforce URI Versioning Over Header or Query Parameter Versioning
* Enforce Controller Inheritance for V2+ Over Code Duplication
* Enforce Maximum of 2 Active Major Versions at Any Time

---

## Related Skills

* Use URI Versioning with Route Group Prefixes
* Implement Controller Inheritance Across Versions

---

---

## Decision 3: Maximum Active Versions Policy vs Unlimited Version Support

---

## Decision Context

How many API versions to maintain simultaneously before deprecating old versions.

---

## Decision Criteria

* Whether there are consumers that cannot upgrade quickly
* Whether the team has capacity to maintain multiple versions
* Whether the API has a deprecation and sunset policy

---

## Decision Tree

Are there consumers that cannot upgrade within a reasonable timeframe (years)?
↓
YES → Define a maximum supported versions policy (e.g., last 2 major versions)
    ↓
    YES → Does the team have dedicated API maintenance resources?
        ↓
        YES → Maximum 3 versions — more requires significant maintenance overhead
        NO → Maximum 2 versions — the default for most teams
    YES → Maxim 2 versions — balance between consumer support and maintenance burden
NO → Are consumers upgradeable within months?
    ↓
    YES → Maximum 3 versions — more flexibility for consumers with manageable overhead
    NO → Is the API still in active development with frequent breaking changes?
        ↓
        YES → Maximum 2 versions — frequent changes mean older versions diverge quickly; support is costly
        NO → Maximum 3 versions — stable API with infrequent changes
NO → Does a sunset policy exist and is it enforced?
    ↓
    YES → Follow the policy — e.g., support each version for 12 months after the next version is released
    NO → Create a sunset policy — without enforcement, version count grows indefinitely

---

## Rationale

Each supported version requires maintenance — bug fixes, security patches, and testing across all versions. Supporting unlimited versions creates exponential maintenance burden. A maximum versions policy forces consumers to upgrade and limits the testing matrix. Standard practice is to support the current and previous major version (N-1).

---

## Recommended Default

**Default:** Maximum 2 active major versions (current + previous). Enforce a 12-month sunset window.
**Reason:** N-1 is the industry standard. Two versions balance consumer migration time with team maintenance capacity.

---

## Risks Of Wrong Choice

* Unlimited versions: 5+ versions maintained; every change tested against all versions; maintenance dominates development time
* 1 version only: Consumers on old versions break immediately; no migration path
* No sunset enforcement: Old versions accumulate; consumers never upgrade; maintenance grows indefinitely
* Aggressive sunset: Consumers cannot migrate in time; forced upgrades cause production incidents

---

## Related Rules

* Enforce URI Versioning Over Header or Query Parameter Versioning
* Enforce Controller Inheritance for V2+ Over Code Duplication
* Enforce Maximum of 2 Active Major Versions at Any Time

---

## Related Skills

* Use URI Versioning with Route Group Prefixes
* Implement Controller Inheritance Across Versions

---

---

## Decision 4: When to Start Versioning vs When to Add It Later

---

## Decision Context

Whether to add API versioning from the first release or add it when the first breaking change is needed.

---

## Decision Criteria

* Whether the API is public or internal
* Whether breaking changes are anticipated
* Whether the API has external consumers

---

## Decision Tree

Is the API publicly accessible with external consumers?
↓
YES → START WITH VERSIONING — adding versioning later is a breaking change in itself
NO → Is the API consumed by first-party clients that can be updated?
    ↓
    YES → Is the API expected to have breaking changes within the next 6 months?
        ↓
        YES → Start with versioning — proactive versioning is easier than retrofitting
        NO → Can the API start without versioning and add it when needed?
            ↓
            YES → Start without versioning for internal/first-party APIs — but add v1 prefix before first public release
            NO → Start with versioning — if there's any doubt, version from the start
    NO → Is the API internal-only?
        ↓
        YES → No versioning needed — all consumers under the same deployment; coordinated updates
        NO → Start with versioning — any external or uncertain consumption benefits from proactive versioning

---

## Rationale

Adding versioning to an existing unversioned API is a breaking change — consumers must update their URLs to add `/v1/`. The migration requires either breaking all consumers at once or maintaining a complex redirect layer. Starting with `/api/v1/` from the first release avoids this migration entirely, even if only one version exists for years.

---

## Recommended Default

**Default:** Start with `/api/v1/` from the first stable release, even if there's no immediate need for versioning.
**Reason:** Adding versioning later is a breaking change. Starting with v1 is zero-cost and avoids future migration pain.

---

## Risks Of Wrong Choice

* No versioning from start: Adding `/v1/` later breaks all existing consumers — requires redirects, deprecation notices, and consumer coordination
* Proactive versioning with no breaking changes ever: Unnecessary prefix; minor aesthetic overhead
* Versioning during alpha/beta: Version changes with every pre-release — start versioning at first stable release
* Over-versioning: `/api/v1/users/v2/profile` — nested version prefixes are confusing; version at the top level only

---

## Related Rules

* Enforce URI Versioning Over Header or Query Parameter Versioning
* Enforce Controller Inheritance for V2+ Over Code Duplication
* Enforce Maximum of 2 Active Major Versions at Any Time

---

## Related Skills

* Use URI Versioning with Route Group Prefixes
* Implement Controller Inheritance Across Versions

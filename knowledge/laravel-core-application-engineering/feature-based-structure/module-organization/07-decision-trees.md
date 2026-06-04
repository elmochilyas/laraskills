# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Bounded Contexts
**Generated:** 2026-06-03

---

# Decision Inventory

* Standard Subdirectory List for Each Feature (What Goes In)
* Consistent Naming Convention for Feature Subdirectories
* Subdirectory Inclusion (Always Create All vs Create on Demand)

---

# Architecture-Level Decision Trees

---

## Decision 1: Standard Subdirectory List for Each Feature (What Goes In)

---

## Decision Context

Which subdirectories every feature should have — whether all features always include `Controllers/`, `Models/`, `Services/`, `Requests/`, `Providers/`, etc.

---

## Decision Criteria

* Whether all features need a given component type (do all features have controllers?)
* Whether the project has a defined standard set
* Whether the feature type varies significantly (console-only features need no Controllers/)
* Whether the team follows convention over configuration

---

## Decision Tree

Is the feature purely a backend/console feature with no HTTP endpoints?
↓
YES → Exclude `Controllers/`, `Requests/`, `Resources/`, `Middleware/` — not needed
NO → Does the feature have models?
    YES → Include `Models/` — feature-specific models live here
    NO → Exclude `Models/`
NO → Does the team follow "convention over configuration" (always include all)?
    YES → Include all standard directories regardless of current needs — consistency
    NO → Include only directories the feature actually needs — minimal structure

---

## Rationale

The standard feature directory structure should include subdirectories for all component types the feature might reasonably need. The exact set depends on the feature type (web feature vs console feature). "Always include all" is the simplest convention and ensures consistency — empty directories have negligible cost.

---

## Recommended Default

**Default:** Include all standard directories (`Controllers/`, `Models/`, `Requests/`, `Resources/`, `Services/`, `Actions/`, `DTOs/`, `Events/`, `Listeners/`, `Jobs/`, `Notifications/`, `Policies/`, `Rules/`, `Exceptions/`, `Providers/`) for all features. Console-only features can skip HTTP-related directories.
**Reason:** Consistency across features eliminates the "does this feature have X?" question. Empty directories cost nothing.

---

## Risks Of Wrong Choice

* Inconsistent directories: Some features have `Requests/`, others don't — developers don't know if it's missing or unused
* Minimal directories with growth: Feature grows, directories added piecemeal — inconsistent structure
* Console feature with `Controllers/`: Dead directory — always empty, confusing
* Missing `Exceptions/` directory: Feature exceptions end up in global `app/Exceptions/` — ownership unclear

---

## Related Rules

* Maintain Consistent Feature Directory Structure
* Start With Default Structure, Then Organize By Domain

---

## Related Skills

* Create A New Feature With Consistent Directory Structure

---

---

## Decision 2: Consistent Naming Convention for Feature Subdirectories

---

## Decision Context

What naming convention to use for feature subdirectories (PascalCase, camelCase, kebab-case) — and enforcing consistency across all features.

---

## Decision Criteria

* Whether the convention matches Laravel's own naming (PascalCase: `Controllers/`, `Models/`)
* Whether the convention is case-sensitive on the deployment OS (Linux is case-sensitive)
* Whether the team has existing conventions from other projects
* Whether CI enforces the convention

---

## Decision Tree

Does the convention match Laravel's built-in directory naming?
↓
YES → Use PascalCase — `Controllers/`, `Models/`, `Services/` — consistent with framework
NO → Is the convention case-sensitive on the deployment OS?
    YES → Use PascalCase — `controllers/` vs `Controllers/` causes autoloading failures on Linux
    NO → Does the team have a strong preference for another convention?
        YES → Use team preference — but ensure ALL features use EXACTLY the same convention
        NO → Use PascalCase — matches Laravel, avoids case-sensitivity issues

---

## Rationale

PascalCase matches Laravel's own convention (`Http/Controllers/`, `Http/Middleware/`, `Console/Commands/`). Linux file systems are case-sensitive — `Controllers/` and `controllers/` are different directories. Using PascalCase eliminates the most common autoloading failure on production deployments.

---

## Recommended Default

**Default:** PascalCase for all feature subdirectories — `Controllers/`, `Models/`, `Services/`, `Requests/`, `Providers/`. Enforce with CI.
**Reason:** Matches Laravel conventions, avoids Linux case-sensitivity issues, and is the most common convention in the Laravel ecosystem.

---

## Risks Of Wrong Choice

* Mixed case across features: Some `controllers/`, some `Controllers/` — autoloading fails on half the features
* camelCase/kebab-case: Doesn't match Laravel conventions — developers must remember feature-specific naming
* No CI enforcement: Feature added with wrong case — autoloading fails silently in production
* Case-insensitive dev environment: Works locally on Mac/Windows, fails on Linux production

---

## Related Rules

* Maintain Consistent Feature Directory Structure

---

## Related Skills

* Create A New Feature With Consistent Directory Structure

---

---

## Decision 3: Subdirectory Inclusion (Always Create All vs Create on Demand)

---

## Decision Context

Whether to create all standard subdirectories when scaffolding a new feature or create them only when the first file of that type is needed.

---

## Decision Criteria

* Team convention for feature scaffolding
* Whether the project has a scaffolding command or script
* Whether creating directories when needed causes inconsistencies (developers forget)
* Whether the team values speed of setup or structural completeness

---

## Decision Tree

Does the project have a scaffolding command that creates the standard structure?
↓
YES → Always create all standard directories — the command enforces consistency automatically
NO → Does the team consistently remember to create subdirectories when adding new file types?
    YES → Create on demand — lean approach, directories created when needed
    NO → Create all standard directories during manual scaffold — prevents forgetting
NO → Is the team speed-oriented (prototyping, rapid iteration)?
    YES → Create on demand — only directories needed right now, no empty dirs
    NO → Create all standard directories — consistency is more important than avoiding empty dirs

---

## Rationale

Creating all standard directories upfront ensures consistency — every feature has the same structure from day one. Empty directories have negligible cost. Creating on demand is leaner but risks inconsistency — Feature A gets an `Exceptions/` directory when needed, Feature B's exceptions end up in the global `Exceptions/` because the developer forgot to create the directory.

---

## Recommended Default

**Default:** Always scaffold all standard subdirectories when creating a new feature. Use a scaffolding command to automate this.
**Reason:** Empty directories cost nothing. Consistency across all features is worth the upfront creation. A scaffolding command eliminates the manual effort.

---

## Risks Of Wrong Choice

* Create on demand with no consistency: Feature A has `Exceptions/`, Feature B puts exceptions in global `app/Exceptions/`
* Create all but not used: "Why is there an empty `Jobs/` directory?" — minor confusion, easily ignored
* No scaffolding command: Manual directory creation is tedious — developer skips it, creates files at root
* Mixed approaches: Some features full structure, others minimal — no consistent expectation

---

## Related Rules

* Maintain Consistent Feature Directory Structure

---

## Related Skills

* Create A New Feature With Consistent Directory Structure

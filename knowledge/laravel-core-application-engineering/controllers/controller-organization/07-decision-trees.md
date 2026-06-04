# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Organization
**Generated:** 2026-06-03

---

# Decision Inventory

* Flat vs Subdirectory Organization
* Domain vs Feature vs API Version Organization Strategy
* Artisan Generation vs Manual File Creation

---

# Architecture-Level Decision Trees

---

## Decision 1: Flat vs Subdirectory Organization

---

## Decision Context

Whether to keep all controller files in the root `app/Http/Controllers/` directory or organize them into subdirectories.

---

## Decision Criteria

* Number of controller files
* Team size and ownership boundaries
* Whether navigation speed is affected

---

## Decision Tree

How many controller files exist in the application?
↓
< 20 controllers → Flat structure — simple, no navigation problems
20-30 controllers → Evaluate:
    Are the controllers grouped by natural domains (Sales, Billing, Auth)?
        YES → Subdirectory organization recommended before 20+ becomes unmanageable
        NO → Flat may still work but monitor as count grows
30+ controllers → Subdirectory organization REQUIRED
    Flat structure with 30+ files creates navigation and maintenance problems
NO → Does the team need clear domain ownership boundaries?
    YES → Subdirectory organization regardless of count
    NO → Flat structure is acceptable

---

## Rationale

Flat organization becomes unmanageable beyond 20-30 files. Domain grouping provides clear team ownership boundaries, reduces navigation time, and ensures that developers working on a domain only see relevant controller files.

---

## Recommended Default

**Default:** Flat for <20 controllers; domain subdirectories for 20+
**Reason:** Flat is simpler below threshold. Domain grouping is essential for navigation and team ownership at scale.

---

## Risks Of Wrong Choice

* Flat at 40+ controllers: Navigation nightmare, merge conflicts, unclear ownership
* Subdirectories at 10 controllers: Premature organization, empty directories
* Mixing strategies: Some controllers flat, some in subdirectories — ambiguous placement

---

## Related Rules

* Group by Domain for Applications with 20+ Controllers (05-rules.md)
* Choose One Organization Strategy and Apply Consistently (05-rules.md)

---

## Related Skills

* Skill: Organize Controllers into a Directory Structure

---

## Decision 2: Domain vs Feature vs API Version Organization Strategy

---

## Decision Context

Which organizational axis to use for controller subdirectories — business domain, feature area, or API version.

---

## Decision Criteria

* Application type (web app, API, monolith)
* Whether the application serves multiple API versions
* Whether domains map to team ownership

---

## Decision Tree

Does the application serve multiple API versions (V1, V2) with breaking changes?
↓
YES → API version strategy:
    `Controllers/Api/V1/`, `Controllers/Api/V2/`
    Web controllers stay in `Controllers/Web/` or domain subdirectories
NO → Does the application have clear business domains (Sales, Billing, Inventory)?
    YES → Domain strategy (recommended for most apps):
        `Controllers/Sales/`, `Controllers/Billing/`, `Controllers/Auth/`
    NO → Are features distinct areas (Auth, Dashboard, Search)?
        YES → Feature strategy:
            `Controllers/Auth/`, `Controllers/Dashboard/`, `Controllers/Reports/`
        NO → Flat structure or domain after identifying domains
NO → Is the application a single-domain microservice?
    YES → Flat structure sufficient
    NO → Domain strategy

---

## Rationale

Domain grouping maps to business ownership and is the most stable organizational axis — domains change less frequently than features or roles. API versioning adds an explicit axis for version-separated controllers.

---

## Recommended Default

**Default:** Domain strategy (Sales, Billing, Auth) for most applications; API version strategy for API-heavy apps
**Reason:** Domains are stable, map to team ownership, and scale to any number of controllers. API versioning is the standard for breaking API changes.

---

## Risks Of Wrong Choice

* Role-based organization (`Admin/`, `Customer/`): Couples code structure to authentication, duplicates controllers
* HTTP verb organization (`Get/`, `Post/`): Scatters related CRUD operations across directories
* Mixed strategies: Ambiguous placement for new controllers

---

## Related Rules

* Do Not Organize Controllers by User Role (05-rules.md)
* Use Api/V{version}/ Prefix for API Controllers (05-rules.md)

---

## Related Skills

* Skill: Organize Controllers into a Directory Structure

---

## Decision 3: Artisan Generation vs Manual File Creation

---

## Decision Context

Whether to create a new controller file using `php artisan make:controller` or manually create the file and namespace.

---

## Decision Criteria

* Whether the controller goes in a subdirectory
* Whether the developer is creating a resource, API, or invokable controller
* Whether PSR-4 autoloading must work correctly on first try

---

## Decision Tree

Is the controller going in a root directory (flat) or subdirectory?
↓
Flat (root Controllers/) → Either pattern works:
    Artisan: `php artisan make:controller UserController`
    Manual: Create file with `namespace App\Http\Controllers;`
Subdirectory → ALWAYS use Artisan:
    `php artisan make:controller Admin/UserController`
    Artisan creates the directory, file, and CORRECT namespace automatically
NO → Does the controller need specific stubs (resource, api, invokable)?
    YES → Artisan with flag: `--resource`, `--api`, `--invokable`
    NO → Artisan without flag (empty controller)
NO → Is this a rename/move of an existing controller?
    YES → IDE refactoring or manual rename — never generate a new file
    NO → Artisan

---

## Rationale

Artisan correctly generates the namespace and file location in one command. Manual creation risks namespace mismatch between the file path and the declared namespace, causing autoloading errors. This is especially critical for subdirectory controllers.

---

## Recommended Default

**Default:** Always use `php artisan make:controller` with subdirectory path and appropriate flag
**Reason:** Artisan guarantees correct namespace, file location, and method stubs. Manual creation introduces risk of PSR-4 autoloading errors.

---

## Risks Of Wrong Choice

* Manual subdirectory creation: Wrong namespace (`App\Http\Controllers` instead of `App\Http\Controllers\Admin`)
* Artisan for rename: Generates new file instead of moving existing one
* No flag for resource controller: Missing index/create/store/show/edit/update/destroy stubs

---

## Related Rules

* Use Artisan with Subdirectory Paths (05-rules.md)

---

## Related Skills

* Skill: Generate a Controller in a Subdirectory with Artisan

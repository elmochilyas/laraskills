# ECC Anti-Patterns — Spatie/laravel-data Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | Spatie/laravel-data Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Mega Data Object (20+ Properties, Single Responsibility Broken)
2. The Double Validation (Rules in Both FormRequest and Data Object)
3. The Pipeline Bypass (Using `Data::fromRaw()` or `new Data()`)
4. Data Object as ORM Entity (Persistence Logic in Data Objects)
5. Framework Lock-In (Package Dependency in Libraries)

---

## Repository-Wide Anti-Patterns

- Custom Pipes Inserted in Wrong Pipeline Order
- `Data::from()` Used With `$request->all()` Instead of FromRequest
- Ignoring the Pipeline's Authorization Step
- TypeScript Generation Not Configured in CI (PHP/TypeScript Drift)
- Data Objects in Wrong Namespace

---

## Anti-Pattern 1: The Mega Data Object

### Category
Maintainability | Design

### Description
A Data object with 20+ properties, complex validation rules, and multiple custom casters used across many endpoints — violating single responsibility.

### Why It Happens
The `Data` class is convenient. Developers keep adding properties for every use case, resulting in a single class that serves create, update, list, and detail operations.

### Warning Signs
- Single Data class has 20+ constructor parameters
- Validation rules array spans 50+ lines with conditional logic
- Custom casters accumulate in one file — 5+ `#[CastWith]` attributes
- The Data class is used in 10+ different endpoints with different field subsets

### Preferred Alternative
Split into focused per-operation Data objects (`CreateUserData`, `UpdateProfileData`, `UserListData`). Each has only the properties, rules, and casters for its specific operation.

### Related Rules
- Rule: Split Mega Data Objects by Operation

---

## Anti-Pattern 2: The Double Validation

### Category
Maintainability | Architecture

### Description
Defining the same validation rules in both the FormRequest and the Data object's `rules()` method.

### Why It Happens
Teams implement validation in FormRequests as a standard practice, then add the same rules to the Data object for "defense in depth" — not realizing the rules will diverge.

### Warning Signs
- Same rule (`'email' => ['required', 'email']`) appears in both `StoreUserRequest` and `UserData`
- Updating a rule requires two file changes, but only one gets updated
- CI tests pass but validation behavior differs between HTTP and CLI entry points
- Developers cannot confidently answer "where is email validated?"

### Preferred Alternative
Pick one validation layer per application. Use FormRequest for HTTP-specific validation (authorization, input format). Use Data object validation for domain-level rules. Do not duplicate.

### Related Rules
- Rule: Validate in One Layer Only (FormRequest or Data Object)

---

## Anti-Pattern 3: The Pipeline Bypass

### Category
Security | Reliability

### Description
Using `Data::fromRaw()` or `new Data(...)` directly to bypass the DataPipeline (authorization → validation → casting).

### Why It Happens
The pipeline adds a few milliseconds of overhead. Developers bypass it for "internal" construction where they "know" the data is valid.

### Warning Signs
- `Data::fromRaw()` or `new Data(...)` used outside test files
- Direct construction of a Data object that does not run through `fromRequest()` or `from()`
- No documentation for why the pipeline was bypassed
- Bug report of invalid data reaching the service layer via the bypass path

### Preferred Alternative
Always use `Data::from()` or `Data::fromRequest()` for production code paths. Audit all construction points. If the pipeline is too slow, optimize the pipeline — do not bypass it.

### Related Rules
- Rule: Never Use Data::fromRaw in Production Code

---

## Anti-Pattern 4: Data Object as ORM Entity

### Category
Architecture

### Description
Adding business logic, persistence (`save()`, `update()`), relationships, or Eloquent-style accessors to a spatie Data object.

### Why It Happens
Developers coming from Eloquent treat Data objects like models because they have similar property syntax. They add domain behavior to the Data object.

### Warning Signs
- Data object has methods like `save()`, `delete()`, or `notify()`
- Data object imports Eloquent or uses model-like patterns
- Data object has relationship methods or query scopes
- Business logic is scattered between Data objects and service classes

### Preferred Alternative
Keep Data objects pure — properties, rules, casters only. Business logic belongs in services/actions. Persistence belongs in repositories/Eloquent.

### Related Rules
- Rule: Keep Data Objects Free of Business Logic

---

## Anti-Pattern 5: Framework Lock-In

### Category
Maintainability | Architecture

### Description
Using spatie/laravel-data in a package or shared library, forcing consumers to install the package even if they don't use it.

### Why It Happens
Developers use the package everywhere because it is convenient, without considering that packages should minimize dependencies.

### Warning Signs
- A Composer package requires `spatie/laravel-data` in its `composer.json`
- Library code extends `Spatie\LaravelData\Data`
- Consumers who don't use Data objects still must install the package
- Documentation says "first install spatie/laravel-data" for a library

### Preferred Alternative
Use plain DTOs (readonly classes with factory methods) for packages and libraries. Reserve spatie/laravel-data for the application layer where the framework is already present.

### Related Rules
- Rule: Use Plain DTOs in Packages, Not Spatie Data Objects

## Enforce No Eloquent In Controllers
---
## Category
Architecture
---
## Rule
Always enforce a PHPStan custom rule that prohibits direct Eloquent static calls (Model::query(), Model::create(), Model::where(), etc.) in controllers; never allow direct Eloquent in controller methods.
---
## Reason
Direct Eloquent calls in controllers bypass the service/action layer, making business logic untestable without HTTP and preventing reuse across CLI/queue entry points.
---
## Bad Example
`php
public function index() { return PhotoResource::collection(Photo::where('status', 'published')->get()); }
`
---
## Good Example
`php
public function index() { return PhotoResource::collection(->listPhotos->execute(['status' => 'published'])); }
`
---
## Exceptions
Simple read-only endpoints in early prototypes may bypass this rule until the service layer is established.
---
## Consequences Of Violation
Business logic coupled to HTTP; untestable without full stack; cannot reuse from CLI/queue; architecture drift.

## Enforce Controller File Size With PHPStan
---
## Category
Maintainability
---
## Rule
Always configure a PHPStan custom rule (or CI script) that fails when any controller file exceeds 200 logical lines; never rely on manual review for size enforcement.
---
## Reason
Automated size enforcement is objective and consistent. Manual review under time pressure misses violations, allowing controllers to grow unchecked.
---
## Bad Example
`php
// No automated enforcement — controller grows to 400 lines over 6 months, caught in review only after damage is done
`
---
## Good Example
`php
// PHPStan custom rule: if file in app/Http/Controllers exceeds 200 logical lines, report error
// CI step: phpstan analyse --level max app/Http/Controllers
`
---
## Exceptions
Legitimate edge cases may use // @phpstan-ignore-next-line with documented rationale.
---
## Consequences Of Violation
Fat controllers accumulate over time; decomposition deferred indefinitely; code review becomes bottleneck.

## Enforce Form Request Type Hint On Store And Update
---
## Category
Architecture
---
## Rule
Always enforce a PHPStan custom rule that requires store and update methods in controllers to type-hint a class extending FormRequest; never allow plain Request in mutation methods.
---
## Reason
Plain Request without form request means validation is inline, untestable, and likely missing. Form requests enforce validation encapsulation and authorization checks.
---
## Bad Example
`php
public function store(Request ) {  = ->validate(['title' => 'required']); Photo::create(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) { Photo::create(->validated()); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inline validation in controllers; missing authorization checks; untestable validation rules; increased controller line count.

## Enforce Layer Direction With Deptrac
---
## Category
Architecture
---
## Rule
Always configure Deptrac to enforce layer direction: Controllers may depend on Services, Services may depend on Repositories, but Repositories must never depend on Controllers.
---
## Reason
Layer dependency rules prevent architectural erosion. Without enforcement, controllers gradually import from lower layers and lower layers accidentally couple to higher layers.
---
## Bad Example
`php
// Repository importing a controller class (should never happen)
class PhotoRepository { public function query() { return (new PhotoController())->index(); } }
`
---
## Good Example
`php
// Deptrac config
// layers:
//   - name: Controllers, collectors: [{type: directory, regex: app/Http/Controllers/.*}]
//   - name: Services, collectors: [{type: directory, regex: app/Services/.*}]
//   - name: Repositories, collectors: [{type: directory, regex: app/Repositories/.*}]
// ruleset:
//   Controllers: [Services, Repositories]
//   Services: [Repositories]
//   Repositories: ~
`
---
## Exceptions
Shared DTOs, value objects, and interfaces defined in a common directory may be imported across all layers.
---
## Consequences Of Violation
Circular dependencies; tight coupling; architecture erosion; domain extraction impossible.

## Start With Few Rules And Add Gradually
---
## Category
Maintainability
---
## Rule
Always start with 2-3 thin controller enforcement rules and add one per sprint; never deploy 15 rules on day one.
---
## Reason
Deploying too many rules causes team resistance, rule disabling, and workarounds. Gradual adoption builds buy-in and allows tuning based on real violations.
---
## Bad Example
`php
// Day one: 15 PHPStan rules, Deptrac, CI blocking — team revolts, rules disabled within a week
`
---
## Good Example
`php
// Sprint 1: no Eloquent in controllers (warning)
// Sprint 2: controller file size limit (warning → error)
// Sprint 3: form request type hint (error)
// Sprint 4: Deptrac layer enforcement (CI blocking)
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Team rejects enforcement; rules disabled or bypassed; no architectural improvement; enforcement infrastructure wasted.

## Provide Exemption Mechanism With Mandatory Reason
---
## Category
Maintainability
---
## Rule
Always provide a @phpstan-ignore-next-line exemption mechanism with mandatory documented reason for each enforcement rule; never enforce strict compliance without escape hatch.
---
## Reason
Strict enforcement without escape hatch leads to rule disabling or workarounds. Documented exemptions preserve auditability and prevent abuse.
---
## Bad Example
`php
// Rule has no exemption — developer must disable the entire rule to bypass one false positive
`
---
## Good Example
`php
// @phpstan-ignore-next-line — temporary: endpoint queries a single read-only view, no service layer needed yet
public function index() { return PhotoResource::collection(Photo::published()->get()); }
`
---
## Exceptions
Security-sensitive rules (e.g., 
o raw SQL in controllers) should never have exemptions.
---
## Consequences Of Violation
Developers disable rules entirely; false positives unaddressed; enforcement culture becomes adversarial rather than collaborative.

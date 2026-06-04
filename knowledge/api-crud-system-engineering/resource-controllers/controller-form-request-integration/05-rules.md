## Always Use Form Requests For Store And Update
---
## Category
Architecture
---
## Rule
Always type-hint a dedicated form request class on store and update method signatures; never use inline $request->validate() or plain Request for mutation actions.
---
## Reason
Form requests encapsulate validation rules and authorization checks in dedicated testable classes. Inline validation mixes concerns and cannot be reused.
---
## Bad Example
`php
public function store(Request ) {  = ->validate(['title' => 'required|max:255']); Photo::create(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) { Photo::create(->validated()); }
`
---
## Exceptions
Read-only actions (index, show) that accept no user input do not require form requests.
---
## Consequences Of Violation
Validation logic duplicated across controllers; untestable validation rules; increased controller line count; authorization checks buried in method bodies.

## Always Use ->validated() Never ->all()
---
## Category
Security
---
## Rule
Always call $request->validated() when a form request is type-hinted; never use $request->all() or $request->input().
---
## Reason
$request->validated() returns only data that passed validation. $request->all() bypasses validation entirely and passes unverified data including mass-assignment vulnerabilities.
---
## Bad Example
`php
public function store(StorePhotoRequest ) { Photo::create(->all()); }
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
Mass-assignment vulnerabilities; unvalidated data reaches the database; bypass of authorization checks in form request; security audit failure.

## Create Separate Store And Update Form Requests
---
## Category
Design
---
## Rule
Always create separate form request classes for store and update actions on the same resource; never use a single form request for both.
---
## Reason
Store and update typically have different rules — store requires all fields, update uses sometimes. A single class forces conditional rules that are harder to read and test.
---
## Bad Example
`php
class PhotoRequest extends FormRequest { public function rules(): array { return ->isMethod('POST') ? ['title' => 'required|max:255'] : ['title' => 'sometimes|max:255']; } }
`
---
## Good Example
`php
class StorePhotoRequest extends FormRequest { public function rules(): array { return ['title' => 'required|max:255']; } }
class UpdatePhotoRequest extends FormRequest { public function rules(): array { return ['title' => 'sometimes|max:255']; } }
`
---
## Exceptions
When store and update rules are truly identical and unlikely to diverge, a shared base request with prepareForValidation() hooks can be acceptable.
---
## Consequences Of Violation
Conditional rule logic that is hard to maintain; rule drift between store and update over time; testing complexity from method-dependent rules.

## Keep authorize() Simple In Form Requests
---
## Category
Architecture
---
## Rule
Always keep uthorize() in form requests as a simple gate check; never place business-logic-heavy authorization in form requests.
---
## Reason
Complex authorization belongs in dedicated policy classes. Duplicating policy logic in form requests splits authorization across layers and violates single responsibility.
---
## Bad Example
`php
class UpdatePhotoRequest extends FormRequest { public function authorize(): bool {  = Photo::find(->route('photo')); return  && ->user_id === ->user()->id && ->status !== 'archived' && ->user()->hasRole('editor'); } }
`
---
## Good Example
`php
class UpdatePhotoRequest extends FormRequest { public function authorize(): bool { return ->user()->can('update', ->route('photo')); } }
`
---
## Exceptions
No common exceptions. Always delegate complex authorization to policies.
---
## Consequences Of Violation
Authorization logic split between form requests and policies; duplicated logic; harder to audit; form request becomes harder to test.

## Test Form Request Rules Independently
---
## Category
Testing
---
## Rule
Always unit-test form request validation rules independently from controller HTTP tests; never rely solely on HTTP tests for rule coverage.
---
## Reason
Unit tests with $request->merge() are faster than HTTP tests and can exhaustively test each rule combination without the overhead of routing, middleware, and controller execution.
---
## Bad Example
`php
// Testing validation only through HTTP tests — slow and limited coverage
public function test_store_validates_title() { ->postJson('/api/photos', [])->assertJsonValidationErrors(['title']); }
`
---
## Good Example
`php
public function test_title_is_required() {  = new StorePhotoRequest(); ->merge([]);  = ->rules(); ->assertArrayHasKey('title', ); ->assertEquals(['required', 'string', 'max:255'], ['title']); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Slow test suite; incomplete rule coverage; edge cases in conditional rules missed; validation bugs reach production.

## Log Validation Failures For Audit
---
## Category
Security
---
## Rule
Always log validation failures in the ailedValidation() hook of form requests for audit trail purposes.
---
## Reason
Validation failures may indicate malicious input attempts, API abuse, or client bugs. Without logging, these patterns are invisible.
---
## Bad Example
`php
// No logging — validation failures are silent (the 422 response informs the client but not the server)
`
---
## Good Example
`php
protected function failedValidation(Validator ) { Log::warning('Validation failed', ['errors' => ->errors()->toArray(), 'ip' => ->ip(), 'path' => ->path()]); throw new ValidationException(); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Invisible API abuse patterns; inability to debug client validation issues; missing audit trail for security incidents.

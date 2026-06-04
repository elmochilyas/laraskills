# Phase 5: Rules — Form Request Organization

## Use Versioned Namespace For Form Requests
---
## Category
Code Organization
---
## Rule
Always place version-specific form requests in versioned namespaces (`App\Http\Requests\V1\`, `App\Http\Requests\V2\`) rather than a flat directory.
---
## Reason
A flat directory with suffix naming (`StorePostRequestV1`, `StorePostRequestV2`) does not scale past two versions and clutters autocomplete.
---
## Bad Example
```
App/Http/Requests/StoreUserRequestV1.php
App/Http/Requests/StoreUserRequestV2.php
```
---
## Good Example
```
App/Http/Requests/V1/StoreUserRequest.php
App/Http/Requests/V2/StoreUserRequest.php
```
---
## Exceptions
Single-version APIs that do not expect a second version within 12 months.
---
## Consequences Of Violation
File naming collisions; import confusion; inconsistent directory conventions.
---

## Override `rules()` By Extending Parent, Not Modifying In Place
---
## Category
Maintainability
---
## Rule
Always override `rules()` in the child version by calling `parent::rules()` then adding or removing keys — never copy and modify the entire array.
---
## Reason
Copying the parent's rules array means the child silently diverges when the parent adds a new rule — a maintenance trap.
---
## Bad Example
```php
class V2Request extends FormRequest {
    public function rules(): array { return ['title' => 'required|string', ...]; } // copied from V1
}
```
---
## Good Example
```php
class V2Request extends V1Request {
    public function rules(): array {
        $rules = parent::rules();
        $rules['category_id'] = 'required|exists:categories,id';
        return $rules;
    }
}
```
---
## Exceptions
When V2 intentionally removes many V1 rules — rewrite the array and add a note explaining why.
---
## Consequences Of Violation
V2 silently misses V1 security rule additions; behavioral drift between versions.
---

## Use `validated()` Instead Of `$request->all()`
---
## Category
Security
---
## Rule
Always use `$request->validated()` in controllers instead of `$request->all()` when handling versioned requests.
---
## Reason
`$request->all()` includes fields not present in the version's validation rules, allowing unexpected data injection.
---
## Bad Example
```php
public function store(V1\StorePostRequest $request) { Post::create($request->all()); }
```
---
## Good Example
```php
public function store(V1\StorePostRequest $request) { Post::create($request->validated()); }
```
---
## Exceptions
Endpoints where extra fields are explicitly passed through to external systems (webhooks).
---
## Consequences Of Violation
Mass assignment vulnerabilities; V2 fields injected into V1 endpoints.
---

## Test Each Version's Form Request Independently
---
## Category
Testing
---
## Rule
Always write independent test files for each version's form request — never rely solely on the parent version's tests.
---
## Reason
Parent rule changes silently affect child versions, and parent tests don't verify child-unique rules.
---
## Bad Example
```php
// Only V1 form request tests exist
```
---
## Good Example
```php
class V1StorePostRequestTest extends TestCase { /* V1 rules */ }
class V2StorePostRequestTest extends TestCase { /* V2 rules + inherited V1 rules */ }
```
---
## Exceptions
When the child version adds zero new rules and only removes existing ones (document with explicit note).
---
## Consequences Of Violation
Child version rule gaps undetected; security validation missing in production.
---

## Mark Deprecated Fields As `nullable|sometimes` In Newer Versions
---
## Category
Maintainability
---
## Rule
Always deprecate fields by marking them `nullable|sometimes` instead of removing the rule entirely when transitioning between versions.
---
## Reason
Removing a rule entirely means old clients sending that field will trigger a `422` — breaking them unnecessarily.
---
## Bad Example
```php
// V2: rule for 'status' removed — old V1 clients get 422
```
---
## Good Example
```php
// V2: status is now nullable/sometimes — V1 clients still work
'status' => 'nullable|sometimes|in:draft,published,archived'
```
---
## Exceptions
Fields with security implications (e.g., a role field that must always be explicitly sent).
---
## Consequences Of Violation
Unexpected 422 errors for clients still sending the field; emergency rollback.
---

## Never Remove `authorize()` Checks In Newer Versions
---
## Category
Security
---
## Rule
Never remove or weaken `authorize()` checks in a newer version's form request without explicit security architecture review.
---
## Reason
A version with weaker authorization than its predecessor is a regression vulnerability.
---
## Bad Example
```php
class V2StorePostRequest extends V1StorePostRequest {
    public function authorize(): bool { return true; } // removed V1 check
}
```
---
## Good Example
```php
class V2StorePostRequest extends V1StorePostRequest {
    public function authorize(): bool {
        return parent::authorize() && $this->user()?->hasRole('editor');
    }
}
```
---
## Exceptions
When the authorization model intentionally shifts from V1 to V2 and is documented in an ADR.
---
## Consequences Of Violation
Unauthorized access to V2 endpoints; security audit failure; OWASP API Top 10 violation.
---

## Use Traits For Reusable Rule Groups
---
## Category
Code Organization
---
## Rule
Always extract reusable validation rule groups (e.g., address validation, payment validation) into traits shared across version form requests.
---
## Reason
Duplicated rule arrays across versions create inconsistency when one version is updated but another is not.
---
## Bad Example
```php
class V1StorePostRequest { public function rules(): array { return ['address.street' => 'required', ...]; } }
class V2StorePostRequest { public function rules(): array { return ['address.street' => 'required', ...]; } } // duplicated
```
---
## Good Example
```php
trait ValidatesAddress { public function addressRules(): array { return ['address.street' => 'required']; } }
class V1StorePostRequest { use ValidatesAddress; }
class V2StorePostRequest { use ValidatesAddress; }
```
---
## Exceptions
When the validation rule is intentionally different between versions (document the divergence).
---
## Consequences Of Violation
Inconsistent validation across versions; security patches applied to only one version.
---

## Include Version Number In Error Responses
---
## Category
Maintainability
---
## Rule
Always include the API version number in validation error responses to help consumers identify which version's rules they are hitting.
---
## Reason
A consumer hitting a V2 endpoint with V1 rule assumptions sees errors without context for why their request failed.
---
## Bad Example
```json
{"message": "The category_id field is required."}
```
---
## Good Example
```json
{"message": "The category_id field is required.", "api_version": "v2"}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer confusion; support tickets asking "which version was this against?".

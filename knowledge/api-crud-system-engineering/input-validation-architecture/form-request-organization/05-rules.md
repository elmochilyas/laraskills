# Form Request Organization — Rules

## Organize by Resource, Then Action
---
## Category
Code Organization | Maintainability
---
## Rule
Place FormRequests in per-resource subdirectories with action-suffixed filenames: `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`.
---
## Reason
A flat directory with 50+ FormRequests is undiscoverable and causes naming collisions. Per-resource directories mirror the API surface, making file location predictable from the route URL.
---
## Bad Example
```
App\Http\Requests\Api\V1\
StorePostRequest.php
UpdatePostRequest.php    // 40+ files — no organization
```
---
## Good Example
```
App\Http\Requests\Api\V1\
  Posts\
    StorePostRequest.php
    UpdatePostRequest.php
  Comments\
    StoreCommentRequest.php
    UpdateCommentRequest.php
```
---
## Exceptions
Prototypes with 1-2 endpoints may use a flat directory, but migrate to per-resource structure before reaching 5 endpoints.
---
## Consequences Of Violation
Naming collisions between resources; developers cannot locate FormRequests by URL pattern; merge conflicts as multiple developers add files to the same directory.

---

## Use Action-Suffixed Naming
---
## Category
Code Organization | Framework Usage
---
## Rule
Name FormRequests with action suffix first: `StorePostRequest`, `UpdatePostRequest`, `IndexPostsRequest` — not `PostStoreRequest`.
---
## Reason
Action-first naming groups related files by prefix in alphabetically sorted directory listings, making it easy to scan available actions for a resource.
---
## Bad Example
```
Posts\
  PostStoreRequest.php     // Non-standard ordering
  PostUpdateRequest.php
```
---
## Good Example
```
Posts\
  StorePostRequest.php
  UpdatePostRequest.php
  IndexPostsRequest.php
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent naming across the codebase; difficulty locating the right file; CI rules cannot enforce naming conventions.

---

## Version the Namespace Always
---
## Category
Architecture | Scalability
---
## Rule
Always nest FormRequests under a version namespace (`Api\V1\`, `Api\V2\`) even when only one API version exists.
---
## Reason
Adding a version namespace later requires renaming all files and updating all `use` statements — a painful migration that can be avoided by starting with versioning from day one.
---
## Bad Example
```
App\Http\Requests\Api\
  Posts\StorePostRequest.php    // No version — must rename later
```
---
## Good Example
```
App\Http\Requests\Api\V1\
  Posts\StorePostRequest.php    // V2 can be added alongside
App\Http\Requests\Api\V2\
  Posts\StorePostRequest.php
```
---
## Exceptions
Internal applications with no versioning requirement and no planned API public release.
---
## Consequences Of Violation
Painful migration when versioning is needed; all FormRequest `use` statements must be updated; git history is lost from mass renames.

---

## Create a Base ApiRequest for Shared Behavior
---
## Category
Maintainability | Architecture
---
## Rule
Create an abstract `App\Http\Requests\Api\ApiRequest` base class that overrides `failedValidation()`, `failedAuthorization()`, and sets JSON headers — all API FormRequests extend this class.
---
## Reason
Without a base class, every FormRequest duplicates error formatting, authorization failure handling, and content-type negotiation — violating DRY and producing inconsistent responses.
---
## Bad Example
```php
// Duplicated in 30 FormRequests
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([...], 422));
}
```
---
## Good Example
```php
// In ApiRequest — once
abstract class ApiRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([...], 422));
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent error responses; duplicated boilerplate; some FormRequests forget the override and return redirect responses.

---

## Use Base{Resource}Request for Shared Store/Update Rules
---
## Category
Code Organization | Maintainability
---
## Rule
Create a `Base{Resource}Request` abstract class for shared rules between Store and Update when they overlap significantly; keep action-specific rules in concrete classes.
---
## Reason
Store and Update rules often share field constraints but differ on presence requirements. A base class captures common rules; each action class adds its presence rules without duplication.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ];
    }
}
class UpdatePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'], // Duplicated
            'body' => ['sometimes', 'string'],              // Duplicated
        ];
    }
}
```
---
## Good Example
```php
abstract class BasePostRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['string', 'max:255'],
            'body' => ['string'],
        ];
    }
}
class StorePostRequest extends BasePostRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'title' => ['required'], 'body' => ['required'],
        ]);
    }
}
```
---
## Exceptions
When Store and Update rules share no common constraints, independent FormRequests are simpler.
---
## Consequences Of Violation
Duplicated rule definitions; a field constraint change requires editing two files; risk of Store and Update rules diverging.

---

## Limit Inheritance to 2 Levels Max
---
## Category
Maintainability | Reliability
---
## Rule
Limit FormRequest inheritance chains to 2 levels: `ApiRequest` -> `Base{Resource}Request` -> `ConcreteActionRequest`. Never exceed this depth.
---
## Reason
Deep inheritance chains bury important methods (authorize, failedValidation) in parent classes far from the concrete request, making security logic hard to audit.
---
## Bad Example
```php
ApiRequest -> BasePostRequest -> DraftPostRequest -> StoreDraftPostRequest
// 4 levels — buried logic
```
---
## Good Example
```php
ApiRequest -> BasePostRequest -> StorePostRequest
// 2 levels — clear, auditable
```
---
## Exceptions
No common exceptions — prefer composition (traits) over deep inheritance for shared behavior beyond 2 levels.
---
## Consequences Of Violation
Security logic hidden in parent classes; debugging requires traversing 3+ files; overridden methods accidentally break parent behavior.

---

## Keep API Requests Separate from Web Requests
---
## Category
Code Organization | Security
---
## Rule
Place API FormRequests in a dedicated `App\Http\Requests\Api\` namespace — never mix them with web FormRequests that redirect on failure.
---
## Reason
API and web requests have fundamentally different error handling: APIs return JSON + 422, web requests redirect back with flash messages. Mixing them creates confusion and risks incorrect error handling.
---
## Bad Example
```
App\Http\Requests\
  StorePostRequest.php         // API? Web? Ambiguous.
```
---
## Good Example
```
App\Http\Requests\Api\V1\     // All API requests
  Posts\StorePostRequest.php
App\Http\Requests\Web\        // All web requests
  LoginRequest.php
```
---
## Exceptions
No common exceptions — always separate namespaces.
---
## Consequences Of Violation
FormRequest accidentally returns redirect response on API endpoint; inconsistent error handling; security regression when web error message leaks to API consumer.

# Anti-Patterns — Form Request Organization

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Form Request Organization |
| Difficulty | Intermediate |
| Category | Organization Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Flat Requests Directory With 100+ Files | High | Medium | File system: all FormRequests in a single directory |
| Actions as Directories | Medium | Low | File system: `Posts/Store/Request.php` instead of `Posts/StorePostRequest.php` |
| No Base Request Class | High | High | Code review: each FormRequest duplicates failedValidation() |
| Abstract Naming Without Base Prefix | Medium | Medium | Code review: `PostRequest` as abstract — mistaken for concrete |
| Mix of Web and API Requests in Same Directory | Medium | High | File system: web (redirect-based) and API (JSON) FormRequests mixed |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Single File Handling Store and Update via isMethod | One class for both actions | Fragile conditionals; harder to test |
| No Version Namespace | V1 and V2 request classes collide | Breaking changes affect old API versions |
| 3+ Level Deep Inheritance | Over-abstracted base request chain | Hard to debug; fragile base class problem |

---

## Anti-Pattern Details

### AP-FRO-01: Flat Requests Directory With 100+ Files

**Description**: All FormRequest classes are placed directly in `App\Http\Requests\` with no subdirectory organization. As the API grows to 50+ endpoints, the directory becomes a flat list of 100+ files. Finding the right FormRequest requires scrolling through an alphabetical listing of unrelated resources, and naming collisions force awkward prefixes like `AdminPostRequest` and `ApiPostRequest`.

**Root Cause**: No early organization strategy. The project starts with 2-3 requests in a flat directory and never restructures as it grows.

**Impact**:
- Hard to find the correct FormRequest for a given endpoint
- Naming collisions between resources: `PostRequest` vs `PagePostRequest`
- No filesystem-to-API-surface mapping
- New developers cannot navigate the request layer by knowing the API structure

**Detection**:
- File system: 30+ files in `App\Http\Requests\` without subdirectories
- Developer onboarding time: difficulty locating FormRequests for specific endpoints
- Naming conventions: prefixes or suffixes used solely to avoid collisions

**Solution**:
- Organize by resource subdirectory: `Posts/`, `Comments/`, `Auth/`
- Use action-suffixed names within each subdirectory
- Group by API version: `Api\V1\Posts\StorePostRequest`

**Example**:
```php
// BEFORE: Flat structure
App\Http\Requests\
├── StorePostRequest.php
├── UpdatePostRequest.php
├── StoreCommentRequest.php
├── UpdateCommentRequest.php
├── LoginRequest.php
├── RegisterRequest.php
// ... 50+ more files

// AFTER: Per-resource organization
App\Http\Requests\Api\V1\
├── Posts\
│   ├── StorePostRequest.php
│   └── UpdatePostRequest.php
├── Comments\
│   ├── StoreCommentRequest.php
│   └── UpdateCommentRequest.php
└── Auth\
    ├── LoginRequest.php
    └── RegisterRequest.php
```

---

### AP-FRO-02: Actions as Directories

**Description**: Each controller action gets its own subdirectory with a generic `Request.php` file: `Posts/Store/Request.php`, `Posts/Update/Request.php`. This creates three levels of nesting for a single endpoint and the generic filename `Request.php` makes IDE navigation difficult — opening `Request.php` requires knowing which subdirectory you're in.

**Root Cause**: Over-engineering. The developer applies a class-per-file rule and creates a directory per action to "keep things organized."

**Impact**:
- Three-level-deep directory structure (`V1/Posts/Store/Request.php`)
- Generic `Request.php` filename in every directory — no uniqueness
- IDE tab confusion: multiple `Request.php` tabs open simultaneously
- Excessive boilerplate for simple validation classes

**Detection**:
- File system: directories named after actions containing only `Request.php`
- Code review: `use App\Http\Requests\Api\V1\Posts\Store\Request` — long import paths
- IDE usage: developer frequently checking which `Request.php` is open

**Solution**:
- Use action-suffixed filenames: `StorePostRequest.php`, not `Store/Request.php`
- Keep one level of resource subdirectory, not action subdirectories
- Let the filename describe both the action and the resource

**Example**:
```php
// BEFORE: Action as directory
App\Http\Requests\Api\V1\Posts\
├── Store\
│   └── Request.php      // ❌ generic filename, deep nesting
└── Update\
    └── Request.php

// AFTER: Action-suffixed files
App\Http\Requests\Api\V1\Posts\
├── StorePostRequest.php  // ✅ descriptive filename
└── UpdatePostRequest.php
```

---

### AP-FRO-03: No Base Request Class

**Description**: Every FormRequest independently overrides `failedValidation()`, sets JSON headers, and configures error formatting. Code for the standardized error shape is duplicated across 20+ FormRequests. Changing the error format requires editing every FormRequest in the codebase.

**Root Cause**: No upfront base class design. Each developer creates FormRequests independently, copy-pasting the same boilerplate.

**Impact**:
- Massive duplication of error formatting code
- Changing the error shape requires touching every FormRequest
- New FormRequests may forget to override `failedValidation()`, getting the default Laravel shape
- Inconsistent error responses if some developers override differently

**Detection**:
- Code review: `failedValidation()` overridden identically in multiple FormRequests
- Code review: `response()->json()` error formatting in each FormRequest
- File system: no `App\Http\Requests\Api\ApiRequest.php` base class

**Solution**:
- Create a base `App\Http\Requests\Api\ApiRequest` class
- Override `failedValidation()` once in the base class
- Extend all FormRequests from the base class

**Example**:
```php
// BEFORE: Duplicated in every FormRequest
class StorePostRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Validation failed.', 'errors' => $validator->errors()],
        ], 422));
    }
}

class UpdatePostRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Validation failed.', 'errors' => $validator->errors()],
        ], 422));
    }
}

// AFTER: Single override in base class
abstract class ApiRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json(new ErrorEnvelope('VALIDATION_ERROR', 'Validation failed.', 422, ['fields' => $validator->errors()]), 422)
        );
    }
}

class StorePostRequest extends ApiRequest { /* no failedValidation override needed */ }
class UpdatePostRequest extends ApiRequest { /* no failedValidation override needed */ }
```

---

### AP-FRO-04: Abstract Naming Without Base Prefix

**Description**: A base or abstract FormRequest is named `PostRequest`, the same convention as concrete action-specific requests. Developers cannot tell from the filename whether `PostRequest` is an abstract base class or a concrete request for a specific action. This confusion leads to incorrect class extensions or accidental instantiation of abstract classes.

**Root Cause**: Naming collision. The developer names the shared request `PostRequest` because it "feels like the Post request," not realizing the naming conflict with action-specific requests.

**Impact**:
- Impossible to distinguish base (abstract) from concrete (action-specific) at a glance
- Developers may extend the wrong class — extending the abstract base instead of creating a new action request
- Abstract classes may be accidentally instantiated by the container
- IDE autocompletion lists both `PostRequest` and `StorePostRequest` — naming confusion

**Detection**:
- File system: `PostRequest.php` existing alongside `StorePostRequest.php`
- Code review: `PostRequest` has `abstract` keyword but no `Base` prefix
- Error logs: "Cannot instantiate abstract class PostRequest"

**Solution**:
- Prefix base request classes with `Base`: `BasePostRequest`
- Use descriptive naming: `Base` indicates the class is not for direct use
- Reserve un-prefixed names for concrete action-specific classes

**Example**:
```php
// BEFORE: Confusing naming
abstract class PostRequest extends ApiRequest // ❌ looks like a concrete request
{
    // shared rules
}

class StorePostRequest extends PostRequest { /* ... */ }

// AFTER: Base prefix
abstract class BasePostRequest extends ApiRequest // ✅ clearly a base class
{
    // shared rules
}

class StorePostRequest extends BasePostRequest { /* ... */ }
```

---

### AP-FRO-05: Mix of Web and API Requests in Same Directory

**Description**: Web-oriented FormRequests (that redirect back with `$errors`) and API-oriented FormRequests (that return JSON error envelopes) coexist in the same directory. Web requests handle validation failure by redirecting to the previous page; API requests throw JSON error responses. Mixing them leads to confusion, accidental web-style error handling in API contexts, and vice versa.

**Root Cause**: No separation of concerns at the directory level. The project started as a hybrid web/API app and never separated the two request types.

**Impact**:
- Accidental redirects from API endpoints expecting JSON
- JSON error responses in web forms (breaking the redirect-back-with-errors pattern)
- Cannot apply global API error formatting without affecting web requests
- Base class inheritance hierarchy becomes confused (web vs API)

**Detection**:
- File system: `App\Http\Requests\` contains both `StorePostRequest` (JSON, API) and `ContactFormRequest` (redirect, web)
- Code review: API FormRequests override `failedValidation()` but web-origin requests also get the override
- Bug reports: API clients receiving HTML redirect responses on validation failure

**Solution**:
- Separate web and API FormRequests into different namespaces and directories
- `App\Http\Requests\Api\` for API, `App\Http\Requests\Web\` for web
- Each namespace has its own base class with appropriate error handling
- Never mix the two in the same directory

**Example**:
```php
// BEFORE: Mixed directory
App\Http\Requests\
├── ApiRequest.php             // base for API
├── StorePostRequest.php       // API request — extends ApiRequest
├── ContactFormRequest.php     // Web request — extends FormRequest
// ❌ mixed, confusing, incompatible error handling

// AFTER: Separated by namespace
App\Http\Requests\Api\
├── ApiRequest.php             // base with JSON error handling
└── V1\Posts\
    └── StorePostRequest.php   // ✅ API request

App\Http\Requests\Web\
├── WebRequest.php             // base with redirect error handling
└── ContactFormRequest.php     // ✅ web request
```

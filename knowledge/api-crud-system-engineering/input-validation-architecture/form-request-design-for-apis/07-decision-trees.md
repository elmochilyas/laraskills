# Decision Trees: Form Request Design for APIs

## Tree 1: Form Request vs Inline Validation

```
Does this endpoint accept user input?
├── YES, with multiple fields and rules → FormRequest. Required for any non-trivial input.
├── YES, but only route model binding validation → No FormRequest needed. Route binding handles it.
├── YES, for a trivial endpoint with 1-2 rules → FormRequest still preferred. Consistency over brevity.
├── NO, read-only endpoint with no input → No FormRequest needed. Use controller directly.
└── NO HTTP context (CLI, job) → Manual validator. FormRequest is HTTP-bound.
```

## Tree 2: One vs Shared FormRequest Per Action

```
Do Store and Update share most validation rules?
├── YES, >80% overlap → Separate FormRequests with Base{Resource}Request for shared rules.
├── NO, Store and Update are significantly different → Independent FormRequests. No base class needed.
├── NO, they share structure but differ on presence → Base{Resource}Request + action classes override presence rules.
└── Endpoint is Index (read-only, query params) → Dedicated IndexRequest with query param validation.
```

## Tree 3: Authorization Strategy

```
Who can access this endpoint?
├── Authenticated users only → Check auth in authorize(): `return $this->user() !== null`.
├── Role-restricted (admin only) → Gate/Policy check: `$this->user()->can('create', Post::class)`.
├── Public endpoint (registration, login) → Return `true` but still define authorize() explicitly.
├── Owner-only (user can only modify own resources) → Compare user ID: `$this->user()->id === $this->route('post')->user_id`.
└── Complex authorization logic → Delegate to Policy class. authorize() calls Policy.
```

## Tree 4: Error Response Format

```
What API format does your API follow?
├── JSON:API → Override failedValidation() to return JSON:API error format with source pointers.
├── Custom envelope → Override failedValidation() with consistent custom error envelope.
├── Flat error array → Override failedValidation() to return array of { field, message } objects.
├── Bare errors (minimal) → Override failedValidation() to return simple error messages array.
└── Default Laravel web format → Must customize for API. Default is web-oriented with redirects.
```

## Tree 5: Stop on First Failure

```
Is this a write-heavy endpoint with expensive validation rules?
├── YES, creates external resources or checks fraud → Set $stopOnFirstFailure = true.
├── YES, validates unique across large tables → Set $stopOnFirstFailure = true.
├── NO, all rules are simple string/format checks → Keep default (false). Return all errors.
├── NO, client needs all errors at once (frontend form) → Keep default (false). Return all errors.
└── Mixed: some rules expensive, some cheap → Keep default. Use batch validation for expensive checks.
```

# Anti-Patterns — Manual Validator Creation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Manual Validator Creation |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Manual Validation Replacing FormRequest for HTTP | High | High | Code review: `Validator::make()` in HTTP controller |
| Validator::make With No Error Handling | Critical | Medium | Code review: `validated()` called without checking `passes()` first |
| Reusing Validator Instances | High | Low | Code review: same `$validator` used for multiple validations |
| Throwing ValidationException in Jobs | High | Medium | Code review: `ValidationException` uncaught in queued job |
| Same Validation in FormRequest and Service Layer | Medium | High | Code review: duplicate rules in FormRequest and manual validator |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Global Validator::extend in ServiceProvider | Rule registered globally with `Validator::extend()` | Rules apply to all validators; side effects |
| Not Logging Manual Validation Failures | Silent validation failures with no trace | Cannot debug failed validation in jobs or services |
| Missing Custom Messages in Manual Validation | Generic error format from manual validator | Inconsistent with FormRequest error responses |

---

## Anti-Pattern Details

### AP-MVC-01: Manual Validation Replacing FormRequest for HTTP

**Description**: An HTTP controller method uses `Validator::make()` directly instead of type-hinting a FormRequest. The developer calls `$request->validate(...)` or `Validator::make($request->all(), ...)` inline in the controller. This bypasses the FormRequest layer entirely — no `authorize()`, no `prepareForValidation()`, no centralized error formatting, and no reusable validation contract.

**Root Cause**: Convenience. Inline validation is less code than creating a FormRequest file.

**Impact**:
- No `authorize()` check — authorization must be added separately or silently missing
- No `prepareForValidation()` hook — input preparation mixed with controller logic
- Error formatting is ad-hoc — inconsistent with the API's error envelope
- Validation rules cannot be tested independently from the controller
- No reusable contract: other actions or jobs can't use the same rules

**Detection**:
- Code review: `$request->validate([...])` or `Validator::make($request->all(), [...])` in a controller method
- Code review: controller method parameter is `Request $request` instead of `StorePostRequest $request`
- Test review: validation tests go through HTTP endpoints, not independent FormRequest tests

**Solution**:
- Always use FormRequests for HTTP endpoint validation
- Move validation logic from controllers to dedicated FormRequest classes
- Reserve `Validator::make()` for non-HTTP contexts (jobs, CLI, service layer)

**Example**:
```php
// BEFORE: Inline validation in controller
class PostController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([ // ❌ inline, no FormRequest
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);
        // ...
    }
}

// AFTER: FormRequest
class PostController
{
    public function store(StorePostRequest $request): JsonResponse // ✅ FormRequest
    {
        $post = Post::create($request->validated());
        return PostResource::make($post);
    }
}
```

---

### AP-MVC-02: Validator::make With No Error Handling

**Description**: `Validator::make()` is called followed by `$validator->validated()` without first checking `$validator->passes()` or `$validator->fails()`. If validation fails, `validated()` throws a `ValidationException` with a generic error. The exception propagates up and may result in a 500 error instead of a proper 422 response, or may not be caught at all in non-HTTP contexts.

**Root Cause**: Assuming validation always passes. The developer writes the happy-path without considering failure.

**Impact**:
- Unhandled `ValidationException` in CLI commands causes the command to crash
- Unhandled `ValidationException` in queued jobs causes infinite retry loops
- HTTP endpoints may return 500 instead of 422 if no exception handler catch is configured
- In batch processing, one failed item crashes the entire batch

**Detection**:
- Code review: `$data = Validator::make($input, $rules)->validated()` — no `passes()`/`fails()` check
- Code review: `$validator->validated()` called unconditionally after `Validator::make()`
- Error logs: `ValidationException` thrown from service layer or job

**Solution**:
- Always check `$validator->passes()` or `$validator->fails()` before accessing validated data
- Handle the failure case explicitly: throw, return an error, or log
- Use `validate()` (which throws) if throwing is the desired behavior

**Example**:
```php
// BEFORE: No error handling
public function create(array $data): Post
{
    $validator = Validator::make($data, [
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', 'string'],
    ]);
    return Post::create($validator->validated()); // ❌ throws if validation fails
}

// AFTER: Explicit error handling
public function create(array $data): Post
{
    $validator = Validator::make($data, [
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', 'string'],
    ]);

    if ($validator->fails()) {
        throw new ValidationException($validator); // ✅ explicit, consistent with FormRequests
    }

    return Post::create($validator->validated());
}
```

---

### AP-MVC-03: Reusing Validator Instances

**Description**: A single `Validator` instance is created and reused for multiple validations — calling `->passes()`, modifying rules or data, then calling `->passes()` again. Validator instances cache results after the first `passes()`/`fails()` call; subsequent calls return the cached result regardless of data changes. The developer gets stale validation results without realizing it.

**Root Cause**: Not understanding that `Validator` is single-use. The developer treats it as a reusable service.

**Impact**:
- Second call to `passes()` returns the cached first result
- Modified data doesn't trigger re-validation
- Silent validation bypass: invalid data appears valid because of cached results
- Hard-to-find bugs in batch processing where the validator is reused across items

**Detection**:
- Code review: `$validator->passes()` called multiple times on the same `$validator` instance
- Code review: `$validator` variable reused in a loop with different data
- Bug reports: validation passing when it should fail (intermittent, order-dependent)

**Solution**:
- Create a fresh `Validator::make()` for each validation
- Never reuse a `Validator` instance
- In loops, create a new validator per iteration

**Example**:
```php
// BEFORE: Reusing validator instance
$validator = Validator::make($data, $rules);

foreach ($items as $item) {
    $validator->setData($item); // ❌ doesn't work — cached result
    if ($validator->fails()) { // ❌ returns cached result from $data, not $item
        // ...
    }
}

// AFTER: Fresh validator per item
foreach ($items as $index => $item) {
    $validator = Validator::make($item, $rules); // ✅ fresh instance
    if ($validator->fails()) {
        $errors[$index] = $validator->errors();
    } else {
        $valid[$index] = $validator->validated();
    }
}
```

---

### AP-MVC-04: Throwing ValidationException in Jobs

**Description**: A queued job uses `Validator::make()` and lets `ValidationException` propagate uncaught when validation fails. The job system (Horizon, Beanstalkd, SQS) sees the exception, releases the job back to the queue, and retries it. The job enters an infinite retry loop: fail → release → retry → fail → release → ..., consuming worker resources until it hits the max attempts limit.

**Root Cause**: Not considering the non-HTTP context. `ValidationException` is designed for HTTP request handling, not for queued jobs.

**Impact**:
- Infinite retry loop for jobs with invalid data
- Worker pool exhaustion from retrying the same failing jobs
- Log noise: thousands of repeated validation failure entries
- Delayed processing of legitimate jobs behind retrying ones

**Detection**:
- Code review: `Validator::make()` in a queued job without try/catch around `validated()` or `validate()`
- Error logs: repeated `ValidationException` entries for the same job ID
- Job monitoring: jobs with high attempt counts but low success rates

**Solution**:
- Catch `ValidationException` in queued jobs
- Log the failure with context and mark the job as failed
- Use `$validator->passes()` instead of `$validator->validate()` to avoid exceptions

**Example**:
```php
// BEFORE: Uncaught exception in job
class ProcessBulkImport implements ShouldQueue
{
    public function handle(): void
    {
        $validator = Validator::make($this->data, $this->rules);
        $validated = $validator->validated(); // ❌ throws on failure — infinite retry
        // ...
    }
}

// AFTER: Caught exception in job
class ProcessBulkImport implements ShouldQueue
{
    public function handle(): void
    {
        $validator = Validator::make($this->data, $this->rules);

        if ($validator->fails()) {
            Log::error('Bulk import validation failed', [
                'job_id' => $this->job->getJobId(),
                'errors' => $validator->errors()->toArray(),
            ]);
            $this->fail($validator->errors()); // ✅ mark as failed, don't retry
            return;
        }

        $validated = $validator->validated();
        // ... process
    }
}
```

---

### AP-MVC-05: Same Validation in FormRequest and Service Layer

**Description**: The same validation rules are defined in both the FormRequest and the service layer's `Validator::make()` call. The rules in both places must be kept in sync — if the FormRequest adds a new rule, the service layer must add it too. Over time, the two rule sets diverge, and the service layer either rejects valid data (stricter) or accepts invalid data (looser).

**Root Cause**: Defense-in-depth over-application. The developer adds validation in every layer "just in case," without coordinating the rule sets.

**Impact**:
- Rules duplicated across two locations — maintenance burden x2
- Divergence: FormRequest rules change but service rules don't
- Service layer validation adds latency to every request
- Inconsistent behavior: valid data accepted by FormRequest but rejected by service

**Detection**:
- Code review: identical or substantially similar rule arrays in FormRequest and service class
- Code review: `Validator::make()` in service class that mirrors FormRequest rules
- Bug reports: data accepted by API but fails service-layer validation (or vice versa)

**Solution**:
- Define rules in one place: the FormRequest for HTTP, the service layer for non-HTTP
- Don't duplicate — the service layer should trust the FormRequest for HTTP-triggered calls
- Add service-layer validation only for data paths that bypass the FormRequest

**Example**:
```php
// BEFORE: Duplicated rules
// StorePostRequest.php
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', 'string'],
    ];
}

// PostService.php
public function create(array $data): Post
{
    $validator = Validator::make($data, [ // ❌ same rules as FormRequest
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', 'string'],
    ]);
    // ...
}

// AFTER: No duplication in HTTP path
// PostService.php
public function create(array $data): Post
{
    // No duplicate validation — FormRequest already validated for HTTP path
    // Add service-layer validation only for additional business rules
    if ($this->hasDuplicateTitle($data['title'])) {
        throw new DuplicateTitleException('A post with this title already exists.');
    }
    // ...
}
```

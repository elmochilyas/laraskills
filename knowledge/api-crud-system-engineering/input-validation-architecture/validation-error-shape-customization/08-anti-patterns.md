# Anti-Patterns — Validation Error Shape Customization

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Validation Error Shape Customization |
| Difficulty | Intermediate |
| Category | Configuration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Overriding failedValidation in Every FormRequest | High | Medium | Code review: each FormRequest has its own failedValidation() |
| Using Default Laravel Web Format for API | High | High | Code review: default `{ message, errors }` shape for API |
| Including Raw Validation Rule Metadata | Medium | Low | Code review: rule constraints leaked in error messages |
| Translating Field Names Inconsistently | Medium | Medium | Code review: some fields translated, others raw |
| Custom Format Per API Version | Medium | Low | Code review: different error shapes in V1 vs V2 |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Override Doesn't Throw Exception | Returns response instead of throwing HttpResponseException | 200 response with error body instead of 422 |
| Returning 400 Instead of 422 for Validation | Wrong HTTP status for validation errors | Client expects different error semantics |
| Not Handling Nested Fields | Wildcard errors not formatted with correct pointers | Client cannot locate error source in nested structures |

---

## Anti-Pattern Details

### AP-VES-01: Overriding failedValidation in Every FormRequest

**Description**: Each FormRequest individually overrides `failedValidation()` to customize the error response format, duplicating the same code across 20+ files. Changing the error shape (e.g., switching from flat format to JSON:API) requires editing every FormRequest individually. New FormRequests must remember to include the override or they get the default shape.

**Root Cause**: No base class design. Each developer independently discovers the need for custom error formatting and implements it in their FormRequest.

**Impact**:
- Massive code duplication — same 5-10 lines in every FormRequest
- Changing the error format requires touching every file
- Risk of inconsistency: some FormRequests may have slightly different implementations
- Forgetting the override produces the default Laravel web shape

**Detection**:
- Code review: identical `failedValidation()` methods in multiple FormRequest files
- Code review: no base class between `FormRequest` and the action-specific requests
- File system: no `App\Http\Requests\Api\ApiRequest.php` base class

**Solution**:
- Create a base `ApiRequest` class that overrides `failedValidation()` once
- Extend all API FormRequests from `ApiRequest`
- Remove per-FormRequest `failedValidation()` overrides

**Example**:
```php
// BEFORE: Overridden in every FormRequest
class StorePostRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Validation failed.', 'fields' => $validator->errors()]], 422)
        );
    }
}

class UpdatePostRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Validation failed.', 'fields' => $validator->errors()]], 422)
        );
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

class StorePostRequest extends ApiRequest { /* no override needed */ }
class UpdatePostRequest extends ApiRequest { /* no override needed */ }
```

---

### AP-VES-02: Using Default Laravel Web Format for API

**Description**: The API returns Laravel's default validation error shape — `{ "message": "The given data was invalid.", "errors": { "field": ["message"] } }` — which is designed for web applications that display errors alongside forms. The `message` key at the top level contradicts the API's standardized error envelope (which typically uses `{ error: { code, message, status, detail } }`), and the `errors` key duplicates the status code semantics.

**Root Cause**: No customization. The developer uses the defaults from `FormRequest` without overriding `failedValidation()`.

**Impact**:
- Inconsistent with the API's error envelope contract
- Clients must parse two different error shapes: 4xx validation and other error types
- The `message` top-level key conflicts with `error` envelope key
- No machine-readable error codes in validation failures
- The `errors` key structure doesn't match the envelope's `detail.fields` sub-shape

**Detection**:
- Code review: no override of `failedValidation()` in the base API request class
- Integration tests: 422 response has `{ message, errors }` instead of `{ error: { code, message, status, detail } }`
- Client-side review: error parsing branches for 422 vs other error types

**Solution**:
- Override `failedValidation()` in the base `ApiRequest` class
- Use the same error envelope shape as all other error responses
- Include error codes alongside field messages for machine parsing

**Example**:
```php
// BEFORE: Default Laravel web format
// {
//   "message": "The given data was invalid.",
//   "errors": {
//     "email": ["The email field is required."]
//   }
// }

// AFTER: Consistent API error envelope
// {
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "message": "The given data was invalid.",
//     "status": 422,
//     "detail": {
//       "fields": {
//         "email": ["The email field is required."]
//       }
//     }
//   }
// }

// Implementation in base class:
abstract class ApiRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json(
                new ErrorEnvelope('VALIDATION_ERROR', 'The given data was invalid.', 422, [
                    'fields' => $validator->errors(),
                ]),
                422,
            )
        );
    }
}
```

---

### AP-VES-03: Including Raw Validation Rule Metadata

**Description**: Validation error messages include raw rule metadata like `min:5`, `max:255`, or regex patterns: `"The title must be at least 3 characters (min:3)."` or `"The email format must match /^[^@]+@[^@]+\.[^@]+$/."`. This exposes validation internals to clients, potentially revealing security-sensitive patterns (password rules, ID formats) and creating confusion with technical rule syntax.

**Root Cause**: Using Laravel's default `:min`, `:max`, `:format` placeholders in custom validation messages without sanitization.

**Impact**:
- Password validation rules revealed (minimum length, character requirements)
- Regex patterns exposed — attackers learn exact validation rules
- Technical rule syntax confuses non-technical API consumers
- Rule metadata may contain internal field names or system details

**Detection**:
- Code review: validation messages with `:min`, `:max`, `:format`, or raw regex
- Integration tests: 422 response contains rule syntax (`min:3`, `/regex/`)
- Client feedback: "what does 'min:3' mean in the error message?"

**Solution**:
- Use clean, human-readable messages without rule metadata
- Create custom messages that describe the constraint in plain language
- Never include regex patterns, minimum values, or rule identifiers in messages

**Example**:
```php
// BEFORE: Rule metadata in messages
public function messages(): array
{
    return [
        'title.min' => 'The title must be at least :min characters. (min::min)', // ❌ reveals min value
        'password.regex' => 'The password format is invalid. (pattern: :regex)', // ❌ reveals regex
    ];
}

// AFTER: Clean messages
public function messages(): array
{
    return [
        'title.min' => 'The title must be at least :min characters.',
        'password.regex' => 'The password must include uppercase, lowercase, and a number.',
    ];
}
```

---

### AP-VES-04: Translating Field Names Inconsistently

**Description**: Some validation error messages use translated field names (e.g., "The email address is required." for `email`), while others use raw field names (e.g., "The user_id is required." for `user_id`). The inconsistency comes from partial attribute translation — some fields have `attributes()` entries, others don't. Clients parse some error messages with readable field names and others with internal names.

**Root Cause**: Incremental attribute translation. The team adds `attributes()` entries for new fields but never backfills existing ones.

**Impact**:
- Client-side code must handle both translated and raw field names
- API consumers see "user_id" in one error and "User" in another
- Poor developer experience for API consumers
- Inconsistent documentation of error fields

**Detection**:
- Code review: `attributes()` method has entries for some fields but not others
- Integration tests: error response shows a mix of readable and internal field names
- API consumer feedback: inconsistent field names in validation errors

**Solution**:
- Maintain a complete `attributes()` mapping for all validated fields
- Use `resources/lang/{locale}/validation.php` for centralized attribute translation
- Audit all FormRequests for missing attribute mappings

**Example**:
```php
// BEFORE: Inconsistent translations
// StorePostRequest.php
public function attributes(): array
{
    return [
        'title' => 'Title',
        'body' => 'Body',
        // ❌ user_id, status, tags missing — they use raw names
    ];
}

// Errors show:
// "The title is required." ✅
// "The user_id is required." ❌ raw field name

// AFTER: Complete attribute mapping
public function attributes(): array
{
    return [
        'title' => 'Title',
        'body' => 'Body',
        'user_id' => 'Author',
        'status' => 'Status',
        'tags' => 'Tags',
    ];
}

// Or use lang files:
// resources/lang/en/validation.php
return [
    'attributes' => [
        'title' => 'Title',
        'body' => 'Body',
        'user_id' => 'Author',
        'status' => 'Status',
        'tags' => 'Tags',
    ],
];
```

---

### AP-VES-05: Custom Format Per API Version

**Description**: API version V1 returns validation errors in one format (e.g., `{ error: { code, message, fields } }`) while V2 returns a different format (e.g., JSON:API `{ errors: [{ status, code, title, source }] }`). API consumers must write different error parsing logic for each version, and the versioning is applied to the error format itself rather than the API contract.

**Root Cause**: The error format was redesigned between versions without backward compatibility or a version-independent error contract.

**Impact**:
- Clients must implement and maintain multiple error parsers
- Error format cannot be shared across API versions in shared client libraries
- Version upgrades require error handling changes, not just endpoint changes
- The error envelope contract is not version-independent

**Detection**:
- Code review: different `failedValidation()` overrides in `Api\V1\ApiRequest` vs `Api\V2\ApiRequest`
- Integration tests: V1 and V2 endpoints return different 422 structures
- Client code review: branching on API version for error parsing

**Solution**:
- Keep the error envelope shape consistent across all API versions
- Version only what changes: endpoints, request schemas, response schemas
- The error format should be version-independent — documented once for the entire API

**Example**:
```php
// BEFORE: Different formats per version
// App\Http\Requests\Api\V1\ApiRequest.php
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([
        'error' => ['code' => 'VALIDATION_ERROR', 'fields' => $validator->errors()],
    ], 422));
}

// App\Http\Requests\Api\V2\ApiRequest.php
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([
        'errors' => collect($validator->errors())->map(fn($msgs, $field) => [
            'status' => '422', 'code' => 'VALIDATION_ERROR', 'title' => $msgs[0],
            'source' => ['pointer' => "/data/attributes/{$field}"],
        ])->values(),
    ], 422));
}

// AFTER: Single format, independent of version
// App\Http\Requests\Api\ApiRequest.php (shared by V1 and V2)
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(
        response()->json(new ErrorEnvelope('VALIDATION_ERROR', 'Validation failed.', 422, ['fields' => $validator->errors()]), 422)
    );
}
```

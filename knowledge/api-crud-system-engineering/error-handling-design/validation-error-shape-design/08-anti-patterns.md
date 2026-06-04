# Anti-Patterns — Validation Error Shape Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Validation Error Shape Design |
| Difficulty | Intermediate |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Top-Level Message Only | High | Medium | Code review: 422 returns `{ message: "Validation failed" }` without per-field details |
| Array of Error Objects | Medium | Medium | Code review: `[{ field: "email", message: "required" }]` instead of field-keyed object |
| Machine Codes in Per-Field Messages | Medium | Low | Code review: `email: ["REQUIRED\|The email is required"]` |
| HTML in Validation Messages | High | Low | Penetration testing: XSS payload rendered in validation error response |
| Different Shape Per Locale | Medium | Low | Code review: localized error structures that differ by language |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Including Submitted Values in Messages | `The email "hacker@x.com" is invalid` reveals the submitted input | PII leak; credential/secret exposure in error responses |
| Deeply Nested Field Error Structures | `detail.fields.data.attributes.email` mirrors request input nesting | Clients must traverse nested paths to find field errors |
| Inconsistent Per-Endpoint Shapes | Some endpoints return `detail.fields`, others return `detail.errors` | Client must handle multiple shapes for validation errors |
| Returning First Error Only | `$validator->errors()->first()` returns a single message per field | Client misses additional validation failures |

---

## Anti-Pattern Details

### AP-VES-01: Top-Level Message Only

**Description**: The 422 response contains only a generic top-level message like `"Validation failed"` with no per-field error details. The client knows the request was invalid but cannot tell which specific fields failed or why. This forces developers to inspect server logs or manually test each field to find the actual validation problem.

**Root Cause**: Minimal error handling. The developer returns the validation exception message verbatim without extracting per-field errors.

**Impact**:
- Frontend forms cannot highlight individual invalid fields
- API consumers must brute-force each field to discover constraints
- User experience degrades to generic "something is wrong" messages
- Automated API clients cannot programmatically correct validation errors

**Detection**:
- Code review: 422 response returns only `$e->getMessage()` or `['message' => 'Validation failed']`
- Code review: `ValidationException` renderable returns the exception message without `errors()`
- Integration tests: 422 response lacks `detail.fields` or equivalent per-field structure

**Solution**:
- Always extract `$e->errors()` and include them in the response under `detail.fields`
- Normalise the error structure through a pipeline that groups messages by field
- Override `failedValidation()` on Form Requests to enforce the shape

**Example**:
```php
// BEFORE: Top-level message only
$this->renderable(function (ValidationException $e, Request $request) {
    return response()->json([
        'error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()], // ❌ no per-field details
    ], 422);
});

// AFTER: Full per-field details
$this->renderable(function (ValidationException $e, Request $request) {
    return response()->json([
        'error' => [
            'code' => 'VALIDATION_ERROR',
            'message' => $e->getMessage(),
            'status' => 422,
            'detail' => ['fields' => $e->errors()],
        ],
    ], 422);
});
```

---

### AP-VES-02: Array of Error Objects

**Description**: Validation errors are structured as an array of objects — `[{ field: "email", message: "The email is required." }]` — instead of a field-keyed object. Clients must iterate the array, extract the field name from each object, and build their own field-to-message map. This is harder to index, query, and render than a flat field-keyed map.

**Root Cause**: Serializer convenience. The developer transforms validation errors through a resource that maps each message to an object with field and message keys.

**Impact**:
- O(n) lookup: finding errors for a specific field requires scanning the entire array
- Frontend forms must build an index before rendering inline errors
- Sorting and deduplication require custom client logic
- Response size is larger due to repeated `field` keys in every object

**Detection**:
- Code review: validation normaliser returns `['errors' => [['field' => 'email', 'message' => '...'], ...]]`
- Code review: `collect($e->errors())->map(fn($msg, $field) => ['field' => $field, 'message' => $msg[0]])`
- Client-side review: error parsing code maps array to object by field name

**Solution**:
- Use a flat object with field names as keys and arrays of messages as values
- Match Laravel's native `$errors` structure: `{ "email": ["msg1", "msg2"] }`
- Place under `detail.fields` within the standard error envelope

**Example**:
```php
// BEFORE: Array of error objects
$errors = [
    ['field' => 'email', 'message' => 'The email field is required.'],
    ['field' => 'email', 'message' => 'The email must be valid.'],
    ['field' => 'name', 'message' => 'The name field is required.'],
];

// AFTER: Field-keyed object
$errors = [
    'email' => ['The email field is required.', 'The email must be valid.'],
    'name'  => ['The name field is required.'],
];

// Response shape:
// "detail": {
//     "fields": {
//         "email": ["The email field is required.", "The email must be valid."],
//         "name": ["The name field is required."]
//     }
// }
```

---

### AP-VES-03: Machine Codes in Per-Field Messages

**Description**: Per-field validation messages include machine-readable rule codes or pipe-delimited metadata — `email: ["REQUIRED|The email is required"]` or `email: ["required"]`. These are not human-readable sentences and force clients to either parse the codes or display cryptic text to users.

**Root Cause**: Validation rule definition reuse. The developer constructs custom validation messages that include the rule name for debugging, or uses validation error formats from other frameworks that mix codes and messages.

**Impact**:
- Users see technical rule names instead of readable error messages
- Clients must strip or extract codes from message strings before display
- Localization cannot translate error messages that contain embedded codes
- Integration tests must account for non-deterministic code prefixes

**Detection**:
- Code review: custom validation messages containing `:rule` or concatenated rule names
- Code review: validation normaliser that prepends rule codes to messages
- Visual inspection: 422 response shows `email: ["REQUIRED|The email field is required."]`

**Solution**:
- Use clean, human-readable sentences for all per-field messages
- Keep machine-readable codes at the envelope level, never in per-field messages
- Use Laravel's default validation messages or custom messages without rule prefixes

**Example**:
```php
// BEFORE: Machine codes in messages
'email' => ['REQUIRED|The email field is required.'] // ❌ code prefix

// AFTER: Clean sentences only
'email' => ['The email field is required.']

// If machine codes are needed for client branching, add them at the envelope level:
// "detail": {
//     "code": "VALIDATION_ERROR",
//     "fields": {
//         "email": ["The email field is required."]
//     }
// }
```

---

### AP-VES-04: HTML in Validation Messages

**Description**: Validation error messages contain HTML tags — `<a href="/register">Register here</a>`, `<strong>Email</strong> is required`, or JavaScript event handlers. If the error response is consumed by a web frontend that renders error messages as innerHTML, this creates an XSS vulnerability. Even if rendered as text, HTML tags degrade the user experience.

**Root Cause**: Custom validation rules that return HTML-formatted messages. The developer uses HTML in messages to provide rich error displays, or copies messages from a CMS that includes markup.

**Impact**:
- XSS vulnerability if error messages are rendered unsafely in browsers
- Stored XSS if validation errors are logged and later displayed in admin panels
- Response size bloat from unnecessary HTML markup
- Mobile/native clients must strip HTML tags before displaying

**Detection**:
- Code review: validation messages containing `<`, `>`, `href`, `onclick`, or other HTML
- Code review: custom validation rules that concatenate HTML into `:message`
- Penetration testing: injecting HTML in input fields reflected in validation error responses
- Integration tests: validation error response contains HTML tags

**Solution**:
- Strip all HTML tags from validation messages before returning them
- Use `strip_tags()` or `Str::stripTags()` in the validation normaliser pipeline
- Never include links, formatting, or interactive elements in error messages
- Use plain text messages only

**Example**:
```php
// BEFORE: HTML in messages
'email' => ['Please provide a valid <strong>email</strong> address.'] // ❌ HTML

// AFTER: Plain text only
'email' => ['Please provide a valid email address.']

// Strip HTML in the normaliser
public function normaliseValidationErrors(ValidationException $e): array
{
    return collect($e->errors())->map(function (array $messages) {
        return array_map(fn(string $msg) => strip_tags($msg), $messages);
    })->toArray();
}
```

---

### AP-VES-05: Different Shape Per Locale

**Description**: The validation error response structure changes based on the request locale — some localizations return flat field objects, others return nested structures, and some include or omit the `detail.fields` key entirely. Clients cannot parse validation errors generically because the shape depends on the language.

**Root Cause**: Localization logic that transforms the error structure. The developer builds locale-specific response formatting that re-shapes the validation output for each language.

**Impact**:
- Client code must branch on locale to parse validation errors
- Localized API consumers get inconsistent error handling experiences
- Integration tests must run against every supported locale
- Adding a new locale may introduce a different error structure

**Detection**:
- Code review: locale switching logic inside validation error formatting
- Code review: `app()->getLocale()` conditions that change the response structure
- Integration tests: 422 response shape differs between locales

**Solution**:
- Keep the validation error shape identical across all locales
- Only the message text should be localized, never the structure
- Use Laravel's lang files for message translation without altering the response shape
- Test the response shape for every locale in CI

**Example**:
```php
// BEFORE: Different shape per locale
$errors = $e->errors();
if (app()->getLocale() === 'ar') {
    // Arabic locale uses a different structure
    return response()->json(['detail' => ['errors' => $errors]], 422); // ❌ different key
}

// AFTER: Same shape, localized messages only
// Shape is always: { error: { code, message, status, detail: { fields } } }
// Only the string content of messages changes per locale

// Laravel lang files handle translation:
// resources/lang/en/validation.php -> "The :attribute field is required."
// resources/lang/ar/validation.php -> "حقل :attribute مطلوب."
// The response structure never changes.
```

# Validation Error Format & Return Messages — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-error-format-return-messages |

## Skills

### Skill: Implement Custom Error Format via Base FormRequest
- **Description:** Create a base FormRequest that all application requests extend, enforcing a consistent error format.
- **Steps:**
  1. Create `App\Http\Requests\ApiRequest` extending `FormRequest`
  2. Override `failedValidation()` with the desired error structure
  3. Have all API FormRequests extend `ApiRequest`
- **Context:** A base class ensures consistency without repeating `failedValidation()` in every request.

### Skill: Customize Error Messages Per Field
- **Description:** Provide human-readable, client-actionable error messages for each field.
- **Steps:**
  1. Override `messages()` in FormRequest
  2. Return array with `field.rule` keys and custom message values
  3. Use `:attribute` placeholder for the field name
- **Context:** Custom messages improve client understanding without revealing validation internals.

### Skill: Implement First-Error-Only Mode
- **Description:** Return only the first validation error to minimize information disclosure and simplify client handling.
- **Steps:**
  1. Override `failedValidation()` in FormRequest
  2. Extract the first error from `$validator->errors()->first()`
  3. Return a response with a single error message
- **Context:** First-error-only is suitable for programmatic clients and sensitive endpoints.

### Skill: Internationalize Validation Messages
- **Description:** Support multiple languages for validation error messages.
- **Steps:**
  1. Publish language files: `php artisan lang:publish`
  2. Edit `resources/lang/{locale}/validation.php` with translated messages
  3. Set `APP_LOCALE` or use `app()->setLocale()` based on request header
- **Context:** Laravel's translation system handles message resolution based on current locale.

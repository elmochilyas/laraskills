# Anti-Patterns: Form Request Validation Logic

## God Form Request
**Description:** A single FormRequest class used for multiple endpoints, switching rules based on the route name or HTTP method.
**Why it happens:** Developers want to minimize file count and think "validation is validation."
**Consequences:** Rules become hard to read; authorization becomes complex; changing one endpoint's validation risks breaking another.
**Better approach:** One Form Request per endpoint action.

## Default Authorize Abuse
**Description:** Leaving `authorize()` returning `true` on Form Requests for protected endpoints.
**Why it happens:** Developers forget to add authorization or assume middleware handles it.
**Consequences:** Form Request passes validation before auth middleware rejects the request — wasted work and potential information disclosure.
**Better approach:** Every protected Form Request should implement `authorize()` with proper checks.

## Validation In Controller
**Description:** Defining validation rules with `$request->validate([...])` in controllers instead of using Form Requests.
**Why it happens:** Convenience for simple endpoints; developers don't want to create a new file.
**Consequences:** Validation logic is scattered; can't be reused; controllers contain validation concerns.
**Better approach:** Always use Form Requests. They're testable, reusable, and keep controllers clean.

## Business Logic In Validation
**Description:** Checking business rules in Form Requests, such as "can this user be assigned to this project" or "is this within the user's quota."
**Why it happens:** Developers confuse input validation with business rule enforcement.
**Consequences:** Business logic is hidden in the validation layer; actions/services can't assume business rules are enforced.
**Better approach:** Validate format and presence in Form Requests. Check business rules in actions/services.

## Duplicated Rule Definitions
**Description:** Copy-pasting the same `['required', 'string', 'max:255']` across multiple Form Requests.
**Why it happens:** Quick development without refactoring.
**Consequences:** Changing a field's max length requires updating every Form Request that validates it.
**Better approach:** Extract shared rules to methods or a base request class.

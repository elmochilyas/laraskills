# Form Request Customization Points — Anti-Patterns

## Modifying Input Outside prepareForValidation
**Description:** Using `withValidator()` or `failedValidation()` to modify request input.
**Why it happens:** Developers reach for the first available override without understanding lifecycle order.
**Consequences:** Input modifications in `withValidator()` have no effect on validation since rules already ran. Modifications in `failedValidation()` never execute for valid requests.
**Better approach:** Always use `prepareForValidation()` for input transformations.

## Business Logic in failedValidation
**Description:** Performing database operations, sending notifications, or triggering side effects in `failedValidation()`.
**Why it happens:** Developers want to log failures or notify admins when validation fails.
**Consequences:** Side effects in error handling create unpredictable behavior. Validation exceptions may be caught and handled elsewhere, skipping error-side effects.
**Better approach:** Use form request events or middleware for logging. Keep `failedValidation()` focused on response formatting.

## Overriding the Wrong Method for Cross-Field Validation
**Description:** Placing cross-field validation logic in `rules()` using `$this->input()` with inline conditionals.
**Why it happens:** Developers find it convenient to check related fields directly in the rules array.
**Consequences:** Rules become complex and harder to test. `$this->input()` in rules creates implicit dependencies on request state.
**Better approach:** Use `withValidator()` with `$validator->after()` for cross-field validation, keeping `rules()` declarative.

## Mixing failedValidation and Exception Handling
**Description:** Overriding `failedValidation()` while also catching `ValidationException` in global exception handlers.
**Why it happens:** Two layers attempt to handle the same error, causing duplication or conflict.
**Consequences:** Error responses may be double-formatted or inconsistent depending on execution path.
**Better approach:** Choose one approach. Override `failedValidation()` for per-request customization. Use exception handlers for global formatting.

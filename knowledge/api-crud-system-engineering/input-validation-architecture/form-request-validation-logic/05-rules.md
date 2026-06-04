# Rules: Form Request Validation Logic

## Rule: Use Array Syntax For Validation Rules
- **Condition:** When defining rules() in Form Requests
- **Action:** Define rule sets as arrays: `['required', 'string', 'max:255']`. Avoid pipe-delimited string syntax.
- **Consequence:** Rule objects and custom rules can be added without string manipulation.
- **Enforcement:** Linter flags pipe syntax in Form Request rules.

## Rule: Always Define authorize() For Protected Endpoints
- **Condition:** When creating Form Requests for authenticated endpoints
- **Action:** Implement `authorize()` to check authentication and permissions. Never leave the default `return true` for protected endpoints.
- **Consequence:** Authorization is explicitly verified; no accidental public access.
- **Enforcement:** Architecture tests verify authorize() is implemented for Form Requests on protected routes.

## Rule: Separate Create and Update Form Requests
- **Condition:** When an endpoint has different validation rules for creation and updates
- **Action:** Create separate Form Request classes for store and update operations. Different rules, different authorization needs.
- **Consequence:** Rule sets are explicit; changing one doesn't affect the other.
- **Enforcement:** Review flags Form Requests that use route method detection to switch between rules.

## Rule: Extract Shared Rule Sets
- **Condition:** When multiple Form Requests share the same field validation rules
- **Action:** Extract shared rule arrays to methods or trait: `protected function nameRules(): array { return ['required', 'string', 'max:255']; }`.
- **Consequence:** Rule changes propagate to all Form Requests using the shared definition.
- **Enforcement:** Periodic review identifies duplicated rule patterns.

## Rule: Use withValidator() For Cross-Field Validation
- **Condition:** When validation depends on multiple field values
- **Action:** Use `withValidator()` for cross-field rules (start_date < end_date, password confirmation). Don't use closure rules on individual fields.
- **Consequence:** Cross-field logic is explicit and testable.
- **Enforcement:** Review flags cross-field validation implemented outside withValidator().

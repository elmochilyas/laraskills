# Request Lifecycle Integration — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | request-lifecycle-integration |

## Skills

### Skill: Order Middleware Correctly in Route Groups
- **Description:** Arrange middleware so authentication, authorization, rate limiting, and validation execute in the correct order.
- **Steps:**
  1. Place `auth` middleware first when validation needs user data
  2. Place `throttle` middleware after auth so user-specific limits work
  3. Place FormRequest last — validation after auth and throttling
- **Context:** Middleware order determines data availability and fail-fast behavior.

### Skill: Design FormRequest for the Lifecycle
- **Description:** Structure FormRequest methods to align with their lifecycle position.
- **Steps:**
  1. `authorize()` — check permissions only, no validation
  2. `prepareForValidation()` — transform input before rules
  3. `rules()` — declare validation rules declaratively
  4. `withValidator()` — add after-hooks for cross-field checks
  5. `failedValidation()` — custom error response
- **Context:** Each method runs at a specific lifecycle stage; using the wrong method causes logic to run too early or too late.

### Skill: Share Common Validation Across Endpoints
- **Description:** Extract common validation rules from FormRequests into reusable traits or base classes.
- **Steps:**
  1. Identify rule groups used by 3+ FormRequests
  2. Extract into a trait with a method returning the rules array
  3. Use the trait in multiple FormRequests
  4. Override specific rules in the FormRequest when needed
- **Context:** Trait composition avoids inheritance coupling and allows mixing rule groups.

### Skill: Use Custom FormRequest Base Class
- **Description:** Create a base FormRequest for the application with shared lifecycle behavior.
- **Steps:**
  1. Extend `Illuminate\Foundation\Http\FormRequest`
  2. Add common logic (logging, metrics, error format) in `failedValidation()`
  3. Have all application FormRequests extend this base class
- **Context:** A base class centralizes common lifecycle behavior and enforces consistent error handling.

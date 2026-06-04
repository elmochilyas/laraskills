# Anti-Patterns: Resource Controller Methods

## Fat Controller
**Description:** Controller methods with 20+ lines of business logic, database queries, and response formatting.
**Better approach:** Thin controller delegates to actions/services. Max ~5 lines per method.

## Incorrect HTTP Status Codes
**Description:** Store returning 200, destroy returning 200 with body, update returning 201.
**Better approach:** Follow REST conventions: Store=201, Destroy=204, Update=200.

## Missing Route Model Binding
**Description:** Manually calling `Model::findOrFail($id)` in controller methods.
**Better approach:** Type-hint the model in the method signature for automatic resolution.

## Validation In Controller
**Description:** Calling `$request->validate()` in controller methods instead of using Form Requests.
**Better approach:** Use Form Requests for all API input validation.

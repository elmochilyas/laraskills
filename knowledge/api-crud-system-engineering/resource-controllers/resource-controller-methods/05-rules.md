# Rules: Resource Controller Methods

## Rule: Use Specific Status Codes Per Method
- **Condition:** When returning responses from resource controller methods
- **Action:** Return 201 for store, 200 for index/show/update, 204 for destroy. Be explicit about status codes.
- **Consequence:** Correct HTTP semantics enable proper client behavior.
- **Enforcement:** Integration tests verify status codes per method.

## Rule: Keep Controller Methods Thin
- **Condition:** When implementing resource controller methods
- **Action:** Each method should be 3-5 lines: validate (FormRequest), delegate (Action/Service), respond (Resource/response).
- **Consequence:** Controllers are easy to read; business logic is testable independently.
- **Enforcement:** Architecture tests flag controller methods exceeding 15 lines.

## Rule: Delegate Business Logic To Actions/Services
- **Condition:** When controller methods need to perform operations
- **Action:** Delegate all business logic to action classes or service classes. Controllers only orchestrate.
- **Consequence:** Business logic is reusable and independently testable.
- **Enforcement:** Review ensures controller methods don't contain business logic.

## Rule: Use Route Model Binding For Model Resolution
- **Condition:** When accessing specific resources in show/update/destroy
- **Action:** Type-hint the model in the method signature. Let Laravel resolve the model and return 404 automatically.
- **Consequence:** No manual findOrFail calls; cleaner controller methods.
- **Enforcement:** Review flags manual model resolution in controller methods.

## Rule: Use Form Requests For Store and Update Validation
- **Condition:** When accepting input in store and update methods
- **Action:** Type-hint a Form Request in the method parameter. Use separate Form Requests for store vs update.
- **Consequence:** Validation is separate from controllers; rules are reusable.
- **Enforcement:** Linter flags $request->validate() calls in controller methods.

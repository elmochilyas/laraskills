# Rules: API Resource Transformation

## Rule: Always Use API Resources For Model Responses
- **Condition:** When returning Eloquent models from controllers
- **Action:** Return `UserResource::make($user)` or `UserResource::collection($users)`. Never return raw models.
- **Consequence:** Consistent response structure; internal model changes don't leak to consumers.
- **Enforcement:** Architecture tests flag Eloquent model returns from controller methods.

## Rule: Define Computed Fields In Resources, Not Models
- **Condition:** When a field is derived from model data for API output
- **Action:** Define computed fields in the resource's `toArray()`. Don't add accessors to models for API-specific computed fields.
- **Consequence:** Models stay focused on data; API-specific transformations are in the presentation layer.
- **Enforcement:** Review flags model accessors used only in API resources.

## Rule: Use whenLoaded() For Relationship Access
- **Condition:** When including relationships in API resources
- **Action:** Use `$this->whenLoaded('relationship')` for all relationship access in resources. Never access relationships directly.
- **Consequence:** Prevents N+1 queries when relationships aren't loaded.
- **Enforcement:** Review flags direct relationship access in resource toArray() methods.

## Rule: Use Conditional Attributes For Optional Fields
- **Condition:** When a field should only appear under certain conditions
- **Action:** Use `$this->when($condition, $value)` for fields that depend on context (auth state, request parameter).
- **Consequence:** Consumers see relevant fields; sensitive or irrelevant fields are omitted.
- **Enforcement:** Review flags fields included without condition that should be conditional.

## Rule: Keep Resources Stateless
- **Condition:** When designing API resource classes
- **Action:** Resources should not have side effects, make database queries, or perform business logic. They transform data only.
- **Consequence:** Resources are predictable and testable.
- **Enforcement:** Review flags database calls or side effects in resource classes.

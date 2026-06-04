# Nested Object Validation — Anti-Patterns

## Validating Nested Arrays Without Array Rule
**Description:** Defining rules for `items.*.field` without first declaring `items` as an `array`.
**Why it happens:** Developers jump straight to wildcard rules and forget that `items` must be individually validated as an array type.
**Consequences:** If `items` is a string or null, the wildcard rule never runs; validation succeeds with incorrect data.
**Better approach:** Always validate the array parent: `'items' => ['required', 'array']`.

## Overlapping Wildcard and Explicit Rules
**Description:** Defining both `items.*.name` and separate rules for `items.0.name`, `items.1.name`.
**Why it happens:** Developers want special validation for specific array positions.
**Consequences:** Wildcard rules override explicit positional rules; maintenance burden doubles.
**Better approach:** Use `items.*.name` uniformly. If specific positions need different rules, restructure the payload.

## Nesting Beyond 3 Levels
**Description:** Validating deeply nested structures like `data.relationships.addresses.data.attributes.city`.
**Why it happens:** Complex API specs (JSON:API) encourage deep embedding; developers follow the spec literally.
**Consequences:** Error messages become unreadable long paths; validation performance degrades; client error handling becomes complex.
**Better approach:** Flatten to 2 levels max. Use separate endpoints for deeply nested belongs-to resources.

## Ignoring Array Validation on Update (PATCH)
**Description:** Applying `required` array validation on PATCH requests where the array may be absent.
**Why it happens:** Developers copy store validation rules to update without adjusting for partial updates.
**Consequences:** Clients must send the entire array on every update; partial updates are impossible.
**Better approach:** Use `sometimes` for array fields on update; only validate when the array is present.

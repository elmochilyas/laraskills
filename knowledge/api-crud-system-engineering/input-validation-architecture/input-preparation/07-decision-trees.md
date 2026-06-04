# Decision Trees: Input Preparation

## Tree 1: Pre-Validation Transformation Strategy

```
Does this input field need modification before validation?
├── YES, needs sanitization (trim, lowercase, strip tags) → Use prepareForValidation() with merge().
├── YES, needs type coercion (string to int, string to boolean) → Coerce in prepareForValidation() before rules evaluate.
├── YES, needs default value for optional field → Inject default in prepareForValidation() if absent.
├── YES, needs computed value from other fields (slug from title) → Compute in prepareForValidation().
├── NO, passes through as-is → No transformation needed. Don't touch it.
└── YES, but transformation is complex → Extract to private named method. Keep prepareForValidation() readable.
```

## Tree 2: Sanitization Depth

```
What type of data is this field?
├── Free text (name, description) → Trim whitespace. Strip excessive HTML. Apply strip_tags if needed.
├── Email address → Trim + lowercase. Normalize to canonical form.
├── Phone number → Strip non-numeric characters. Keep country code format.
├── URL → Trim. Add https:// prefix if missing. Normalize trailing slash policy.
├── Enum/constrained value → Lowercase or normalize to enum case. Coerce before Rule::in() validation.
└── Numeric/quantity → Cast to int or float. Apply min/max clamping.
```

## Tree 3: Default Value Injection

```
Should this optional field have a default value?
├── YES, user intent is predictable (page=1) → Inject default in prepareForValidation() if null.
├── YES, missing field would break downstream logic → Inject sensible default. Document why.
├── YES, but default should be validated too → Inject default, let rules() validate it.
├── NO, field must be explicitly provided → Make it required in rules(). Don't inject default.
└── NO, null is a valid and meaningful value → Don't inject default. Handle null in downstream logic.
```

## Tree 4: Merge vs Replace

```
Are you adding new fields or modifying existing ones?
├── Adding new computed fields (slug, full_name) → Use merge(). Preserves existing input.
├── Modifying existing field values (lowercase email) → Use merge() with the same key. Overwrites single field.
├── Adding multiple related fields → Use merge() with multiple keys in one call.
├── Adding many unrelated fields → Split into focused merge() calls or extract to methods.
└── Replacing entire input → NEVER use replace(). Always use merge().
```

## Tree 5: Side Effect Prevention

```
Does this transformation require external data?
├── NO, pure string/type manipulation → Safe for prepareForValidation(). In-memory, no side effects.
├── YES, needs database lookup → DO NOT put in prepareForValidation(). Fetch in controller/service.
├── YES, needs external API call → DO NOT put in prepareForValidation(). Fetch in service layer.
├── YES, needs file/upload processing → DO NOT process in prepareForValidation(). Process after validation.
└── YES, involves caching or session data → DO NOT put in prepareForValidation(). Keep side-effect-free.
```

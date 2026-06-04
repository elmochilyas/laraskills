## Base Model vs Direct Model Extension

Choosing between creating a custom base model class and extending `Model` directly.

---

## Decision Context

When creating Eloquent models, you must decide whether to create a project-level base model or extend `Model` directly.

---

## Decision Criteria

* whether all models share common configuration (serialization, date format)
* need for consistent method overrides across all models
* project size and team standards
* future extensibility

---

## Decision Tree

Setting up model inheritance?

↓

Will all models share common configuration or method overrides?

YES → Create `App\Models\BaseModel` extending `Model`

    Override `serializeDate()`, set default `$dateFormat`, add `casts()` method

NO → Extend `Illuminate\Database\Eloquent\Model` directly for each model

---

## Rationale

A base model class centralizes shared configuration (date serialization, ID type, global trait registration). For large projects with many models, this reduces duplication. For small projects with few models, a base class adds unnecessary inheritance depth.

---

## Recommended Default

**Default:** Create a `BaseModel` extending `Model` for any project with 3+ models
**Reason:** Centralizes serialization, casting, and strict mode configuration

---

## Risks Of Wrong Choice

Duplication of serialization and configuration across all models; missing `serializeDate()` override leads to inconsistent API date formats.

---

## Related Rules

- Model configuration conventions (from base-model-class standardized knowledge)

---

## Related Skills

- Model creation and configuration (model-design/06-skills.md)

---

## Mass Assignment Strategy (fillable vs guarded)

Choosing between `$fillable` whitelist and `$guarded` blacklist for mass assignment protection.

---

## Decision Context

When configuring mass assignment protection, you must choose between explicitly listing fillable attributes or guarding all by default with exceptions.

---

## Decision Criteria

* security posture (whitelist is safer)
* number of fillable attributes vs guarded attributes
* whether the model should be strictly controlled
* whether you follow Laravel 11 defaults

---

## Decision Tree

Configuring mass assignment?

↓

Do most attributes need to be mass-assignable?

YES → Use `$guarded = []` (opt-out) — only for trusted internal models

NO → Use `$fillable` with explicit list (opt-in) — recommended default

    Are there only a few non-fillable attributes?

    YES → `$guarded` with specific columns might be simpler

    Default → Use `$fillable` for explicit whitelist

---

## Rationale

`$fillable` whitelist is the security-recommended approach — new attributes added to the table are protected by default. `$guarded = []` allows all attributes, which is risky. Laravel 11 defaults to `$guarded = ['*']` (all guarded), requiring explicit `$fillable` to allow mass assignment.

---

## Recommended Default

**Default:** `$fillable` with explicit list of mass-assignable attributes
**Reason:** Whitelist is safer; new columns are protected by default until explicitly allowed

---

## Risks Of Wrong Choice

Mass assignment vulnerabilities with `$guarded = []`; accidentally blocked mass assignment when `$fillable` is too restrictive.

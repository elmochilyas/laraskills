# Validation Skip on Edit — Anti-Patterns

## Copying Store Rules Without Adjusting for Update
**Description:** Using the exact same FormRequest for both store and update without modifying rules for partial updates.
**Why it happens:** Developers share a single FormRequest for both endpoints to reduce code duplication.
**Consequences:** Update requests fail validation because `required` rules expect all fields; partial updates are impossible.
**Better approach:** Create separate store and update FormRequests, or use inheritance with `sometimes` overrides.

## Forgetting to Ignore Current Model in Unique Rules
**Description:** Using `unique:table,column` on update without ignoring the current record.
**Why it happens:** Developers copy-paste store validation into update FormRequest without modifying the unique rule.
**Consequences:** Update fails on unchanged unique fields because the current model's own value is flagged as a duplicate.
**Better approach:** Always use `Rule::unique('table')->ignore($this->route('model'))` for unique fields on update.

## Using `sometimes` on Required Update Fields
**Description:** Applying `sometimes` to fields that must always be present in the update payload.
**Why it happens:** Developers blanket-apply `sometimes` to all rules without considering mandatory fields.
**Consequences:** Fields that should be required on update become optional; clients may omit critical fields.
**Better approach:** Use `required` for truly required update fields. Use `sometimes` for optional ones.

## Putting Skip Logic in the Controller
**Description:** Checking whether fields changed in the controller method and conditionally calling different validation.
**Why it happens:** Developers find it easier to write conditional logic in controllers than in FormRequests.
**Consequences:** Validation logic leaks into controllers; controllers become responsible for validation decisions.
**Better approach:** Keep all skip logic in the FormRequest's `prepareForValidation()` or `rules()` method.

## Incorrect Route Parameter Name in ignore()
**Description:** Using `$this->route('id')` instead of `$this->route('user')` when the route uses `{user}` binding.
**Why it happens:** Assumption that all route parameters follow the same naming convention.
**Consequences:** `ignore()` receives null or wrong value; unique validation doesn't exclude the correct record.
**Better approach:** Always verify the route parameter name against the route definition.

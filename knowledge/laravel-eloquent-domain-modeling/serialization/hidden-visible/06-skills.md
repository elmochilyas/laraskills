# Hidden / Visible Skills

## Skill: Control attribute visibility in serialization output using $hidden/$visible

### Purpose
Use `$hidden` (deny-list) or `$visible` (allow-list) on Eloquent models to control which attributes appear in `toArray()` and `toJson()` output — the first line of defense against accidental data exposure.

### When To Use
- Protecting sensitive columns (passwords, tokens, PII) from appearing in all serialization output
- Creating context-aware responses (admin sees SSN, public does not) via `makeVisible`/`makeHidden`
- Defining a strict API contract with `$visible` — only listed attributes ever appear
- Filtering pivot data on many-to-many relationships via `$pivotHidden`

### When NOT To Use
- For relationship-level filtering — hidden/visible applies only to model attributes
- For both `$hidden` and `$visible` on the same model — `$visible` takes precedence, `$hidden` is ignored
- As the sole security measure — use `$hidden` as a safety net, not primary control
- As a substitute for mass-assignment protection — `$hidden` does not prevent mass assignment

### Prerequisites
- Eloquent model with attributes to filter

### Inputs
- Model instance, optionally with context-aware overrides

### Workflow
1. Choose `$hidden` (deny-list) or `$visible` (allow-list) — never both
2. Add sensitive columns (password, remember_token, api_token, PII) to `$hidden`
3. Define `$pivotHidden` on every model with BelongsToMany having extra pivot columns
4. For context-aware visibility, use `makeVisible()`/`makeHidden()` on cloned instances
5. For strict API contracts, use `$visible` as an exclusive allow-list
6. Review `$hidden` every time a new column is added to a model
7. Feature-test that hidden fields are absent from JSON responses
8. Audit custom `toArray()` overrides for bypassing hidden/visible filtering

### Validation Checklist
- [ ] Sensitive columns are listed in `$hidden` on base model or trait
- [ ] `$pivotHidden` is defined for every BelongsToMany with extra pivot columns
- [ ] No model uses both `$hidden` and `$visible`
- [ ] Runtime `makeHidden`/`makeVisible` calls use cloned or fresh instances
- [ ] Feature tests assert hidden fields are absent from API responses
- [ ] New columns added to models are reviewed for `$hidden` inclusion
- [ ] `$hidden` is not used as substitute for `$fillable`/`$guarded`

### Common Failures
- Setting both `$hidden` and `$visible` — `$hidden` is silently ignored
- Expecting `$hidden` to filter relationships — it only applies to model attributes
- Using `makeHidden` on shared instances — mutates for downstream consumers
- Forgetting `$pivotHidden` — pivot columns leak into API output
- Typo in `$hidden` attribute name — attribute is silently exposed

### Decision Points
- **$hidden (deny-list) or $visible (allow-list)?** — Prefer `$hidden` for most models (attribute is included by default, opt out for sensitive ones). Use `$visible` for models where very few attributes should ever be exposed.
- **Instance mutation prevention** — Always clone or replicate before `makeVisible` in shared contexts

### Performance Considerations
- `array_diff_key` and `array_flip` on every serialization — O(n), negligible
- `makeHidden` on collections in loops triggers array rebuild per iteration — serialize after the loop
- No database impact — filtering is purely in-memory array manipulation

### Security Considerations
- Hidden attributes are still accessible in PHP via `$model->attribute` — `$hidden` only affects serialization
- `$visible` as allow-list means new columns are automatically excluded — safer but risks missing expected fields
- Audit `$hidden` arrays when new columns are added to prevent data leaks
- `$pivotHidden` prevents pivot data leakage (sensitive pivot columns)

### Related Rules
- [Hidden-Never-Both-Hidden-And-Visible](../hidden-visible/05-rules.md)
- [Hidden-Always-Hide-Sensitive-Columns](../hidden-visible/05-rules.md)
- [Hidden-PivotHidden-For-BelongsToMany](../hidden-visible/05-rules.md)
- [Hidden-MakeVisible-On-Cloned-Instances](../hidden-visible/05-rules.md)
- [Hidden-Visible-As-Strict-Allow-List](../hidden-visible/05-rules.md)
- [Hidden-Feature-Test-Absence](../hidden-visible/05-rules.md)
- [Hidden-Review-When-Adding-Columns](../hidden-visible/05-rules.md)
- [Hidden-Not-Substitute-For-Guarded](../hidden-visible/05-rules.md)
- [Hidden-Extend-From-Base-Model](../hidden-visible/05-rules.md)
- [Hidden-Audit-Custom-ToArray-Overrides](../hidden-visible/05-rules.md)

### Related Skills
- Inject computed accessor values into serialization output using $appends

### Success Criteria
- Sensitive columns (password, tokens) are absent from all serialization output
- `$pivotHidden` correctly filters intermediate table columns
- `makeVisible`/`makeHidden` on cloned instances don't affect shared state
- Feature tests confirm hidden fields are absent and visible-only fields are present
- New columns added to DB are reviewed for `$hidden` inclusion

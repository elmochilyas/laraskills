# Validation Rule Inheritance — Checklists

## Inheritance Design
- [ ] Inheritance used only when store/update rules are 80%+ similar
- [ ] Inheritance limited to one level (base → concrete)
- [ ] Traits used for rule groups shared across 3+ unrelated requests
- [ ] Traits are preferred over inheritance for cross-cutting rule groups
- [ ] No trait method name collisions (prefixed method names)

## Implementation
- [ ] `parent::rules()` called in child classes to inherit base rules
- [ ] `array_merge` used to override specific inherited rules
- [ ] `sometimes` applied to all update rules for partial update support
- [ ] `Rule::unique()->ignore()` used in update for unique field validation
- [ ] Trait methods return arrays that compose cleanly with `array_merge`

## Maintenance
- [ ] Rule sources are traceable — can find where any rule originates
- [ ] More rules are inherited than overridden (80/20 ratio)
- [ ] Base class does not contain conditional logic for store vs update
- [ ] Separate FormRequests used when store/update rules diverge significantly
- [ ] No deep inheritance chains (max 2 levels)

## Testing
- [ ] Test store validation uses store-specific rules
- [ ] Test update validation uses update-specific rules (including `sometimes`)
- [ ] Test that partial updates work correctly with inherited rules
- [ ] Test that override rules replace inherited rules correctly
- [ ] Test trait rule groups work in all FormRequests that use them

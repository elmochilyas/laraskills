# Livewire Validation — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Validation |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. No validate() Call Before Processing in Actions
2. Using $rules Array Instead of #[Rule] Attributes
3. Real-Time Validation Without Debounce
4. No Real-Time Validation Feedback
5. All Cross-Field Logic in a Single #[Rule]

---

## Repository-Wide Anti-Patterns

- **Validation after business logic**: Side effects (DB writes, API calls) before `$this->validate()`.
- **No `@error` directives in Blade**: Validation errors exist but aren't displayed to the user.
- **Default error messages only**: No custom messages — users see technical Laravel validation strings.
- **Mixed validation syntax**: Some properties use `#[Rule]`, some use `$rules` array — inconsistent.

---

## Anti-Pattern 1: No validate() Call Before Processing in Actions

### Category

Reliability

### Description

Processing data (creating records, sending emails, uploading files) inside an action method before calling `$this->validate()`.

### Why It Happens

Developers may place validation after setup logic, or forget it entirely. They may assume data is already valid because of client-side checks or `wire:model` attributes.

### Warning Signs

- Action method starts with `Post::create(...)` or similar DB writes before `$this->validate()`
- Business logic executed before any validation call
- No `$this->validate()` in the action method at all
- Validation errors occur after partial processing

### Why Harmful

If validation is called after some business logic has already executed, partial work may be done (records created, emails sent, files uploaded) before the validation error aborts the action. This leaves the application in an inconsistent state with no rollback. Validating first ensures all-or-nothing execution.

### Consequences

- Orphaned records created before validation failure
- Emails sent for invalid data
- File uploads persisted despite validation errors
- Inconsistent application state — partial writes with no cleanup

### Alternative

Call `$this->validate()` as the first statement in every action that modifies data. Fail fast before any side effects.

### Refactoring Strategy

1. Identify action methods where validation is not the first operation
2. Move `$this->validate()` to the beginning of each method
3. Remove any business logic that runs before validation
4. Verify that invalid data never reaches DB writes or external calls

### Detection Checklist

- [ ] `$this->validate()` is the first statement in every mutating action
- [ ] No business logic executes before validation
- [ ] Invalid data is rejected before any side effects occur
- [ ] Action methods follow the fail-fast pattern

### Related Rules

- Validate at the Start of Every Action (05-rules.md)

### Related Skills

- Implement Real-Time Server-Side Validation (06-skills.md)

### Related Decision Trees

- Real-Time Validation vs Deferred Validation (07-decision-trees.md)

---

## Anti-Pattern 2: Using $rules Array Instead of #[Rule] Attributes

### Category

Code Organization

### Description

Declaring validation rules in the historic `$rules` array instead of using modern `#[Rule]` PHP 8 attributes on each property.

### Why It Happens

The `$rules` array is the traditional approach from Livewire v2. Developers may be familiar with it, have existing code using it, or not know about `#[Rule]` attributes (introduced in Livewire v3).

### Warning Signs

- `protected $rules = [...]` array in the component
- Rules defined at the top of the class, far from the properties they validate
- Properties have no `#[Rule]` attribute above them
- Array has 5+ entries mapping property names to rule strings

### Why Harmful

The `$rules` array separates the rule definition from the property it validates. When a property is renamed, the corresponding rule in the `$rules` array is often missed, silently leaving the old rule in place. `#[Rule]` attributes are co-located with the property, making the relationship explicit and preventing drift.

### Consequences

- Property renames orphan validation rules — old rule silently applies to wrong field
- Rules are distant from the properties they constrain — poor readability
- Readability suffers — must scroll to match properties to rules
- Maintenance burden — renaming a property requires updating two locations

### Alternative

Use `#[Rule('required|min:3')]` directly above each property declaration. Reserve the `$rules` array only for dynamic rules computed at runtime.

### Refactoring Strategy

1. Identify components using `$rules` array for static rules
2. Move each rule to a `#[Rule]` attribute above the corresponding property
3. Delete the `$rules` array or keep it only for truly dynamic rules
4. Verify that validation behavior is unchanged after migration

### Detection Checklist

- [ ] Static validation rules use `#[Rule]` attributes
- [ ] `$rules` array used only for dynamic (runtime-computed) rules
- [ ] No orphaned rules from property renames
- [ ] Rules are co-located with the properties they validate

### Related Rules

- Prefer Rule Attributes Over Rules Array (05-rules.md)

### Related Skills

- Implement Real-Time Server-Side Validation (06-skills.md)

### Related Decision Trees

- #[Rule] Attribute vs $rules Array for Validation Rules (07-decision-trees.md)

---

## Anti-Pattern 3: Real-Time Validation Without Debounce

### Category

Performance

### Description

Setting up real-time validation via `validateOnly()` in `updated()` without adding `.debounce` on the `wire:model` directive, causing excessive validation requests on every keystroke.

### Why It Happens

The `updated()` hook fires on every property change by default. Adding `validateOnly()` is straightforward. Adding `.debounce` requires an extra modifier that may seem unnecessary when testing locally.

### Warning Signs

- Search field with `updatedSearch()` → `$this->validateOnly('search')` and no `.debounce`
- Network tab shows 5-10 AJAX requests per second from a single field
- Database logs show repeated validation queries for a typing user
- Server CPU spikes correlated with users typing in validated fields

### Why Harmful

Without debounce, a fast typist triggers a validation request on every keystroke — 5-10 requests per second for a single field. Each request executes the `updated()` hook, which runs `validateOnly()` and may trigger expensive validation rules (unique checks, exists queries). This multiplies server load for every active user.

### Consequences

- Excessive AJAX requests per keystroke
- Database queries on every keystroke for rules with DB lookups
- Server CPU waste from redundant validation
- Mobile battery drain from frequent network calls

### Alternative

Add `.debounce.300ms` (or longer) to `wire:model` for fields that trigger expensive validation. Debounce coalesces rapid keystrokes into a single validation request after the user pauses.

### Refactoring Strategy

1. Identify validated fields with real-time feedback but no debounce
2. Add `.debounce.300ms` to the `wire:model` directive: `wire:model.debounce.300ms="field"`
3. For rules with DB queries (unique, exists), increase to 500ms+
4. For simple rules (required, min), debounce is optional

### Detection Checklist

- [ ] Fields with real-time validation use `.debounce` modifier
- [ ] 300ms debounce is the minimum for most validated fields
- [ ] Rules with DB queries use longer debounce (500ms+)
- [ ] Validation request rate is within acceptable limits
- [ ] No excessive validation requests in network tab

### Related Rules

- Debounce Real-Time Validation (05-rules.md)

### Related Skills

- Implement Real-Time Server-Side Validation (06-skills.md)

### Related Decision Trees

- Real-Time Validation vs Deferred Validation (07-decision-trees.md)

---

## Anti-Pattern 4: No Real-Time Validation Feedback

### Category

UX

### Description

Not implementing real-time validation via `validateOnly()` in the `updated()` hook — the user sees all validation errors only after clicking the submit button.

### Why It Happens

Real-time validation requires adding an `updated()` hook that calls `validateOnly()`. It's an extra step beyond defining rules. Developers may rely solely on submit-time validation.

### Warning Signs

- Component has `#[Rule]` attributes but no `updated()` hook
- User fills out an entire form, clicks submit, and sees all errors at once
- No inline error messages appear as the user types or tabs between fields
- Form has 10+ fields but only validates on submit

### Why Harmful

Without real-time validation, the user fills out an entire form, clicks submit, and only then sees all errors at once. They must correct mistakes they could have fixed immediately if the error was shown when the field lost focus. This is frustrating, increases form abandonment, and leads to data loss if the user navigates away after a failed submission.

### Consequences

- User sees all validation errors only after form submission
- Must re-enter data in fields that had errors
- Higher form abandonment — frustrating UX
- Slower feedback loop — user can't correct mistakes as they go

### Alternative

Add a `public function updated(string $propertyName): void` method that calls `$this->validateOnly($propertyName)` to validate the changed field immediately.

### Refactoring Strategy

1. Identify components with validation rules but no real-time feedback
2. Add `public function updated(string $propertyName): void { $this->validateOnly($propertyName); }`
3. For fields with expensive rules, add `.debounce` to `wire:model`
4. Ensure `@error` directives are in the Blade template to display real-time errors

### Detection Checklist

- [ ] Components with validation have an `updated()` hook calling `validateOnly()`
- [ ] Real-time error messages appear as the user fills out each field
- [ ] Errors clear automatically when the user fixes the input
- [ ] Form still validates on submit (redundant, but safe)

### Related Rules

- Provide Real-Time Validation Feedback (05-rules.md)

### Related Skills

- Implement Real-Time Server-Side Validation (06-skills.md)

### Related Decision Trees

- Real-Time Validation vs Deferred Validation (07-decision-trees.md)

---

## Anti-Pattern 5: All Cross-Field Logic in a Single #[Rule]

### Category

Framework Usage

### Description

Attempting to express cross-field validation rules (e.g., "end_date must be after start_date") inside a single `#[Rule]` attribute, which cannot access other property values.

### Why It Happens

Developers may not realize that `#[Rule]` attributes validate only the individual property. They try to use the `after:field` or `prohibited_if:field` rules, which don't work as expected in Livewire's attribute context.

### Warning Signs

- `#[Rule('after:start_date')]` applied to `endDate` — validates against literal string "start_date"
- `#[Rule('prohibited_if:someField,someValue')]` — syntax doesn't match Livewire property access
- Cross-field constraints in `#[Rule]` that reference other properties by name
- Cross-field validation doesn't work but no alternative approach is used

### Why Harmful

`#[Rule]` attributes validate a single property in isolation. They have no access to other property values. Cross-field rules require comparison between properties, which is only possible in an imperative validation block. Using the wrong approach means the validation silently does nothing — or validates against the wrong value.

### Consequences

- Cross-field rules silently don't work — invalid data passes through
- `after:start_date` validates against a literal string, not the property value
- No validation for inter-field constraints (end before start, mismatched passwords)
- Data integrity issues from unvalidated cross-field relationships

### Alternative

Use `$this->addError()` in the action method (or `updated()` hook) to manually validate cross-field conditions and attach errors to the relevant fields.

### Refactoring Strategy

1. Identify `#[Rule]` attributes that reference other property names
2. Move the cross-field logic to the action method (or `updated()` for real-time)
3. Use `if ($this->endDate && $this->startDate && $this->endDate <= $this->startDate) { $this->addError('endDate', '...'); }`
4. For reusable cross-field logic, extract to a custom validation rule object

### Detection Checklist

- [ ] No `#[Rule]` attribute references other property names
- [ ] Cross-field validation uses `$this->addError()` in action methods
- [ ] Cross-field validation works correctly (tested)
- [ ] Reusable cross-field logic is extracted to custom rule objects

### Related Rules

- Use addError for Cross-Field Validation (05-rules.md)

### Related Skills

- Implement Real-Time Server-Side Validation (06-skills.md)

### Related Decision Trees

- Livewire Validation vs FormRequest Validation (07-decision-trees.md)

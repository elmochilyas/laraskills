# Livewire Data Binding — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Data Binding |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. All Fields with Live Binding — No .defer Usage
2. No Debounce on Search/Real-Time Fields
3. Missing .number Modifier on Numeric Inputs
4. Missing .boolean Modifier on Checkboxes
5. Binding wire:model to Computed Properties

---

## Repository-Wide Anti-Patterns

- **Side effects in every updated hook**: Expensive queries in `updated()` for frequently-changing fields.
- **No .lazy on blur-validation fields**: Sending AJAX on every keystroke when validation only needs to happen on blur.
- **Binding to non-public properties**: `wire:model` requires public properties — private properties silently fail.

---

## Anti-Pattern 1: All Fields with Live Binding — No .defer Usage

### Category

Performance

### Description

Using the default `wire:model` (which sends AJAX on every change) on all form fields instead of using `wire:model.defer` to batch updates.

### Why It Happens

Default `wire:model` is the first modifier developers learn. It works, so there's no immediate reason to change. The performance impact (N+1 AJAX requests per form) is invisible to the developer who is testing one field at a time.

### Warning Signs

- Network tab shows 10+ AJAX requests when filling a 10-field form
- Each `wire:model` field triggers a separate request on every keystroke or change
- Form submission is slow because of accumulated update requests
- No `.defer` modifier on any form fields

### Why Harmful

Livewire's default `wire:model` sends an AJAX request on every keystroke or change event. A typical form with 10 fields generates 10+ unnecessary AJAX requests before the user even clicks submit. Each request boots the Livewire lifecycle, runs middleware, and processes the update. For forms where the server only needs the data on submit, all these requests are wasted.

### Consequences

- Excessive AJAX requests — 10+ per form fill
- Unnecessary server load from live updates
- Slower form interaction from queued requests
- Mobile battery drain from frequent network calls

### Alternative

Use `wire:model.defer` on all form fields except those requiring real-time server feedback. Deferred fields sync their values to the server only when an action (like `save`) is triggered.

### Refactoring Strategy

1. Add `.defer` to all `wire:model` directives in form templates
2. For fields that need real-time feedback (search, dependent dropdowns), use `.debounce` instead
3. Verify that form submission sends all field values together in the action request
4. Test that `.defer` doesn't break dependent dropdowns or real-time validation

### Detection Checklist

- [ ] Most form fields use `wire:model.defer`
- [ ] No form with 5+ fields uses default `wire:model` on all fields
- [ ] Real-time feedback fields use `.debounce` instead of default
- [ ] Network tab shows minimal AJAX requests during form filling

### Related Rules

- Use defer for Most Form Fields (05-rules.md)

### Related Skills

- Implement Efficient Data Binding with Correct Modifiers (06-skills.md)

### Related Decision Trees

- wire:model Default vs wire:model.defer for Form Fields (07-decision-trees.md)

---

## Anti-Pattern 2: No Debounce on Search/Real-Time Fields

### Category

Performance

### Description

Binding search-as-you-type fields or other real-time inputs with default `wire:model` (no debounce), causing a database query on every keystroke.

### Why It Happens

Default `wire:model` feels responsive — the search updates instantly. The developer sees one field and doesn't notice the 5-10 queries per second on the server. The performance problem only appears under load.

### Warning Signs

- Database log shows the same search query 5-10 times per second per user
- Search field uses `wire:model="search"` without `.debounce`
- Server CPU spikes correlated with active users typing in search fields
- Slow response times during peak usage

### Why Harmful

Without debounce, a search field with `updatedSearch()` that queries the database fires a query on every keystroke. A fast typist produces 5-10 queries per second. For 100 concurrent users typing, that's 500-1000 queries per second — just from search fields. This can overwhelm the database.

### Consequences

- Excessive database queries per keystroke
- Database overload during peak typing periods
- Slow search responses from queued queries
- Poor scalability — load grows with active typists, not request volume

### Alternative

Add `.debounce.300ms` (or longer) to fields that trigger expensive server-side operations. Debounce coalesces rapid changes into a single query after the user stops typing.

### Refactoring Strategy

1. Identify all `wire:model` fields with `updated` hooks that query the database
2. Add `.debounce.300ms` to the `wire:model` directive
3. For very expensive queries, increase debounce to 500-1000ms
4. Verify that the search still feels responsive with the debounce

### Detection Checklist

- [ ] All search fields use `wire:model.debounce.300ms` or longer
- [ ] Fields with expensive `updated` hooks have debounce
- [ ] Database query rate from search is within acceptable limits
- [ ] Search feels responsive despite debounce

### Related Rules

- Debounce Search and Real-Time Fields (05-rules.md)

### Related Skills

- Implement Efficient Data Binding with Correct Modifiers (06-skills.md)

### Related Decision Trees

- wire:model with Debounce vs lazy vs Real-Time Update (07-decision-trees.md)

---

## Anti-Pattern 3: Missing .number Modifier on Numeric Inputs

### Category

Reliability

### Description

Using `wire:model` on `<input type="number">` without the `.number` modifier, causing string values to be sent to integer-typed PHP properties.

### Why It Happens

HTML inputs always send string values. Developers expect that `type="number"` would send a number, but HTML form data is always strings.

### Warning Signs

- `TypeError` on integer-typed Livewire properties when receiving numeric input
- `public int $age = 0` with `wire:model="age"` causes type errors
- Numeric comparison logic fails because values are strings, not integers

### Why Harmful

HTML input values are always strings. Without `.number`, Livewire sends the string "42" to a property typed as `int`. PHP 8+ with strict types rejects this string-to-int assignment, causing a type error. The property update fails silently or throws an exception.

### Consequences

- Type errors on integer properties — crashes or silent failures
- Numeric comparisons behave incorrectly (string "9" > string "100" alphabetically)
- Data stored as strings in the database — query issues
- Form validation passes but downstream logic fails

### Alternative

Add `.number` to every `wire:model` on `<input type="number">` or any field whose PHP property type is `int` or `float`.

### Refactoring Strategy

1. Identify all numeric PHP properties in Livewire components (`int`, `float` types)
2. Add `.number` modifier to the corresponding `wire:model` directives
3. Test that values arrive as proper numeric types in `updated` hooks and action methods

### Detection Checklist

- [ ] All integer-typed properties have `.number` on their `wire:model`
- [ ] All float-typed properties have `.number` on their `wire:model`
- [ ] No string-to-int type errors in Livewire update requests
- [ ] Numeric comparisons work correctly with proper types

### Related Rules

- Use number for Numeric Inputs (05-rules.md)

### Related Skills

- Implement Efficient Data Binding with Correct Modifiers (06-skills.md)

### Related Decision Trees

- wire:model vs Manual $set() for Property Updates (07-decision-trees.md)

---

## Anti-Pattern 4: Missing .boolean Modifier on Checkboxes

### Category

Reliability

### Description

Using `wire:model` on `<input type="checkbox">` without the `.boolean` modifier, causing the string "on" to be sent instead of a boolean `true`.

### Why It Happens

Checkbox behavior in HTML is unusual — checked sends the value attribute (default "on"), unchecked sends nothing. Developers expect boolean behavior but get a string.

### Warning Signs

- `public bool $isActive = false` with `wire:model="isActive"` — property becomes string "on" when checked
- `if ($this->isActive)` still evaluates truthy for string "on" (works accidentally), but `=== true` fails
- Checkbox state appears incorrect after page re-render
- Boolean property holds "on" string instead of `true`

### Why Harmful

Checkbox values in HTML are either the string "on" (checked) or omitted entirely (unchecked). Without `.boolean`, Livewire sets the property to the string "on" when checked. For a boolean-typed property, this causes a type error in strict types mode. For untyped properties, the string "on" can cause subtle logic bugs.

### Consequences

- Boolean property holds string "on" instead of `true`
- Strict type errors on boolean-typed properties
- `if ($this->isActive === true)` evaluates to false even when checked
- Form submission includes incorrect boolean values

### Alternative

Add `.boolean` to every `wire:model` on checkbox inputs. This uses `filter_var($value, FILTER_VALIDATE_BOOLEAN)` to cast to a proper boolean.

### Refactoring Strategy

1. Identify all checkbox inputs with `wire:model`
2. Add `.boolean` modifier to each
3. Test that checked → `true`, unchecked → `false`
4. Verify strict equality checks pass with the correct boolean type

### Detection Checklist

- [ ] All checkbox inputs use `wire:model.boolean`
- [ ] No boolean-typed properties receive string "on"
- [ ] Checked state correctly sets `true`, unchecked sets `false`
- [ ] `=== true` comparisons work with boolean properties

### Related Rules

- Use boolean for Checkboxes (05-rules.md)

### Related Skills

- Implement Efficient Data Binding with Correct Modifiers (06-skills.md)

### Related Decision Trees

- wire:model Default vs wire:model.defer for Form Fields (07-decision-trees.md)

---

## Anti-Pattern 5: Binding wire:model to Computed Properties

### Category

Framework Usage

### Description

Applying `wire:model` to a property or method marked with the `#[Computed]` attribute, which is read-only and cannot be updated from the frontend.

### Why It Happens

Developers may not distinguish between regular public properties and computed properties in the Blade template. The computed property's name may look like a regular property, and the template bind fails silently.

### Warning Signs

- Input with `wire:model` doesn't update after typing
- No error message is shown — the binding silently fails
- The bound method has `#[Computed]` attribute
- `wire:model` is applied to a method name (with parentheses in Blade)

### Why Harmful

`#[Computed]` properties are read-only derived values that are cached within a single request. They have no setter — Livewire cannot update them when the user changes the input. Binding `wire:model` to a computed property silently fails: the input changes client-side, but the property never updates server-side. The user's input is lost.

### Consequences

- Input changes don't persist — user types, field appears to update, but data is lost on next render
- No error or warning to indicate the binding is broken
- User frustration from lost input
- Hard to debug — the template looks correct but the computed property is read-only

### Alternative

Only bind `wire:model` to public properties that store mutable state. Use regular public properties for form fields and computed properties for derived display values.

### Refactoring Strategy

1. Identify `wire:model` directives that bind to computed properties
2. Create a regular public property to hold the mutable value
3. Update the computed property to derive from the new public property
4. Bind `wire:model` to the new public property instead

### Detection Checklist

- [ ] No `wire:model` bound to methods with `#[Computed]`
- [ ] All `wire:model` targets are public properties (not methods)
- [ ] Computed properties are used only for display (no input binding)
- [ ] Input changes persist correctly after re-render

### Related Rules

- Never Bind wire:model to Computed Properties (05-rules.md)

### Related Skills

- Implement Efficient Data Binding with Correct Modifiers (06-skills.md)

### Related Decision Trees

- wire:model vs Manual $set() for Property Updates (07-decision-trees.md)

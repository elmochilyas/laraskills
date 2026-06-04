# Livewire Volatile Properties — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Volatile Properties |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Sensitive Data Not Marked as Volatile
2. UI State Stored as Volatile
3. Relying on Volatile Values Across Requests
4. Setting Volatile Only in mount()
5. Large Intermediate Data Not Marked Volatile

---

## Repository-Wide Anti-Patterns

- **No volatile usage at all**: All properties are normal public — sensitive data exposed in every snapshot.
- **Volatile on computed properties**: Marking `#[Computed]` methods as `#[Volatile]` — incompatible, volatile is for properties.
- **Inconsistent volatile application**: Some sensitive fields marked, others missed — security gaps.
- **No documentation**: Volatile properties used but team doesn't know they reset after each request.

---

## Anti-Pattern 1: Sensitive Data Not Marked as Volatile

### Category

Security

### Description

Storing passwords, API keys, payment tokens, or PII in normal public properties without the `#[Volatile]` attribute, causing the data to be serialized and sent to the frontend in every response.

### Why It Happens

Developers may not know about `#[Volatile]` (Livewire v3 feature), may not realize that ALL public properties are serialized, or may forget to add the attribute to a sensitive property.

### Warning Signs

- `public string $password = ''` with no `#[Volatile]`
- `public string $paymentToken = ''` with no `#[Volatile]`
- API responses contain sensitive data in the component snapshot
- HTML source inspection reveals tokens, passwords, or PII
- Network tab shows sensitive values in Livewire message payloads

### Why Harmful

Every public property that is not marked `#[Volatile]` is serialized into the Livewire component snapshot and sent to the frontend with every response. This snapshot is visible in the HTML source and network tab. Without explicit opt-out, sensitive data is silently exposed to anyone who views the page source or opens the browser's developer tools.

### Consequences

- Passwords, tokens, and API keys visible in HTML source
- PII exposed in browser developer tools
- Compliance violations (GDPR, PCI-DSS) from data exposure
- Security incident — sensitive data accessible to any page visitor

### Alternative

Audit every public property and apply `#[Volatile]` to any that holds sensitive data. Use private/protected for data that doesn't need to be in templates.

### Refactoring Strategy

1. Audit every public property in every Livewire component
2. Apply `#[Volatile]` to passwords, tokens, API keys, and PII
3. For sensitive data not needed in templates, use private/protected instead
4. Verify that no sensitive data appears in the component snapshot after changes

### Detection Checklist

- [ ] No passwords in normal public properties
- [ ] No payment tokens in normal public properties
- [ ] No API keys in normal public properties
- [ ] No PII in normal public properties
- [ ] All sensitive properties are `#[Volatile]` or private/protected
- [ ] HTML source inspection shows no sensitive values

### Related Rules

- Mark All Sensitive Properties as Volatile (05-rules.md)

### Related Skills

- Secure Sensitive Data with Volatile Properties (06-skills.md)

### Related Decision Trees

- #[Volatile] vs Normal Property for Sensitive Data (07-decision-trees.md)

---

## Anti-Pattern 2: UI State Stored as Volatile

### Category

Design

### Description

Marking properties that hold persistent UI state (form input values, toggles, selections, search text) as `#[Volatile]`, causing them to reset after every request.

### Why It Happens

Developers may misunderstand volatile's purpose — "it's for temporary data I don't want sent to the frontend" — and apply it to form fields without understanding the persistence implication.

### Warning Signs

- `#[Volatile] public string $search = ''` — search text resets after every keystroke
- `#[Volatile] public bool $showDetails = false` — toggle resets after every action
- `#[Volatile] public string $selectedId = ''` — selection lost after any interaction
- Form inputs lose their values after submit fails
- User complains that fields keep resetting

### Why Harmful

Volatile properties reset to their default value after every request. If a form input like `$search = ''` is marked volatile, the search text disappears every time the user triggers any action. The form field empties, selections are lost, and the component becomes unusable for any interaction that requires state preservation.

### Consequences

- Form inputs reset after every interaction
- Search text disappears after each keystroke
- Toggle states lost immediately after toggling
- Component becomes unusable for multi-step workflows
- User frustration from fields that won't hold values

### Alternative

Use normal (non-volatile) public properties for all UI state that must persist across re-renders — form inputs, toggles, selections, and display preferences.

### Refactoring Strategy

1. Identify volatile properties used for UI state
2. Remove `#[Volatile]` from form inputs, toggles, and selections
3. Verify that UI state persists correctly across actions and re-renders
4. Add `#[Volatile]` only for truly non-persistent or sensitive data

### Detection Checklist

- [ ] No volatile properties used for form input values
- [ ] No volatile properties used for toggle or selection state
- [ ] UI state persists across requests and re-renders
- [ ] Volatile is reserved for sensitive or single-request data

### Related Rules

- Keep UI State in Normal Properties (05-rules.md)

### Related Skills

- Secure Sensitive Data with Volatile Properties (06-skills.md)

### Related Decision Trees

- #[Volatile] vs Normal Property for Sensitive Data (07-decision-trees.md)

---

## Anti-Pattern 3: Relying on Volatile Values Across Requests

### Category

Reliability

### Description

Writing code that depends on a volatile property's value persisting from one request to the next, without accounting for the reset behavior.

### Why It Happens

Developers treat volatile properties like normal properties, expecting them to retain values across requests. They may set a value in one action and read it in another.

### Warning Signs

- Action method reads a volatile property that was set in a different action
- Volatile property set in `mount()` — expected to be available in subsequent requests
- Component logic depends on volatile values from previous interactions
- Intermittent bugs where volatile values are unexpectedly empty

### Why Harmful

Volatile properties are reset to their default value after every request in the `dehydrate` phase. A value set in one action is gone by the time the next action runs. Relying on volatile persistence creates intermittent, hard-to-debug bugs where values appear and disappear unpredictably across requests.

### Consequences

- Values set in one action are lost in the next
- Intermittent bugs — work sometimes, fail sometimes
- Hard to debug — property values are empty without clear cause
- Logic errors from assuming state persists

### Alternative

Always set volatile properties within the same action method that uses them. For values that must persist across requests, use normal properties (or fetch fresh data each time).

### Refactoring Strategy

1. Identify volatile properties read in different actions than where they're set
2. If the value must persist across requests, change to a normal property
3. If the value is single-use, set and use it within the same action
4. For ephemeral values, set them fresh in each action that needs them

### Detection Checklist

- [ ] Volatile properties are set and used within the same request
- [ ] No volatile property is read in a different action than where it was set
- [ ] Values that must persist use normal properties, not volatile
- [ ] No intermittent bugs from volatile reset behavior

### Related Rules

- Never Rely on Volatile Persistence (05-rules.md)
- Set Volatile Properties in Action Methods (05-rules.md)

### Related Skills

- Secure Sensitive Data with Volatile Properties (06-skills.md)

### Related Decision Trees

- #[Volatile] Property vs Non-Public Property (07-decision-trees.md)

---

## Anti-Pattern 4: Setting Volatile Only in mount()

### Category

Reliability

### Description

Initializing a volatile property's value only in the `mount()` method, expecting it to be available in subsequent AJAX requests.

### Why It Happens

Developers think of `mount()` as the constructor — "I'll set the initial value here." They don't realize that volatile properties reset after every request, so the value from `mount()` is lost after the first render.

### Warning Signs

- Volatile property set in `mount()` but read in an action method
- First use of the component works, subsequent actions fail
- Token generated in `mount()` is empty when the user clicks "submit"
- Value available on initial render, gone on next interaction

### Why Harmful

`mount()` runs only once during the component's lifetime — on initial render. A volatile property set in `mount()` is available for that initial render but is reset to its default before the next request. On subsequent AJAX updates (actions, property updates), the volatile property has its default value, not the value from `mount()`.

### Consequences

- Volatile value available on page load but gone on next action
- Token generated on page load is empty when user clicks submit
- Data set in mount() disappears on any user interaction
- Hard-to-debug — works on initial render, breaks on first action

### Alternative

Set volatile properties inside the action method that uses them, not in `mount()`. If the value is only needed for the initial render, `mount()` is acceptable but rare.

### Refactoring Strategy

1. Identify volatile properties set in `mount()` but used in action methods
2. Move the initialization into the action method that needs the value
3. If the value is needed in multiple actions, regenerate it in each action
4. If the value should persist, use a normal property instead

### Detection Checklist

- [ ] Volatile properties set in action methods, not just `mount()`
- [ ] If set in `mount()`, the value is only used during initial render
- [ ] No volatile property is set in `mount()` and expected in subsequent requests
- [ ] Action methods initialize their own volatile values

### Related Rules

- Set Volatile Properties in Action Methods (05-rules.md)

### Related Skills

- Secure Sensitive Data with Volatile Properties (06-skills.md)

### Related Decision Trees

- #[Volatile] vs Normal Property for Sensitive Data (07-decision-trees.md)

---

## Anti-Pattern 5: Large Intermediate Data Not Marked Volatile

### Category

Performance

### Description

Storing large temporary arrays, processed collections, or intermediate computation results in normal public properties, causing them to be serialized and sent to the frontend in every response.

### Why It Happens

Developers may not consider the serialization cost of large properties. An intermediate array that's 500KB in PHP is 500KB serialized in every snapshot, even though the client never uses it.

### Warning Signs

- `public array $processedReport = []` — large array sent with every response
- Component has 500KB+ of array data visible in the network tab
- Properties hold processed data that is derived from other properties
- Snapshot size is noticeably larger than expected
- Intermediate results are not used in the Blade template

### Why Harmful

Large intermediate data arrays (processed reports, merged datasets, temporary collections) can be hundreds of kilobytes. Without `#[Volatile]`, this data is serialized and sent to the frontend on every re-render, even though the client never uses it. This bloats every AJAX response, slows down network transfers, and wastes bandwidth.

### Consequences

- Bloated snapshot size — 500KB+ of intermediate data in every response
- Slower AJAX responses from large serialized payloads
- Wasted bandwidth — sending data the client never uses
- Memory pressure from serializing large arrays on every request

### Alternative

Mark large intermediate data arrays as `#[Volatile]` to exclude them from serialization. Keep only the final output that the template needs as a normal property.

### Refactoring Strategy

1. Identify large array properties that hold intermediate computation results
2. Apply `#[Volatile]` to these properties
3. Keep only the final rendered output as a normal property
4. Verify snapshot size decreases after marking intermediate data as volatile

### Detection Checklist

- [ ] Large intermediate data arrays are `#[Volatile]`
- [ ] Snapshot size is proportional to UI state, not intermediate data
- [ ] Final rendered output (not intermediate) is in normal properties
- [ ] AJAX payloads are significantly smaller after optimization

### Related Rules

- Use Volatile for Intermediate Computation Results (05-rules.md)

### Related Skills

- Secure Sensitive Data with Volatile Properties (06-skills.md)

### Related Decision Trees

- #[Volatile] vs Separate Service Class for Temporary Data (07-decision-trees.md)

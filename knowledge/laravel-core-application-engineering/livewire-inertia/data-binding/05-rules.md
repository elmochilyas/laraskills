## Rule: Use defer for Most Form Fields

Apply wire:model.defer to the majority of form fields to batch updates into a single action request.

---

## Category

Performance

---

## Rule

Use wire:model.defer on all form fields except those that require real-time feedback (search-as-you-type, dependent dropdowns, live validation). Deferred fields sync their values to the server only when an action is triggered.

---

## Reason

Livewire's default wire:model sends an AJAX request on every keystroke or change event. A typical form with 10 fields generates 10+ unnecessary AJAX requests before the user even clicks submit. .defer stores the value locally and sends it with the next action, reducing AJAX traffic by up to 90%.

---

## Bad Example

`lade
<input wire:model="name">
<input wire:model="email">
<input wire:model="password">
{{-- Each field sends AJAX on every change --}}
`

---

## Good Example

`lade
<input wire:model.defer="name">
<input wire:model.defer="email">
<input wire:model.defer="password">
{{-- Values sent only when save action is called --}}
`

---

## Exceptions

Fields that need real-time server interaction (search autocomplete, dependent dropdowns, live validation feedback) should NOT use .defer. Use .debounce instead.

---

## Consequences Of Violation

Performance risks: excessive AJAX requests on every form field change. Server load: unnecessary processing for non-urgent updates.

---

## Rule: Debounce Search and Real-Time Fields

Apply wire:model.debounce.300ms to search fields and any field that triggers a server-side query on each update.

---

## Category

Performance

---

## Rule

For fields that trigger database queries or API calls in their updated hook (search, filters, auto-complete), add .debounce.300ms (or longer) to wire:model. Never use the default (no debounce) for fields with expensive side effects.

---

## Reason

Without debounce, a search field with updatedSearch() that queries the database fires a query on every keystroke. A fast typist produces 5-10 queries per second. Debounce coalesces rapid changes into a single query after the user stops typing, reducing database load proportionally.

---

## Bad Example

`lade
<input wire:model="search">
{{-- 10 queries/second while typing fast --}}
`

---

## Good Example

`lade
<input wire:model.debounce.300ms="search">
{{-- One query 300ms after user stops typing --}}
`

---

## Exceptions

Fields with cheap side effects (simple string manipulation, client-side filtering) do not need debounce. Only debounce when the updated hook performs database queries, API calls, or expensive computations.

---

## Consequences Of Violation

Performance risks: excessive database queries per keystroke. Scalability risks: database overwhelmed during peak typing periods.

---

## Rule: Use number for Numeric Inputs

Apply .number modifier to every wire:model bound to a numeric PHP property.

---

## Category

Reliability

---

## Rule

Add .number to wire:model on <input type="number"> or any field whose PHP property type is int or loat. This ensures the value arrives in PHP as a number, not a string.

---

## Reason

HTML input values are always strings. Without .number, Livewire sends the string "42" to a property typed as int . PHP 8+ with strict types rejects this string-to-int assignment, causing a type error. .number casts the value using + before sending, preserving the correct type.

---

## Bad Example

`php
public int  = 0; // int type
`

`lade
<input type="number" wire:model="age">
{{-- Sends string "25" — type error on integer property --}}
`

---

## Good Example

`php
public int  = 0;
`

`lade
<input type="number" wire:model.number="age">
{{-- Sends number 25 — type matches --}}
`

---

## Exceptions

String properties that happen to contain numeric values do not need .number. The rule applies only when the PHP property type is int or loat.

---

## Consequences Of Violation

Reliability risks: type errors on integer properties. Runtime errors: strict types reject string-to-int assignment.

---

## Rule: Use boolean for Checkboxes

Apply .boolean modifier to every wire:model on a checkbox input.

---

## Category

Reliability

---

## Rule

Add .boolean to wire:model on all <input type="checkbox"> elements. This ensures the value arrives in PHP as 	rue or alse, not as the string "on" or 
ull.

---

## Reason

Checkbox values in HTML are either the string "on" (checked) or omitted entirely (unchecked). Without .boolean, Livewire sets the property to the string "on" when checked. With .boolean, Livewire uses ilter_var(, FILTER_VALIDATE_BOOLEAN) to cast to a proper boolean.

---

## Bad Example

`php
public bool  = false;
`

`lade
<input type="checkbox" wire:model="isActive">
{{-- Sets isActive to "on" (string) instead of true (bool) --}}
`

---

## Good Example

`php
public bool  = false;
`

`lade
<input type="checkbox" wire:model.boolean="isActive">
{{-- Sets isActive to true (bool) when checked --}}
`

---

## Exceptions

If the PHP property is typed as string or mixed, .boolean is optional. For boolean-typed properties, it is required.

---

## Consequences Of Violation

Reliability risks: boolean property holds string "on" instead of true. Logic errors: if () evaluates differently for string vs boolean.

---

## Rule: Never Bind wire:model to Computed Properties

Computed properties marked with #[Computed] are read-only and cannot be used with wire:model.

---

## Category

Framework Usage

---

## Rule

Only bind wire:model to public properties that store mutable state. Do not apply wire:model to methods or properties with the #[Computed] attribute.

---

## Reason

#[Computed] properties are read-only derived values that are cached within a single request. They have no setter — Livewire cannot update them when the user changes the input. Binding wire:model to a computed property silently fails: the input changes client-side, but the property never updates server-side.

---

## Bad Example

`php
#[Computed]
public function fullName(): string
{
    return ->firstName . ' ' . ->lastName;
}
`

`lade
<input wire:model="fullName"> {{-- Silently fails --}}
`

---

## Good Example

`php
public string  = '';
public string  = '';
`

`lade
<input wire:model="firstName">
<input wire:model="lastName">
`

---

## Exceptions

None. Computed properties are read-only by design. If you need wire:model access, use a regular public property.

---

## Consequences Of Violation

Reliability risks: wire:model silently fails on computed properties. Debugging difficulty: no error message, developer must trace the binding.

---

## Rule: Keep updated Hooks Lightweight

Ensure updated hooks for frequently-changing properties (search, sliders, toggles) are fast enough to run on every change.

---

## Category

Performance

---

## Rule

If an updated hook performs a database query, API call, or expensive computation, debounce the field with .debounce or use .lazy to reduce call frequency. If the side effect is cheap (string manipulation, filtering an in-memory array), no debounce is needed.

---

## Reason

The updated hook fires on every request that changes the property. For a debounced search field, this is once per debounce interval. For a slider or toggle without debounce, this is on every position change. Expensive operations in updated without debounce cause slow responses for every interaction.

---

## Bad Example

`php
public function updatedSlider(int ): void
{
    ->results = ->queryDatabase(); // Expensive query on every tick
}
`

---

## Good Example

`php
public function updatedSlider(int ): void
{
    ->results = ->filterInMemory(); // Cheap — no query
}
`

---

## Exceptions

If updated must perform an expensive operation (e.g., a complex validation rule that requires a DB lookup), debounce the input to reduce call frequency to an acceptable rate.

---

## Consequences Of Violation

Performance risks: slow responses for every property update. Scalability risks: database queries on every input change.

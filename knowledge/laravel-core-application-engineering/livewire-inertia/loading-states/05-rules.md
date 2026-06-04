## Rule: Always Scope Loading States with wire:target

Every wire:loading directive must be paired with a wire:target that specifies the action or property it responds to.

---

## Category

UX

---

## Rule

Add wire:target="actionName" or wire:target="propertyName" to all wire:loading elements. Never use wire:loading without wire:target unless the loading indicator should appear for absolutely every interaction on the component.

---

## Reason

A wire:loading without wire:target shows the loading indicator for ANY component interaction — clicking any button, changing any field, triggering any event. This creates confusing, flickering loading states across the entire component when only a small action is processing.

---

## Bad Example

`lade
<div wire:loading>Saving...</div>
{{-- Shows for EVERY interaction — button click, input change, etc. --}}
`

---

## Good Example

`lade
<div wire:loading wire:target="save">Saving...</div>
{{-- Shows only when the 'save' action is processing --}}
`

---

## Exceptions

A full-page loading overlay that should appear for any component interaction may use wire:loading without wire:target. This is appropriate only for simple single-purpose components.

---

## Consequences Of Violation

UX: confusing loading indicators on unrelated actions. Visual noise: loading states flicker for trivial interactions.

---

## Rule: Disable Submit Buttons During Processing

Use wire:loading.attr="disabled" on submit buttons to prevent double-clicks.

---

## Category

UX

---

## Rule

Add wire:loading.attr="disabled" to every button that triggers a server action. Combine with a visual loading indicator (spinner, "Saving..." text) inside the button.

---

## Reason

Without disabling during processing, users can click a submit button multiple times before the first request completes. Each click triggers a separate server call, potentially creating duplicate records, sending duplicate emails, or causing race conditions.

---

## Bad Example

`lade
<button wire:click="save">Save</button>
{{-- Clickable multiple times — double-submit risk --}}
`

---

## Good Example

`lade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>Saving...</span>
</button>
`

---

## Exceptions

Actions that complete in under 100ms (e.g., toggling a boolean) may omit the disabled attribute if the server response is fast enough to prevent practical double-clicks.

---

## Consequences Of Violation

Data integrity risks: duplicate records created. Reliability risks: race conditions from concurrent submissions.

---

## Rule: Use .remove for Text Content

Use wire:loading.remove on normal text and show loading-specific text in a sibling wire:loading element.

---

## Category

UX

---

## Rule

Place button text inside a <span wire:loading.remove> and the loading indicator inside a <span wire:loading>. This replaces the text with the indicator during processing rather than overlaying them.

---

## Reason

Without .remove, the normal button text and the loading text are both visible during processing. The loading element is shown on top of the normal text, resulting in overlapping, unreadable button content. .remove ensures only the loading state is visible.

---

## Bad Example

`lade
<button wire:click="save">
    Save
    <span wire:loading>...</span>
    {{-- "Save ..." both visible — overlapping text --}}
</button>
`

---

## Good Example

`lade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>
        <svg class="spinner" ...></svg> Saving...
    </span>
</button>
`

---

## Exceptions

When the loading indicator is positioned outside the button (e.g., a "Saving..." message below the form), .remove on the button text is unnecessary because the elements do not overlap.

---

## Consequences Of Violation

UX: overlapping text, unreadable button content during loading. Visual confusion: user cannot tell what the button does.

---

## Rule: Keep Loading Indicators Near the Trigger

Place loading indicators adjacent to the element that triggered the action.

---

## Category

UX

---

## Rule

Position the wire:loading element immediately next to (or inside) the button, link, or input that triggered the server interaction. Do not place it at the top of the page, in a different section, or far from the trigger.

---

## Reason

Users associate visual feedback with the action they just performed. A loading spinner at the top of the page provides no context about which action is being processed. Placing the indicator near the trigger creates an obvious causal connection.

---

## Bad Example

`lade
<div wire:loading wire:target="save" class="top-banner">
    Saving...  {{-- Far from the Save button --}}
</div>
<button wire:click="save">Save</button>
`

---

## Good Example

`lade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>
        <svg class="spinner" ...></svg> Saving...
    </span>
</button>
`

---

## Exceptions

Global loading indicators (progress bars at the top of the page) may be placed in the layout for overall navigation loading. Per-action indicators must still be near the trigger.

---

## Consequences Of Violation

UX: user cannot tell which action triggered the loading state. Confusion: multiple loading indicators with ambiguous targets.

---

## Rule: Show Specific Loading Text

Use descriptive loading text ("Saving post...", "Deleting user...") rather than generic "Loading...".

---

## Category

UX

---

## Rule

Customize the loading text to describe the specific action being performed. Use the action name as a hint: "Saving", "Deleting", "Updating", "Searching". Append the subject if helpful: "Deleting user 3 of 5".

---

## Reason

Generic "Loading..." provides no information about what is happening. Users cannot tell if the action is saving, searching, or processing. Specific text builds trust by showing the user exactly what the system is doing.

---

## Bad Example

`lade
<span wire:loading wire:target="save">Loading...</span>
`

---

## Good Example

`lade
<span wire:loading wire:target="save">Saving post...</span>
`

---

## Exceptions

For very fast actions (<300ms), the loading text may not be visible long enough to read. In these cases, a simple icon change (button dimming, spinner) is sufficient.

---

## Consequences Of Violation

UX: user is uncertain what the system is doing. Trust: vague feedback reduces confidence in the application.

---

## Rule: Test Loading States with Slow Network

Verify all loading states render correctly by simulating slow network conditions.

---

## Category

Testing

---

## Rule

During development and QA, use browser DevTools to simulate "Slow 3G" network throttling. Verify that each wire:loading indicator appears at the correct time, for the correct target, and that it disappears when the action completes.

---

## Reason

On fast local networks, loading states flash on and off in under 50ms and are invisible to developers. Users on slow connections (mobile, rural, congested networks) see these loading states for seconds. Without testing, indicators may be missing, mis-targeted, or broken in slow scenarios.

---

## Bad Example

`php
// Developed on localhost with <10ms response times
// Loading states never actually seen during development
`

---

## Good Example

`php
// Tested with DevTools "Slow 3G" throttling
// Loading states verified: visible, correctly targeted, properly styled
`

---

## Exceptions

For offline-capable components that do not require server interaction, loading states are irrelevant. For all server-interactive components, slow-network testing is required.

---

## Consequences Of Violation

UX: loading states invisible, mis-targeted, or broken for real-world users. Accessibility: users on slow connections see no feedback during long operations.

# Livewire Loading States — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Loading States |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Loading Indicator Without wire:target
2. Button Not Disabled During Processing
3. Missing .remove on Button Text
4. Loading Indicator Far from Trigger
5. Generic "Loading..." Text

---

## Repository-Wide Anti-Patterns

- **Loading state for sub-100ms actions**: Loading flash is distracting — use CSS transition delay or skip.
- **All-or-nothing loading**: Entire page dims for a small action — too aggressive.
- **No loading state at all**: User clicks and nothing visibly happens — thinks app is broken.
- **CSS spinner without font/package**: Using font-awesome spinner class without loading the font.

---

## Anti-Pattern 1: Loading Indicator Without wire:target

### Category

UX

### Description

Using `wire:loading` without a `wire:target` attribute, causing the loading indicator to appear for ANY component interaction, not just the intended action.

### Why It Happens

The simplest form of `wire:loading` works without a target. Developers add it to show a spinner and don't realize it responds to every interaction on the component.

### Warning Signs

- `<div wire:loading>Saving...</div>` with no `wire:target`
- Loading indicator appears when any field changes or any button is clicked
- Spinner flickers for trivial interactions (typing in a search field)
- Loading state triggers for unrelated actions on the same component

### Why Harmful

Without `wire:target`, the loading indicator shows for ANY component interaction — clicking any button, changing any field, triggering any event. This creates confusing flickering loading states across the entire component. The user sees a "Saving..." indicator when they click a "Cancel" button, or a spinner when they type in a search field.

### Consequences

- Confusing loading indicators on unrelated actions
- Flickering spinners for trivial interactions
- User cannot tell which action triggered the loading state
- Visual noise — loading states appear for every keystroke

### Alternative

Always pair `wire:loading` with `wire:target` to scope the loading state to the specific action or property that triggers it.

### Refactoring Strategy

1. Identify all `wire:loading` elements without `wire:target`
2. Add `wire:target="actionName"` for each, matching the trigger action
3. For submit buttons, target the action: `wire:target="save"`
4. For search, target the property: `wire:target="search"`
5. Verify that loading states only show for the intended interactions

### Detection Checklist

- [ ] Every `wire:loading` has a corresponding `wire:target`
- [ ] Loading indicator only appears for the intended action
- [ ] Unrelated actions do not trigger the loading indicator
- [ ] Loading state provides accurate feedback for the specific operation

### Related Rules

- Always Scope Loading States with wire:target (05-rules.md)

### Related Skills

- Implement User-Friendly Loading States (06-skills.md)

### Related Decision Trees

- wire:loading with Target vs Without Target for Feedback (07-decision-trees.md)

---

## Anti-Pattern 2: Button Not Disabled During Processing

### Category

UX

### Description

A submit button that remains clickable while the server action is processing, allowing double-submission of the form.

### Why It Happens

It's an easy detail to overlook. The button works fine for single clicks — the developer never tests double-clicks. The double-submit issue only surfaces under slow network conditions or when impatient users click repeatedly.

### Warning Signs

- Button has `wire:click="save"` but no `wire:loading.attr="disabled"`
- User can click the button multiple times while the first action is processing
- Duplicate records created from rapid button clicks
- Form submits multiple times

### Why Harmful

Without disabling during processing, users can click a submit button multiple times before the first request completes. Each click triggers a separate server call, potentially creating duplicate records, sending duplicate emails, or causing race conditions. Impatient users or slow networks amplify this risk.

### Consequences

- Double-submit creates duplicate records
- Multiple emails sent to the user
- Race conditions from concurrent submissions
- Data integrity issues from overlapping writes

### Alternative

Add `wire:loading.attr="disabled"` to every button that triggers a server action. Combine with a visual loading indicator to show the button is disabled.

### Refactoring Strategy

1. Identify all buttons with `wire:click` but no disabled state
2. Add `wire:loading.attr="disabled"` to each button
3. Add a loading indicator (spinner + "Saving...") visible during processing
4. Verify that rapid clicks only trigger one server action

### Detection Checklist

- [ ] Every submit button has `wire:loading.attr="disabled"`
- [ ] Button visually dims or shows a disabled cursor during processing
- [ ] Rapid clicks do not trigger multiple server actions
- [ ] Loading indicator appears alongside the disabled state

### Related Rules

- Disable Submit Buttons During Processing (05-rules.md)

### Related Skills

- Implement User-Friendly Loading States (06-skills.md)

### Related Decision Trees

- wire:loading Element Toggle vs wire:loading.attr Disabled for Buttons (07-decision-trees.md)

---

## Anti-Pattern 3: Missing .remove on Button Text

### Category

UX

### Description

Not using `wire:loading.remove` on the button's normal text, causing the regular text and loading indicator to overlap and become unreadable during processing.

### Why It Happens

Developers add a loading span inside the button but don't hide the default text. Both elements are visible simultaneously, creating overlapping, unreadable content.

### Warning Signs

- Button shows "Save Saving..." during processing — both texts visible
- Loading spinner overlaps with button text
- Button content looks jumbled during loading
- Default text remains visible while loading indicator shows

### Why Harmful

Without `.remove`, the normal button text and the loading text are both visible during processing. The loading element is shown on top of the normal text, resulting in overlapping, unreadable button content. The user sees garbled text like "SavSaving..." and can't read the button.

### Consequences

- Overlapping text — "Save" and "Saving..." both visible simultaneously
- Button becomes unreadable during loading
- User cannot tell what action is being processed
- Visual confusion — button content appears broken

### Alternative

Wrap the normal button text in `<span wire:loading.remove>` to hide it during processing, and show the loading text in a sibling `<span wire:loading>`.

### Refactoring Strategy

1. Identify buttons with loading indicators but no `.remove` on default text
2. Wrap default text: `<span wire:loading.remove>Save</span>`
3. Ensure loading text is in a separate element: `<span wire:loading>Saving...</span>`
4. Verify that only one set of text is visible at a time

### Detection Checklist

- [ ] Default button text has `wire:loading.remove`
- [ ] Loading text has `wire:loading` (shown during processing)
- [ ] Only one set of text is visible at any time
- [ ] No overlapping or garbled text during loading

### Related Rules

- Use .remove for Text Content (05-rules.md)

### Related Skills

- Implement User-Friendly Loading States (06-skills.md)

### Related Decision Trees

- wire:loading Element Toggle vs wire:loading.attr Disabled for Buttons (07-decision-trees.md)

---

## Anti-Pattern 4: Loading Indicator Far from Trigger

### Category

UX

### Description

Placing the loading indicator in a different part of the page from the action trigger, making it hard for the user to associate feedback with their action.

### Why It Happens

Developers place a single "global" loading indicator in the page layout or at the top of the component. It works technically but provides poor UX.

### Warning Signs

- "Saving..." message appears at the top of the page when the Save button is at the bottom
- Loading spinner in the page header unrelated to the form below
- User must scan the page to find the loading feedback
- Loading indicator is visually disconnected from the triggered action

### Why Harmful

Users associate visual feedback with the action they just performed. A loading spinner at the top of the page provides no context about which action is being processed. The user may wonder "what is happening?" or "did my click do anything?" Placing the indicator near the trigger creates an obvious causal connection.

### Consequences

- User cannot tell which action triggered the loading state
- Multiple buttons on the same component provide ambiguous feedback
- Users may click again, thinking nothing happened
- Poor UX — feedback is disconnected from interaction

### Alternative

Position the loading indicator inside or immediately adjacent to the trigger element. For buttons, place it inside the button. For searches, place it next to the input.

### Refactoring Strategy

1. Identify loading indicators placed far from their triggers
2. Move indicators inside the button or immediately next to the trigger
3. Use `wire:target` to scope the indicator to the specific action
4. Verify that the loading state is clearly associated with the correct trigger

### Detection Checklist

- [ ] Loading indicators are inside buttons or adjacent to triggers
- [ ] User can immediately identify which action triggered the loading state
- [ ] No global loading indicators for per-action feedback
- [ ] Feedback is visually tied to the cause

### Related Rules

- Keep Loading Indicators Near the Trigger (05-rules.md)

### Related Skills

- Implement User-Friendly Loading States (06-skills.md)

### Related Decision Trees

- wire:loading with Target vs Without Target for Feedback (07-decision-trees.md)

---

## Anti-Pattern 5: Generic "Loading..." Text

### Category

UX

### Description

Using generic "Loading..." as the loading text for all actions instead of specific text like "Saving...", "Deleting...", or "Searching...".

### Why It Happens

It's the default text that comes to mind. Developers use it as a placeholder and don't customize it for each action.

### Warning Signs

- All buttons show "Loading..." during processing
- User cannot distinguish between saving, searching, and deleting
- Loading text is identical for different actions
- No action-specific feedback

### Why Harmful

Generic "Loading..." provides no information about what is happening. Users cannot tell if the action is saving, searching, or processing. They may navigate away during a "Loading..." save operation, losing their data. Specific text builds trust by showing the user exactly what the system is doing.

### Consequences

- User uncertain what the system is doing
- May navigate away during a save (thinks it's just refreshing)
- Reduced trust — vague feedback feels unprofessional
- Accessibility concerns — screen readers announce "Loading" with no context

### Alternative

Customize the loading text to describe the specific action: "Saving post...", "Deleting user...", "Searching...", "Updating settings...".

### Refactoring Strategy

1. Audit all loading text for generic "Loading..." occurrences
2. Replace each with action-specific text: `wire:loading wire:target="save"` → "Saving..."
3. For actions with context, include the subject: "Deleting user 3 of 5"
4. Verify that the loading text accurately describes the action

### Detection Checklist

- [ ] No generic "Loading..." text in loading indicators
- [ ] Loading text describes the specific action ("Saving...", "Deleting...")
- [ ] Context-specific text includes the subject where appropriate
- [ ] User can tell what operation is happening from the loading text

### Related Rules

- Show Specific Loading Text (05-rules.md)

### Related Skills

- Implement User-Friendly Loading States (06-skills.md)

### Related Decision Trees

- wire:loading Element Toggle vs wire:loading.attr Disabled for Buttons (07-decision-trees.md)

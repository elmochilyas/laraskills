# Real Time Input Validation — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | real-time-input-validation |

## Skills

### Skill: Implement Livewire Real-Time Field Validation
- **Description:** Validate individual fields in a Livewire component as the user types.
- **Steps:**
  1. Define public properties for each form field in the Livewire component
  2. Add `updated($propertyName)` method that validates the changed field
  3. Use `$this->validateOnly($propertyName, $rules)` for single-field validation
  4. Display errors using `@error('field')` in Blade
- **Context:** The `updated` hook fires on each property change; use `.debounce` modifier to control frequency.

### Skill: Configure Debounce Timing
- **Description:** Set appropriate debounce timing for different validation scenarios.
- **Steps:**
  1. For format validation: `wire:model.debounce.300ms` — fast, frequent checks
  2. For DB validation: `wire:model.debounce.500ms` — wait for user to pause typing
  3. For external API validation: `wire:model.debounce.1000ms` — minimize external calls
  4. Use `wire:model.blur` for on-blur validation instead of debounce
- **Context:** `.blur` validates only when the field loses focus, ideal for non-interactive validation feedback.

### Skill: Combine Client-Side and Server-Side Validation
- **Description:** Layer client-side format checks on top of server-side authoritative checks.
- **Steps:**
  1. Implement client-side validation using AlpineJS for instant format feedback
  2. Add Livewire `updated` hook for server-side real-time checks
  3. Keep submit-time server validation as the authoritative layer
  4. Disable submit button until all layers pass
- **Context:** Client-side validation is purely UX — server validation is the security boundary.

### Skill: Handle Real-Time Unique Validation
- **Description:** Check uniqueness of a field (email, username) in real-time without exposing existing records.
- **Steps:**
  1. Use Livewire `updated` hook with debounce 500ms
  2. Validate with `unique:table,column` rule
  3. Return a generic "already taken" message — don't reveal if it matches a specific user
  4. Cache uniqueness results briefly to reduce duplicate queries
- **Context:** Unique validation reveals whether a value exists in the database — use rate limiting to prevent enumeration.

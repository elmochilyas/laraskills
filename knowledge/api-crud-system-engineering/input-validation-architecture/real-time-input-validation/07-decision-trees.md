# Decision Trees — Real Time Input Validation

## Tree 1: Server-Side vs Client-Side Real-Time Validation

**Decision Context**: Where to perform real-time validation (as the user types/submits).

**Decision Criteria**:
- Latency sensitivity
- Offline capability requirement
- Complexity of validation rules

**Decision Tree**:
```
Does the validation check exist purely on the client side (format, character limits)?
├── YES → Use client-side only with Livewire AlpineJS or JavaScript — instant feedback, no round-trip
└── NO → Does the validation involve server-side data (unique email, exists in DB)?
    ├── YES → Use Livewire real-time validation — server round-trip with debounce
    └── NO → Is offline functionality required?
        ├── YES → Implement client-side validation with sync fallback rules — validate locally first
        └── NO → Use server-side validation on submit — standard HTTP POST with error response
```

**Rationale**: Client-side for instant format checks. Server-side for DB-dependent checks. Livewire for SPA-like real-time validation with server data.

**Recommended Default**: Client-side format validation + server-side validation on submit for standard forms.

**Risks**: Client-side only is bypassable. Server-side only for every keystroke is excessive. Livewire with short debounce causes excessive server requests.

---

## Tree 2: Debounce Strategy

**Decision Context**: Setting the debounce time for real-time validation inputs.

**Decision Criteria**:
- Validation complexity
- Database query volume
- User typing speed

**Decision Tree**:
```
Does the validation require a database query (unique, exists)?
├── YES → Set debounce: 500-750ms — slow enough to reduce queries, fast enough for perceived speed
└── NO → Does the validation involve a simple format check (email format, min length)?
    ├── YES → Set debounce: 150-300ms — fast feedback, low cost per check
    └── NO → Does the validation involve an external API call?
        ├── YES → Set debounce: 1000ms+ — external API calls are expensive; batch and cache
        └── NO → Set debounce: 350ms — general purpose, balances feedback speed and request volume
```

**Rationale**: Longer debounce for expensive operations. Shorter debounce for simple checks.

**Recommended Default**: 350ms for most cases. 500ms for DB-backed validation.

**Risks**: Too-short debounce causes excessive requests. Too-long debounce feels unresponsive.

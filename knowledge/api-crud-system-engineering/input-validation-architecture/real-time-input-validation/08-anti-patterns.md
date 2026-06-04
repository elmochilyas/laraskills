# Real Time Input Validation — Anti-Patterns

## Client-Side Only Validation
**Description:** Implementing validation solely in JavaScript without server-side enforcement.
**Why it happens:** Developers prioritize UX speed and assume clients won't bypass checks.
**Consequences:** Malicious users bypass client-side validation and submit invalid data; data integrity breaks.
**Better approach:** Client-side for UX only. Always validate server-side on submit.

## Server-Side Validation on Every Keystroke
**Description:** Sending a validation request to the server on every keystroke without debounce.
**Why it happens:** Developers want "instant" validation and don't consider server load.
**Consequences:** Hundreds of requests per field per minute; server overload; degraded UX from request queuing.
**Better approach:** Use debounce (500ms+) or `.blur` trigger for server-side checks.

## Revealing Database State Through Validation Messages
**Description:** Using distinct error messages for "email exists" vs "email not found" in uniqueness checks.
**Why it happens:** Developers think helpful messages improve UX.
**Consequences:** Attackers enumerate valid emails/usernames by observing which values return the "taken" message.
**Better approach:** Use a single generic message: "This value is already taken." Apply rate limiting to uniqueness checks.

## No Submit-Time Validation Fallback
**Description:** Relying on real-time validation and skipping full validation on submit.
**Why it happens:** Developers assume real-time checks are sufficient and submit-time validation is redundant.
**Consequences:** Race conditions — data changes between real-time check and submission; bypassed checks if JavaScript fails.
**Better approach:** Always re-validate all fields server-side on submission regardless of prior real-time results.

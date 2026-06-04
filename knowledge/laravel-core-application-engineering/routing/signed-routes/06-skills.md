# Skill: Generate and Validate Signed Routes for Unauthenticated Access

## Purpose

Generate signed URLs using `URL::signedRoute()` and validate them with the `signed` middleware, providing URL-level integrity verification for actions that need to be accessed without authentication — email verification, unsubscribe links, and invitation links.

## When To Use

- Email verification links
- Password reset links
- Unsubscribe links
- One-time action links (confirm deletion, approve action)
- Invitation links
- Public links that must be verified at access time

## When NOT To Use

- Authenticated routes (use CSRF and session-based auth instead)
- API endpoints with API tokens (use token-based auth)
- Routes that should be bookmarkable without expiration
- Routes where the signature exposes sensitive data in the URL

## Prerequisites

- Application `APP_KEY` configured (signing key)
- Route defined with a name (for URL generation)
- `signed` middleware available in HTTP kernel

## Inputs

- Route name for URL generation
- Route parameters (model IDs, hashes)
- Expiration time (for temporary URLs)
- Route handler logic

## Workflow

1. Define the route with the `signed` middleware: `Route::get('/verify/{id}', ...)->middleware('signed')->name('verify')`
2. Generate a signed URL: `URL::signedRoute('verify', ['id' => $user->id])`
3. For time-sensitive actions, use `URL::temporarySignedRoute('verify', now()->addHours(24), ['id' => $user->id])`
4. Use opaque identifiers in parameters — not sensitive data like emails or tokens
5. In the route handler, validate that the referenced resource still exists
6. For one-time actions, track consumption server-side
7. Use dedicated routes for signed actions — do not share with authenticated endpoints

## Validation Checklist

- [ ] Route has `signed` middleware applied
- [ ] Temporary signed routes used for user-facing links (not permanent)
- [ ] Parameters use opaque identifiers (model IDs, UUIDs), not sensitive data
- [ ] Route handler validates resource existence after signature validation
- [ ] Signed routes are separate from authenticated routes
- [ ] One-time actions track consumption server-side
- [ ] Invalid/expired signatures return 403

## Common Failures

### Not expiring signed URLs
Using `signedRoute()` instead of `temporarySignedRoute()` for time-sensitive actions makes URLs valid indefinitely. Always add expiration.

### Sharing signed routes with authenticated access
A single route shared between signed and authenticated access creates security model ambiguity. Define separate routes.

### Not validating parameters after signature
A valid signature only proves the URL wasn't tampered with — not that the resource exists or the action is still applicable. Always validate independently.

## Decision Points

### Permanent vs Temporary?
Temporary for all user-facing links (verification, unsubscribe, invitations). Permanent only for rare cases like public resource download links.

### Separate route vs shared route?
Always separate. Signed routes bypass session auth — sharing creates ambiguity about which security model applies.

## Performance Considerations

- Signature generation and validation use HMAC-SHA256 — <0.1ms overhead
- Validation runs once per request as middleware
- No database query for signature validation (only for parameter resolution)

## Security Considerations

- Signed URL security depends entirely on `APP_KEY` secrecy — protect it
- Signatures are visible in URL query strings — avoid sensitive parameters
- Permanent signed URLs can be replayed indefinitely — use temporary for user-facing links
- Changing `APP_KEY` invalidates ALL existing signed URLs
- The `signature` query parameter name is reserved — don't use it for other purposes

## Related Rules

- Use Temporary Signed Routes for User-Facing Links
- Define Separate Routes for Signed Actions
- Enforce Server-Side Consumption Tracking for One-Time URLs
- Validate Parameters After Signature Validation
- Never Expose Sensitive Data in Signed URL Parameters

## Related Skills

- Implement One-Time Temporary Signed URLs with Consumption Tracking
- Name Routes and Generate URLs from Named Routes
- Define Application Routes

## Success Criteria

- Signed URLs with `signed` middleware return 403 for tampered parameters
- Temporary signed URLs expire after the specified time
- Resource existence is validated after signature passes
- Signed routes are separate from authenticated routes
- No sensitive data exposed in signed URL parameters

---

# Skill: Implement One-Time Temporary Signed URLs with Consumption Tracking

## Purpose

Generate expiring signed URLs for one-time actions (email verification, password reset, confirm delete) and track consumption server-side so that each URL can only be used once, preventing replay attacks within the signature validity window.

## When To Use

- Email verification links (one-time use per user)
- Password reset links (one-time use per request)
- Confirm-delete or confirm-action links
- Any action that should only be executed once

## When NOT To Use

- Non-consumable actions (public document links, resource downloads)
- Actions where repeated access is acceptable (view public content)
- Routes where the action is idempotent (viewing a shared resource)

## Prerequisites

- Temporary signed route configured with `signed` middleware
- Database column or field to track consumption status
- Route name and parameters for URL generation

## Inputs

- Route name for signed URL generation
- Parameters identifying the resource
- Expiration time
- Consumption tracking field (e.g., `email_verified_at`, `consumed_at`)

## Workflow

1. Define the route with `signed` middleware: `Route::get('/verify-email/{user}', ...)->middleware('signed')->name('verification.verify')`
2. Generate the temporary signed URL: `URL::temporarySignedRoute('verification.verify', now()->addHours(24), ['user' => $user->id])`
3. In the route handler, check if the action was already completed: `if ($user->hasVerifiedEmail()) { return redirect('/already-verified'); }`
4. Execute the action (e.g., mark email as verified)
5. Optionally, redirect the user to a confirmation page
6. Test that replaying the same signed URL after consumption returns a rejection (redirect or message)
7. Verify that expired URLs return 403

## Validation Checklist

- [ ] Route uses `signed` middleware
- [ ] `temporarySignedRoute()` used with explicit expiration
- [ ] Server-side consumption check before executing the action
- [ ] Consumed resources reject replays gracefully (not 500)
- [ ] Expired URLs return 403
- [ ] Parameters use opaque identifiers (not sensitive data)
- [ ] Consumption is recorded atomically (database transaction if applicable)

## Common Failures

### No consumption check
Without a check, the signed URL can be used multiple times within the validity window. Always verify the action hasn't already been completed.

### Not handling already-consumed state
When the URL is replayed, the handler must detect the consumed state and return a user-friendly response, not an error.

### Using permanent URLs
Permanent URLs can be replayed indefinitely. Always use `temporarySignedRoute()` for one-time actions.

## Decision Points

### Check before or after signature validation?
Both — the `signed` middleware validates integrity first, then the handler validates consumption state.

### Track consumption with timestamp or boolean?
A timestamp (`email_verified_at`, `consumed_at`) provides more information than a boolean and enables audit trails.

## Performance Considerations

- Additional database query to check consumption status (negligible)
- Cache the consumption status for frequently checked resources (optional)
- Signature validation is O(1) — no database involved

## Security Considerations

- Temporary signed URLs prevent replay after expiration but not within the validity window
- Server-side consumption tracking prevents replay within the validity window
- Consumption check must happen before the action, not after confirmation
- Use database transactions for consumption + action to prevent race conditions
- The consumption check should be idempotent — checking twice doesn't change the result

## Related Rules

- Enforce Server-Side Consumption Tracking for One-Time URLs
- Use Temporary Signed Routes for User-Facing Links
- Validate Parameters After Signature Validation
- Define Separate Routes for Signed Actions

## Related Skills

- Generate and Validate Signed Routes for Unauthenticated Access
- Name Routes and Generate URLs from Named Routes
- Define Application Routes

## Success Criteria

- One-time signed URLs can only be used once
- Replayed URLs return a user-friendly response (redirect with message)
- Expired URLs return 403
- Consumption is tracked with a timestamp in the database
- The action is executed atomically with consumption marking

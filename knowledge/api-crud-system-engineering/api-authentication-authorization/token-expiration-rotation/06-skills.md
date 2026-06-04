# Skill: Implement Token Expiration and Rotation

## Purpose
Configure Sanctum token expiration durations, implement token rotation on sensitive actions (password change), build refresh endpoints, and clean expired tokens via Sanctum's garbage collection.

## When To Use
- API token management with security requirements
- Token lifecycle automation
- Security-sensitive actions requiring re-authentication

## When NOT To Use
- Short-lived tokens that expire in minutes (use JWT instead)
- Internal-only services with fixed tokens (API keys)

## Prerequisites
- Sanctum token auth implementation
- Token ability design

## Inputs
- Token expiration configuration per token purpose
- Sensitive actions list requiring token rotation

## Workflow
1. Set default token expiration in `config/sanctum.php`: `'expiration' => 60 * 24` (1 day)
2. Create long-lived tokens explicitly without expiration: `$user->createToken('api-key', ['*'])->plainTextToken` — omit `expires_at` for no expiration
3. Create short-lived tokens with `expires_at`: `$user->createToken('session', ['read'], now()->addHour())`
4. Implement token rotation on password change: delete all user tokens, issue new ones
5. Implement token rotation on sensitive actions: `$user->tokens()->where('id', '!=', $currentTokenId)->delete()`
6. Add refresh endpoint: validate refresh token or re-authenticate, issue new token, delete old
7. Clean expired tokens with Sanctum's `sanctum:prune-expired` Artisan command on schedule
8. Check token expiration in middleware or authorization — Sanctum handles automatically
9. Log token creation and revocation for security audit
10. Notify user on new token creation or password change for suspicious activity

## Validation Checklist
- [ ] Default token expiration set in config
- [ ] Long-lived tokens created without expiration
- [ ] Short-lived tokens with expires_at parameter
- [ ] Token rotation on password change implemented
- [ ] Token rotation on sensitive actions implemented
- [ ] Refresh endpoint implemented or not needed
- [ ] `sanctum:prune-expired` scheduled in Kernel
- [ ] Token creation and revocation logged
- [ ] User notified on suspicious token activity
- [ ] Tests verify token expiry and rotation behavior

## Common Failures
- Setting no expiration — tokens valid indefinitely, security risk if leaked
- Rotation on password change but not on email change — inconsistent
- Forgetting to prune expired tokens — DB accumulates stale records
- Refresh endpoint without proper auth — anyone can refresh expired tokens
- User not notified on new token — potentially malicious token creation unknown

## Decision Points
- Rotation on password change — rotate all tokens vs current only — all for security, current for convenience
- Refresh token model — re-authenticate for refresh vs long-lived refresh + short-lived access
- Notification on token creation — email for critical, log for standard

## Performance Considerations
- Token expiration check is O(1) — timestamp comparison
- Token rotation adds DB writes on each rotation event
- `sanctum:prune-expired` should run hourly/daily — not per-request
- Token count per user affects login/rotation queries — limit via config or policy

## Security Considerations
- Short-lived tokens reduce window for token theft exploitation
- Rotation on password change invalidates all existing sessions — attacker immediately locked out
- Refresh endpoint must require current password or 2FA — not just valid token
- Prune expired tokens regularly to prevent token replay after expiry
- Log token lifecycle for security incident investigation

## Related Rules
- Set Default Token Expiration In Config
- Token Rotation On Password Change
- Schedule sanctum:prune-expired Command
- Log Token Creation and Revocation
- Notify User on Sensitive Token Events
- Test Token Expiry and Rotation Behavior

## Related Skills
- Sanctum Token Auth — for token creation
- Token Ability Design — for ability scopes
- Sanctum vs Passport Decision — for auth provider

## Success Criteria
- Tokens expire after configured duration
- Password change rotates all existing tokens
- Sensitive actions require fresh token or rotate issued token
- Expired tokens regularly pruned from database
- Token lifecycle events logged for security audit
- Tests verify expiration and rotation behavior

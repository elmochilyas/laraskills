# Skill: Authorize Private and Presence Channels in routes/channels.php

## Purpose
Register and configure channel authorization callbacks in `routes/channels.php` to control access to private and presence channels.

## When To Use
- Setting up private or presence channel broadcasting
- Adding authorization for new channel patterns
- Auditing existing auth callbacks for correctness and security
- Configuring custom auth guards for API-driven applications

## When NOT To Use
- Public-channel-only broadcasting applications
- Applications where all authenticated users have equal access to all channels

## Prerequisites
- Laravel broadcasting configured with `Broadcast::routes()` registered
- Private or presence channels defined in event `broadcastOn()` methods
- User authentication system configured

## Inputs
- Channel name patterns with `{param}` wildcards
- Authorization callbacks returning truthy/falsy or user data array
- Optional guard configuration array

## Workflow
1. Ensure `Broadcast::routes()` is called with auth and rate-limit middleware
2. Define channel patterns in `routes/channels.php` using `Broadcast::channel()`
3. Use `{param}` wildcards in channel names for parameterization
4. Write authorization callbacks that return truthy for authorized access
5. For presence channels, return an array with at minimum `id` and `name`
6. Add `->where()` regex constraints to disambiguate overlapping patterns
7. Specify `['guards' => ['sanctum', 'web']]` for multi-guard support
8. Delegate complex authorization logic to Gates or Policies
9. Verify auth callback truthiness: authorized = truthy, unauthorized = falsy
10. Test authorization success and failure for each channel pattern

## Validation Checklist
- [ ] `Broadcast::routes()` registered with auth and throttle middleware
- [ ] All private and presence channel patterns have corresponding auth callbacks
- [ ] Channel patterns use `{param}` wildcards (not hardcoded names)
- [ ] Presence callbacks return array with at least `id` field
- [ ] Overlapping patterns have `->where()` constraints
- [ ] Custom guards specified for non-session authentication
- [ ] Complex authorization delegated to Gates/ Policies

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| 403 on all private subscriptions | Missing auth callback for channel pattern | Check `routes/channels.php` for matching pattern |
| Auth endpoint 404 | `Broadcast::routes()` not called | Verify it's registered in a service provider |
| Presence channel shows no user data | Callback returns true/false instead of array | Return `['id' => ..., 'name' => ...]` array |
| Wrong users authorized | Overlapping patterns without constraints | Add `->where()` regex to disambiguate |
| API clients get 401 | Default `web` guard used | Add `['guards' => ['sanctum']]` to channel definition |

## Decision Points
- **Guard selection**: Use `['guards' => ['sanctum', 'web']]` for hybrid session+API apps
- **Model binding**: Type-hinting models in callbacks enables auto-resolution but adds a DB query
- **Gate delegation**: Use `$user->can()` for complex authorization to keep callbacks testable

## Performance/Security Considerations
- Auth callbacks execute on every subscription—keep them fast (<50ms)
- Each database query in a callback adds latency; use cached lookups for repeated checks
- Presence callbacks return data visible to all members—never return PII
- Returning `true` unconditionally bypasses authorization entirely—never do this

## Related Rules (from 05-rules.md)
- Always Register `Broadcast::routes()` with Proper Middleware
- Always Use Wildcard Parameters in Channel Patterns
- Never Return the Entire User Model from Presence Auth Callbacks
- Always Add `->where()` Constraints to Disambiguate Overlapping Patterns
- Always Delegate Complex Authorization to Gates or Policies
- Never Return `true` Unconditionally from Auth Callbacks

## Related Skills
- Optimize and Cache Auth Endpoint Decisions
- Use Private Channel Auth with JWT/Sanctum

## Success Criteria
- Authorized users can subscribe to private/presence channels
- Unauthorized users receive 403 on subscription attempt
- Presence callbacks return minimal user data (id, name, avatar)
- API clients authenticate correctly via token-based guards
- No overlapping patterns cause authorization bypass

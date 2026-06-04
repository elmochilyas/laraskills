# Skill: Configure Channel Types — Public, Private, Presence

## Purpose
Select the correct channel type (public, private, presence) for broadcast events and register authorization callbacks in `routes/channels.php`.

## When To Use
Every `ShouldBroadcast` event needs the right channel type. Private and presence channels require auth callbacks.

## When NOT To Use
Public channels don't need auth callbacks. Presence channels should not be used when private subscriptions are sufficient (unnecessary overhead).

## Prerequisites
- Broadcasting driver configured
- `routes/channels.php` file exists
- User authentication middleware active

## Inputs
- Channel type per event (based on data sensitivity)
- Channel name pattern
- Authorization logic

## Workflow
1. Choose channel type based on data:
   - Public: non-sensitive, announcements, stock tickers
   - Private: user-specific data using `new PrivateChannel('name')`
   - Presence: collaborative features using `new PresenceChannel('name')`
2. For private/presence: register auth callback in `routes/channels.php`
3. Use route-like parameters: `Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int) $id)`
4. For presence callbacks: return user data array, not boolean
5. Keep auth callbacks fast — cache DB queries
6. Use exact patterns over wildcards for efficiency
7. Never register channels in `web.php` or `api.php`

## Validation Checklist
- [ ] Channel type matches data sensitivity (private for user data)
- [ ] Auth callbacks in `routes/channels.php`
- [ ] Presence callbacks return `['id' => ..., 'name' => ...]` not `true`
- [ ] Auth callbacks fast — no DB queries (cached)
- [ ] Channel patterns use route syntax (`{id}`) not glob (`*`)
- [ ] No sensitive data in presence user data
- [ ] Private channel prevents unauthorized access

## Common Failures
- Public channels for user data — any client can intercept
- Not using wildcard params — `fn () => true` authorizes all users
- Returning `true` from presence auth — authorization error
- Registering channels in wrong file — callbacks never fire
- Overly broad wildcards — matches unintended channels

## Decision Points
- User-specific data: `new PrivateChannel('orders.{id}')`
- Collaborative with online tracking: `new PresenceChannel('chat.{id}')`
- System-wide announcements: public channel (no prefix)

## Related Rules
- Rule 1: use-private-channels-for-user-data
- Rule 2: return-user-data-from-presence-auth
- Rule 3: keep-auth-callbacks-fast
- Rule 4: register-channels-in-correct-file

## Related Skills
- Implement `ShouldBroadcast` for Real-Time Events
- Set Up Laravel Echo Client-Side Consumption
- Deploy Reverb to Production

## Success Criteria
Events use appropriate channel types, auth callbacks are in `routes/channels.php`, presence callbacks return user data, and all authorization checks protect private channels.

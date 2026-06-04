# Skill: Track Online Users with Presence Channels

## Purpose
Implement presence channel subscriptions to track and display online users in real-time using Laravel's presence channel join/leave events.

## When To Use
- Chat applications needing "who's online" displays per room
- Collaborative editing showing active collaborators
- Online game lobbies and player presence
- Live dashboards showing active viewers

## When NOT To Use
- Simple online/offline status tracking (use private channels + status API)
- Very large channels (10k+ members) where join/leave event fan-out is expensive
- Applications where member data privacy is critical (all members see each other's data)

## Prerequisites
- Broadcasting configured with private channel auth
- Presence channel auth callback returning user data array in `routes/channels.php`
- Echo configured on the frontend

## Inputs
- `PresenceChannel` instances in event `broadcastOn()` method
- Auth callback returning user data array with `id`, `name`, optional `avatar_url`
- Echo `join()` subscription on the frontend

## Workflow
1. In the event class, return `new PresenceChannel('channel.name')` from `broadcastOn()`
2. In `routes/channels.php`, register auth callback that returns user data array (with `id`)
3. On frontend: `Echo.join('channel.name')` to subscribe
4. Handle `here()` event: receives initial member list on join
5. Handle `joining()` event: new member added (fires for all other members)
6. Handle `leaving()` event: member removed (fires for all other members)
7. Maintain local member list, updating on each event
8. Minimize user data: return only `id`, `name`, `avatar_url` from callbacks
9. Configure ghost member cleanup (TTL, pulse, prune)
10. Monitor presence channel size for anomalies

## Validation Checklist
- [ ] Presence auth callback returns array with at least `id` field
- [ ] `here` event fires with current member list on join
- [ ] `joining` event fires for other members when a user subscribes
- [ ] `leaving` event fires for other members when a user unsubscribes
- [ ] Ghost member cleanup configured (TTL on presence keys)
- [ ] No sensitive PII exposed in presence user data
- [ ] Member list handled correctly for self (not included in `here`)

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Empty member list on join | `here` event not handled | Add `.here(users => ...)` listener |
| No user data in events | Callback returns true/false instead of array | Return `['id' => ..., 'name' => ...]` |
| Inflated member counts over time | No ghost member cleanup | Configure `REVERB_ACTIVITY_TIMEOUT` |
| Members missing from list | Only listening for `joining`, not `here` | Always handle `here` for initial state |
| PII visible to all members | Callback returns entire User model | Return only id, name, avatar |

## Decision Points
- **Presence vs private + API**: Use presence when real-time awareness of who's online is core; use private + REST status for simple online/offline
- **Channel size threshold**: For 10k+ members, evaluate fan-out cost; consider chunked member lists

## Performance/Security Considerations
- `here` payload size scales linearly with member count—keep user data minimal
- Join/leave fan-out is O(n) for n channel members
- Redis writes on every join/leave—high churn rates increase write pressure
- Presence user data is visible to all members—never return email, phone, or sensitive fields

## Related Rules (from 05-rules.md)
- Never Return Sensitive PII in Presence Auth Callbacks
- Always Handle the `here` Event on Presence Channel Join
- Always Configure Ghost Member Cleanup
- Always Monitor Presence Channel Size for Anomalies
- Never Use Presence Channels for Simple Online/Offline Status
- Always Return a User Data Array from Presence Auth Callbacks

## Related Skills
- Clean Up Ghost Members in Presence Channels
- Authorize Private and Presence Channels in routes/channels.php

## Success Criteria
- Members appear/disappear from online lists in real-time
- New subscribers see the current member list immediately
- Ghost members are cleaned up within the configured timeout
- No sensitive PII is exposed in presence user data

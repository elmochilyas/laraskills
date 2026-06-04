# Skill: Select and Implement Channel Types (Public/Private/Presence)

## Purpose
Choose the correct channel type based on authorization requirements and implement subscription patterns for public, private, and presence channels using Echo.

## When To Use
- Determining which channel type to use for a given feature
- Implementing Echo subscriptions for different channel types
- Auditing existing channel usage for least-privilege compliance

## When NOT To Use
- When SSE is preferred over WebSocket broadcasting
- When client events are the primary communication pattern

## Prerequisites
- Laravel broadcasting configured (queue worker, broadcast driver)
- Understanding of channel authorization requirements

## Inputs
- Event class `broadcastOn()` method returning channel instances
- `routes/channels.php` auth callbacks
- Echo subscription code on the frontend

## Workflow
1. Select channel type: public (no auth), private (authorized), presence (authorized + member tracking)
2. Return `new Channel('name')` from `broadcastOn()` for public channels
3. Return `new PrivateChannel('name.{id}')` for user-specific data
4. Return `new PresenceChannel('name.{id}')` for social features needing member awareness
5. Register auth callbacks in `routes/channels.php` for private and presence channels
6. Subscribe on frontend: `Echo.channel()`, `Echo.private()`, or `Echo.join()`
7. Use conventional naming: `resource.{identifier}` patterns
8. Apply least privilege: start with private, downgrade to public only when no auth needed
9. Handle presence events: `here()`, `joining()`, `leaving()`
10. Test authorization for all channel types

## Validation Checklist
- [ ] Public channels accessible without authentication
- [ ] Private channels return 403 for unauthorized users
- [ ] Presence channels return member list on join and broadcast join/leave events
- [ ] Auth callback returns correct truthy/falsy for authorization scenarios
- [ ] Presence auth callback returns array with at minimum `id` field
- [ ] Channel name prefixes (`private-`, `presence-`) correctly applied
- [ ] Least privilege applied: private used over public where data is user-specific

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Private channel accessible without auth | Missing auth callback in channels.php | Register `Broadcast::channel()` with callback |
| Presence shows no members | Callback returns true instead of array | Return `['id' => ..., 'name' => ...]` |
| Sensitive data on public channel | Channel type should be private | Change `new Channel()` to `new PrivateChannel()` |
| Join/leave events not received | Only listening for `here`, not `joining`/`leaving` | Handle all three events |

## Decision Points
- **Public vs Private**: If any authorization is needed, use private. Public channels expose data to any connected client.
- **Private vs Presence**: Use presence only when real-time member awareness is needed. Presence adds join/leave event fan-out and Redis writes.
- **Channel naming**: Use structured `resource.{id}` patterns for maintainability

## Performance/Security Considerations
- Public channels have zero auth overhead (fastest subscription path)
- Private channels add one HTTP round-trip per subscription (auth endpoint)
- Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- Never broadcast user-specific data on public channels
- Presence member data is visible to all channel members—keep minimal

## Related Rules (from 05-rules.md)
- Always Apply Least Privilege When Choosing Channel Types
- Never Use Presence Channels When Private + API Status Suffices
- Always Parameterize Channel Names with Placeholders
- Always Use Conventional Naming for Channel Organization
- Never Broadcast Sensitive Data on Public Channels
- Always Implement Auth Callbacks for Both Private and Presence Channels

## Related Skills
- Authorize Private and Presence Channels in routes/channels.php
- Track Online Users with Presence Channels
- Configure Echo Core API for Frontend Subscriptions

## Success Criteria
- Channel type matches sensitivity of broadcast data
- Authorized users can subscribe to private channels; unauthorized get 403
- Presence channels provide accurate member lists in real-time
- No sensitive data exposed on public channels

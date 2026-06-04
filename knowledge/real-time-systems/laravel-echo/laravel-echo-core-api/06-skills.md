# Skill: Configure Echo Core API for Frontend Subscriptions

## Purpose
Set up and use Laravel Echo's core JavaScript/TypeScript API for subscribing to broadcast channels, listening for events, and managing connections.

## When To Use
- All Laravel applications with real-time features
- Frontend JavaScript/TypeScript projects using Laravel backend
- Vanilla JS projects or when not using framework-specific hooks

## When NOT To Use
- Non-Laravel backends (incompatible with Echo's protocol expectations)
- SSE-only applications using native `EventSource` API
- When framework-specific hooks (React/Vue/Svelte) are available and preferred

## Prerequisites
- Laravel broadcasting configured on the backend
- `pusher-js` installed (for Reverb or Pusher backends)
- `laravel-echo` NPM package installed

## Inputs
- Echo configuration object (broadcaster, key, host, port, auth, etc.)
- Channel names and event names

## Workflow
1. Install dependencies: `npm install laravel-echo pusher-js`
2. Create a single global Echo instance at app bootstrap
3. Configure with correct broadcaster (`reverb` or `pusher`), key, host, and port
4. Set `authEndpoint` and `auth.headers` with Bearer token for private channels
5. Set `forceTLS: true` in production and `namespace: ''` with `broadcastAs()`
6. Subscribe to channels: `Echo.channel()`, `Echo.private()`, `Echo.join()`
7. Listen for events: `.listen('EventName', callback)`
8. Clean up subscriptions on component unmount: `.leave()` or `.stopListening()`
9. Monitor connection state via `Echo.connector.pusher.connection` state changes
10. Handle sender exclusion: Echo auto-injects `X-Socket-ID` for `toOthers()`

## Validation Checklist
- [ ] `pusher-js` installed when using Reverb or Pusher backends
- [ ] `authEndpoint` and `auth.headers` configured for private channels
- [ ] `forceTLS: true` in production
- [ ] `namespace: ''` set when server events use `broadcastAs()`
- [ ] Single Echo instance used application-wide (not per-component instances)
- [ ] `leave()` or `leaveChannel()` called on component unmount
- [ ] Connection status changes handled in the UI

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Echo never connects | `pusher-js` not installed | Check `package.json` for `pusher-js` |
| Private subscriptions fail | No auth config | Check `authEndpoint` and `auth.headers` |
| Events never received client-side | Namespace misconfigured with `broadcastAs()` | Set `namespace: ''` |
| Memory leak over time | Missing `leave()` on unmount | Verify cleanup in component lifecycle |
| WebSocket connects over `ws://` | `forceTLS` not set | Set `forceTLS: true` in production |

## Decision Points
- **Multiple Echo instances?** Never—use a single global instance to avoid redundant WebSocket connections
- **Framework hooks vs core API**: Use hooks (React/Vue/Svelte) for automatic lifecycle; core API for vanilla JS

## Performance/Security Considerations
- Single Echo instance = single WebSocket connection shared across all subscriptions
- Echo auto-instruments Axios/Vue Resource/jQuery for `X-Socket-ID` propagation
- Bearer tokens in `auth.headers` are accessible in client-side code—use short-lived tokens
- `forceTLS: true` prevents unencrypted `ws://` fallback

## Related Rules (from 05-rules.md)
- Always Configure `authEndpoint` and `auth.headers` for Private Channels
- Always Set `namespace` to Empty String When Using `broadcastAs()`
- Always Set `forceTLS: true` in Production
- Always Call `leave()` or `leaveChannel()` on Component Unmount
- Always Install `pusher-js` When Using Reverb or Pusher Backends
- Never Create Multiple Echo Instances Per Application

## Related Skills
- Integrate Echo Framework Hooks in React/Vue/Svelte
- Configure and Operate Laravel Broadcasting Architecture
- Set Up Real-Time Notifications with Broadcast + Database

## Success Criteria
- Echo connects to the configured broadcast backend
- Channels subscribe successfully (public, private, presence)
- Events are received on the frontend with correct payload
- Subscriptions clean up on component unmount (no memory leaks)
- Connection status is displayed and handled appropriately

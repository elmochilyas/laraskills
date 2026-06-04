# Skill: Set Up Laravel Echo Client-Side Consumption

## Purpose
Install and configure Laravel Echo on the frontend to subscribe to broadcast channels and listen for real-time events from Laravel's broadcasting system.

## When To Use
Browser-based real-time features using Laravel broadcasting; SPAs (Vue, React, Alpine.js) needing server push; presence features and collaborative interactions.

## When NOT To Use
Mobile apps or CLI tools (use native WebSocket clients); server-side rendered pages without JavaScript; applications needing raw WebSocket access (Echo abstracts the protocol).

## Prerequisites
- `npm install laravel-echo pusher-js` (or reverb-compatible connector)
- Broadcasting driver configured on backend
- Channel auth callbacks in `routes/channels.php`

## Inputs
- Broadcaster type (reverb/pusher/ably)
- App key and host credentials
- CSRF token for auth endpoint

## Workflow
1. Install: `npm install laravel-echo`
2. Configure Echo with broadcaster (reverb/pusher), key, host, and port
3. Set `csrfToken` from meta tag for auth requests
4. Guard Echo import in SSR contexts: `if (typeof window !== 'undefined')`
5. Subscribe to channels: `Echo.private('orders.1').listen('OrderShipped', (e) => { ... })`
6. Call `Echo.leave()` in component cleanup lifecycle
7. Keep `listen()` callbacks lightweight — update state only
8. Match `listen()` event name to server's `broadcastAs()` with dot prefix

## Validation Checklist
- [ ] Echo connects to WebSocket server (browser console)
- [ ] CSRF token configured for auth
- [ ] Private channel auth succeeds (no 403/419)
- [ ] `Echo.leave()` called in component cleanup
- [ ] SSR context guarded
- [ ] Event names match between server and client
- [ ] Callbacks lightweight — no heavy computation
- [ ] `wss://` used in production
- [ ] Reconnection works on connection loss

## Common Failures
- Not calling `Echo.leave()` on unmount — callbacks accumulate, memory leaks
- Forgetting CSRF token — 419 on private channel subscriptions
- Listening on wrong event name — event received but callback never fires
- Echo in SSR context — ReferenceError for window/WebSocket
- Heavy computation in callbacks — blocks main thread, UI freezes

## Decision Points
- Vue/React component: subscribe in `mounted`, leave in `beforeUnmount`/`onUnmounted`
- Global listener: register once, no cleanup needed
- SSR (Nuxt/Next): guard with `typeof window !== 'undefined'`

## Related Rules
- Rule 1: call-echo-leave-on-unmount
- Rule 2: guard-echo-in-ssr-contexts
- Rule 3: keep-callbacks-lightweight
- Rule 4: match-event-names-consistently

## Related Skills
- Configure Channel Types — Public, Private, Presence
- Implement `ShouldBroadcast` for Real-Time Events
- Deploy Reverb to Production

## Success Criteria
Echo is configured with correct credentials, channel subscriptions work with auth, cleanup prevents memory leaks, SSR is guarded, and event names match between server and client.

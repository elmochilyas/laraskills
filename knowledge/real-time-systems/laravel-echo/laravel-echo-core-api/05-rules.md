## Always Configure `authEndpoint` and `auth.headers` for Private Channels
---
## Framework Usage
---
Always set `authEndpoint` and `auth.headers` in the Echo configuration when using private or presence channels.
---
Without auth configuration, Echo cannot obtain authorization signatures for private channels, and all subscriptions to private/presence channels fail silently.
---
```javascript
new Echo({ broadcaster: 'reverb', key: '...' }); // No auth config
```
---
```javascript
new Echo({
    broadcaster: 'reverb',
    authEndpoint: '/broadcasting/auth',
    auth: { headers: { Authorization: 'Bearer ' + token } },
});
```
---
Public-channel-only applications. No common exceptions for private/presence usage.
---
Silent subscription failures; broken private channel features.

## Always Set `namespace` to Empty String When Using `broadcastAs()`
---
## Framework Usage
---
Always set `namespace: ''` in Echo config when server events use `broadcastAs()` with dot-notation names.
---
Echo's default namespace prepends `App.Events.` to event names. When the server uses `broadcastAs()` to define custom names like `order.shipped`, the namespace causes a mismatch and events are never received.
---
```javascript
// Namespace defaults to 'App.Events' — .notification event never matches
```
---
```javascript
new Echo({
    namespace: '', // Match server's broadcastAs() names exactly
});
```
---
Events using the fully-qualified class name as event name (no `broadcastAs()`). No common exceptions when using `broadcastAs()`.
---
Events never received client-side; silent listener failures.

## Always Set `forceTLS: true` in Production
---
## Security
---
Always enable `forceTLS: true` in the Echo configuration for production environments.
---
Without `forceTLS`, Echo may fall back to plain `ws://` connections, transmitting all real-time data unencrypted over the network.
---
```javascript
new Echo({ forceTLS: false }); // Falls back to ws://
```
---
```javascript
new Echo({ forceTLS: true }); // Always uses wss://
```
---
Local development environments. No common exceptions for production.
---
Unencrypted WebSocket traffic; MITM vulnerability.

## Always Call `leave()` or `leaveChannel()` on Component Unmount
---
## Maintainability
---
Always clean up Echo channel subscriptions when a component is destroyed to prevent memory leaks and stale callbacks.
---
Echo listeners accumulate in memory. Components that mount/unmount repeatedly (navigation, tabs) create orphaned callbacks that continue executing and holding references.
---
```javascript
// Component mounts but never leaves
Echo.private('orders.1').listen('Shipped', callback);
```
---
```javascript
const channel = Echo.private('orders.1').listen('Shipped', callback);
onUnmounted(() => channel.stopListening('Shipped'));
```
---
Root-level subscriptions that live for the entire application session. No common exceptions.
---
Memory leaks; stale callbacks; degraded performance over time.

## Always Install `pusher-js` When Using Reverb or Pusher Backends
---
## Framework Usage
---
Always include `pusher-js` as a dependency when Echo is configured with the `reverb` or `pusher` broadcaster.
---
Echo delegates WebSocket connectivity to the underlying Pusher JavaScript client. Without `pusher-js`, Echo cannot establish the WebSocket connection.
---
```json
{
    "dependencies": {
        "laravel-echo": "^2.0"
        // Missing pusher-js
    }
}
```
---
```json
{
    "dependencies": {
        "laravel-echo": "^2.0",
        "pusher-js": "^8.0"
    }
}
```
---
Applications using the `ably` broadcaster (Ably has its own connector). No common exceptions for Reverb/Pusher.
---
WebSocket connections fail silently; Echo never connects.

## Never Create Multiple Echo Instances Per Application
---
## Architecture
---
Always use a single, globally configured Echo instance instead of creating per-component instances.
---
Each Echo instance establishes a separate WebSocket connection. Multiple instances multiply connection overhead, bypass the global auth configuration, and prevent sender exclusion (`toOthers()`) from working correctly.
---
```javascript
// Per-component Echo instances
function Chat() { const echo = new Echo({...}); }
function Notifications() { const echo = new Echo({...}); }
```
---
```javascript
// Single global instance
window.Echo = new Echo({...});
// Both components use window.Echo
```
---
No common exceptions; a single Echo instance is always correct.
---
Redundant WebSocket connections; broken `toOthers()`; wasted resources.

## Always Monitor Connection Status
---
## Maintainability
---
Always monitor Echo's connection status using `useConnectionStatus()` or the `connector` state change events.
---
Without connection monitoring, users experience silent data staleness when the WebSocket disconnects. They see no real-time updates but receive no error indication.
---
```javascript
// No connection monitoring — users never know if it's disconnected
```
---
```javascript
Echo.connector.pusher.connection.bind('state_change', (states) => {
    showConnectionBanner(states.current !== 'connected');
});
```
---
Applications where stale data is acceptable. No common exceptions for production real-time features.
---
Silent disconnections; user confusion; untracked availability issues.

# ECC Anti-Patterns — Laravel Echo Core API

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Client-Side Subscriptions (Echo) |
| **Knowledge Unit** | Laravel Echo Core API |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No leave() on Component Unmount
2. Multiple Echo Instances Per Application
3. Namespace Misconfigured With broadcastAs()
4. Missing pusher-js Dependency
5. No Connection Status Monitoring

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering

---

## Anti-Pattern 1: No leave() on Component Unmount

### Category
Maintainability

### Description
Subscribing to Echo channels in components without calling `leave()` or `leaveChannel()` on unmount, causing memory leaks from accumulated callbacks and stale event handlers.

### Warning Signs
- Memory usage grows over time in SPA
- Components mount/unmount without cleanup
- Callbacks fire for unmounted components
- Browser tab consumes increasing memory during long sessions

### Why It Is Harmful
Echo listeners accumulate in memory. Components that mount/unmount repeatedly (navigation, tabs) create orphaned callbacks that continue executing and holding references. Over a long session, this degrades performance and causes stale event processing.

### Real-World Consequences
A user navigates between 50 order detail pages in a single session. Each page subscribes to `orders.{id}` but never leaves. After 50 navigations, there are 50 active listeners. Each broadcast of an order update triggers all 50 callbacks — only 1 is for the current page.

### Preferred Alternative
Call `Echo.leave(channelName)` or `channel.stopListening()` in the component's cleanup lifecycle.

### Refactoring Strategy
1. Track channel reference in component state
2. Call `Echo.leave(channelName)` in `onUnmounted` / `useEffect` cleanup
3. Verify listener count doesn't grow on navigation

### Detection Checklist
- [ ] No `leave()` call in component unmount
- [ ] Memory grows during navigation
- [ ] Stale callbacks fire for unmounted components

### Related Rules
- (Rule: Always call leave() or leaveChannel() on component unmount)

### Related Skills
- (Related: Configure Echo Core API for Frontend Subscriptions)

---

## Anti-Pattern 2: Multiple Echo Instances Per Application

### Category
Architecture

### Description
Creating a new Echo instance in each component instead of using a single globally configured instance, multiplying WebSocket connections and breaking sender exclusion.

### Warning Signs
- Multiple Echo `new Echo()` calls across components
- Browser DevTools shows multiple WebSocket connections
- `toOthers()` sender exclusion not working
- Duplicate auth requests

### Why It Is Harmful
Each Echo instance establishes a separate WebSocket connection. Multiple instances multiply connection overhead (handshake, TLS, ping/pong), bypass the global auth configuration, and prevent `X-Socket-ID` header propagation from working correctly — breaking `broadcast()->toOthers()`.

### Real-World Consequences
A dashboard has 5 components that each create their own Echo instance. The browser opens 5 WebSocket connections to Reverb. Each connection sends separate auth requests. Server-side `toOthers()` doesn't work because each instance has a different socket ID. User receives duplicate notifications.

### Preferred Alternative
Create a single global Echo instance at application bootstrap and reuse it across all components.

### Refactoring Strategy
1. Create Echo instance once in app entry point
2. Assign to `window.Echo` or inject via framework context
3. Remove per-component `new Echo()` calls
4. Verify single WebSocket connection in DevTools

### Detection Checklist
- [ ] Multiple `new Echo()` across components
- [ ] Multiple WebSocket connections open
- [ ] `toOthers()` not working

### Related Rules
- (Rule: Never create multiple Echo instances per application)

---

## Anti-Pattern 3: Namespace Misconfigured With broadcastAs()

### Category
Framework Usage

### Description
Leaving Echo's default namespace (`App.Events`) when server events use `broadcastAs()` dot-notation names, causing a mismatch where Echo never receives events.

### Warning Signs
- Server uses `broadcastAs()` for event names
- Echo client never receives events
- No connection errors in console
- Namespace left at default

### Why It Is Harmful
Echo's default namespace prepends `App.Events.` to event names. When the server defines a custom name like `order.shipped` via `broadcastAs()`, Echo looks for `App.Events.order.shipped` — which never matches. Events are silently lost.

### Real-World Consequences
A team adds `broadcastAs()` returning `order.shipped` to a broadcast event. The Echo client doesn't receive the event. No error is shown — the event simply never arrives. Debugging takes 2 hours before discovering the namespace mismatch.

### Preferred Alternative
Set `namespace: ''` in Echo config when server events use `broadcastAs()`.

### Refactoring Strategy
1. Add `namespace: ''` to Echo configuration
2. Remove any leading namespace from client-side event names
3. Test that events arrive client-side

### Detection Checklist
- [ ] Server uses `broadcastAs()` with dot-notation names
- [ ] Echo namespace not set to empty string
- [ ] Events never received client-side

### Related Rules
- (Rule: Always set namespace to empty string when using broadcastAs())

---

## Anti-Pattern 4: Missing pusher-js Dependency

### Category
Framework Usage

### Description
Installing `laravel-echo` without `pusher-js` when using Reverb or Pusher backends, causing Echo to silently fail to establish WebSocket connections.

### Warning Signs
- Echo configured with `reverb` or `pusher` broadcaster
- No WebSocket connection established
- `pusher-js` missing from `package.json`
- Echo connector fails silently

### Why It Is Harmful
Echo delegates WebSocket connectivity to the underlying Pusher JavaScript client. Without `pusher-js`, Echo has no WebSocket implementation to use. The connection silently fails — no error, no warning, just no real-time updates.

### Real-World Consequences
A team installs `laravel-echo` and configures it with `broadcaster: 'reverb'`. They skip `pusher-js` because they're not using Pusher. Echo never connects. No errors in console. 3 days pass before someone checks the network tab and sees no WebSocket upgrade request.

### Preferred Alternative
Always install `pusher-js` alongside `laravel-echo` when using Reverb or Pusher backends.

### Refactoring Strategy
1. Run `npm install pusher-js`
2. Import `pusher-js` before initializing Echo
3. Verify WebSocket connection in browser DevTools

### Detection Checklist
- [ ] `pusher-js` not in `package.json`
- [ ] No WebSocket connection established
- [ ] Echo configured for Reverb or Pusher

### Related Rules
- (Rule: Always install pusher-js when using Reverb or Pusher backends)

---

## Anti-Pattern 5: No Connection Status Monitoring

### Category
Observability

### Description
Not monitoring Echo's connection status, leaving users unaware when the WebSocket disconnects and real-time updates silently stop.

### Warning Signs
- No connection status indicator in UI
- Users report "data isn't updating" without visible error
- WebSocket disconnects unnoticed
- No reconnection handling in UI

### Why It Is Harmful
Without connection monitoring, users experience silent data staleness when the WebSocket disconnects. They see no real-time updates but receive no error indication. Features appear broken but no error state is communicated.

### Real-World Consequences
A user's WebSocket connection drops due to network interruption. The live order dashboard stops updating. The user thinks no new orders are coming in. 30 minutes later they refresh the page and see 20 unprocessed orders. No connection warning was shown.

### Preferred Alternative
Monitor Echo's connection state using `useConnectionStatus()` or `connector` event listeners. Show connection status in the UI.

### Refactoring Strategy
1. Add connection state change listener: `Echo.connector.pusher.connection.bind('state_change', handler)`
2. Track connection state in reactive state
3. Show "disconnected" banner in UI
4. Show "reconnecting" indicator during reconnection attempts

### Detection Checklist
- [ ] No connection status monitoring
- [ ] Users unaware of disconnections
- [ ] Real-time features appear broken without feedback

### Related Rules
- (Rule: Always monitor connection status)

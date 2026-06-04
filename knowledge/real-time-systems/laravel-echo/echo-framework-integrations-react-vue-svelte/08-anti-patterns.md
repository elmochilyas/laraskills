# ECC Anti-Patterns — Echo Framework Integrations (React/Vue/Svelte)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Client-Side Subscriptions (Echo) |
| **Knowledge Unit** | Echo Framework Integrations (React/Vue/Svelte) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using useEcho for Public Channels
2. Unstable Callback References Causing Re-Subscription Loops
3. Multiple useConnectionStatus() Calls
4. Non-Reactive Channel Names
5. Hooks Without Echo Configured First

---

## Repository-Wide Anti-Patterns

- Overengineering
- God Services

---

## Anti-Pattern 1: Using useEcho for Public Channels

### Category
Performance

### Description
Using the default `useEcho` hook (which triggers private channel auth) for public channels that don't require authorization, wasting HTTP requests to the auth endpoint.

### Warning Signs
- `useEcho` called for channels with public data
- "public" in channel name but `useEcho` used
- Auth endpoint receives requests for channel names that don't need authorization
- Browser DevTools shows POST to `/broadcasting/auth` for `public.*` channels

### Why It Is Harmful
`useEcho` defaults to private channel subscription, triggering an HTTP POST to `/broadcasting/auth`. For public channels, this auth call is wasted latency — the channel requires no authorization, but the request is still made.

### Real-World Consequences
A dashboard shows 5 public data channels (announcements, system status, public metrics). Each uses `useEcho`, triggering 5 auth requests on mount. That's 5 unnecessary HTTP calls, each taking ~50ms. Page load is delayed by 250ms for zero security benefit.

### Preferred Alternative
Use `useEchoPublic` for public channels to skip auth entirely.

### Refactoring Strategy
1. Identify channels that are public (no authorization needed)
2. Replace `useEcho` with `useEchoPublic` for those channels
3. Verify auth endpoint receives fewer requests

### Detection Checklist
- [ ] `useEcho` used for `public.*` channels
- [ ] Auth requests made for channels that don't need authorization
- [ ] Unnecessary HTTP overhead

### Related Rules
- (Rule: Use useEchoPublic for public channels, not useEcho)

### Related Skills
- (Related: Integrate Echo Framework Hooks — useEchoPublic vs useEcho)

---

## Anti-Pattern 2: Unstable Callback References Causing Re-Subscription Loops

### Category
Performance

### Description
Passing inline callback functions to Echo hooks without memoization, creating new function instances on every render that trigger re-subscription logic and potential infinite loops.

### Warning Signs
- Inline arrow functions in `useEcho` hook calls
- Component re-renders cause re-subscription to channels
- Network tab shows repeated auth requests on every render
- `useCallback` or memoization not used

### Why It Is Harmful
Inline callbacks create new function instances on every render. The hook detects a new callback reference and re-subscribes, which can cause infinite re-render loops. Each re-subscription triggers auth requests and WebSocket operations.

### Real-World Consequences
A React component with `useEcho` and inline callback re-renders due to state change. The inline callback is recreated. The hook re-subscribes to the channel. The subscription callback updates state. State update triggers re-render. Infinite loop crashes the browser tab.

### Preferred Alternative
Memoize callback references with `useCallback` (React), stable function references (Vue), or `$derived` (Svelte).

### Refactoring Strategy
1. Extract callback into `useCallback` with stable dependencies
2. Or use `useRef` to store the callback without triggering re-subscription
3. Test that component re-renders don't cause re-subscriptions

### Detection Checklist
- [ ] Inline callbacks in `useEcho`/`useEchoPublic`
- [ ] Re-subscriptions on every render
- [ ] Auth requests increase with renders

### Related Rules
- (Rule: Always provide stable callback references to prevent re-subscription loops)

### Related Skills
- (Related: Integrate Echo Framework Hooks — stable callbacks)

---

## Anti-Pattern 3: Multiple useConnectionStatus() Calls

### Category
Performance

### Description
Calling `useConnectionStatus()` in every child component instead of once at a high level, creating redundant event listeners and inconsistent connection state display.

### Warning Signs
- Multiple components call `useConnectionStatus()`
- Network tab shows multiple WebSocket state listeners
- Connection status display shows different states in different components
- State flickering as multiple listeners fire

### Why It Is Harmful
Each `useConnectionStatus()` call registers event listeners on the Echo connector. Multiple instances across components create redundant listeners, increasing memory and processing overhead. Events fire N times (once per listener) instead of once.

### Real-World Consequences
A 10-component dashboard all call `useConnectionStatus()` independently. When connection drops, `state_change` fires 10 times (once per listener). Each listener updates local state, causing 10 re-renders. UI flickers as components show "disconnected" at different times.

### Preferred Alternative
Call `useConnectionStatus()` once at the app shell or layout level and pass status down via context or props.

### Refactoring Strategy
1. Move `useConnectionStatus()` to root/layout component
2. Pass status via context (React.createContext, Vue.provide/inject)
3. Remove per-component `useConnectionStatus()` calls
4. Verify single listener in browser DevTools

### Detection Checklist
- [ ] `useConnectionStatus()` called in multiple components
- [ ] Redundant listeners registered
- [ ] Inconsistent connection state across components

### Related Rules
- (Rule: Always call useConnectionStatus() at a high component level)

### Related Skills
- (Related: Integrate Echo Framework Hooks — connection monitoring)

---

## Anti-Pattern 4: Non-Reactive Channel Names

### Category
Framework Usage

### Description
Passing static channel name strings to Echo hooks instead of reactive references, causing subscriptions to never update when route parameters or props change.

### Warning Signs
- Channel name is a plain string with interpolation
- Navigating to a different resource (different order ID) shows old data
- Old subscription persists after navigating away
- New channel never subscribed

### Why It Is Harmful
Static channel names in hooks never update. When the user navigates from `orders/1` to `orders/2`, the old subscription to `orders.1` persists and the new subscription to `orders.2` is never created. The component shows data for the wrong order.

### Real-World Consequences
A Vue component uses `useEcho('orders.' + props.orderId, listeners)`. User navigates from order 1 to order 2. The `channel` variable is not reactive (it's evaluated once at mount). The component stays subscribed to `orders.1` and shows updates for the wrong order.

### Preferred Alternative
Make channel names reactive using `computed()` (Vue), `useMemo()` (React), or `$derived` (Svelte).

### Refactoring Strategy
1. Create a reactive channel name: `const channel = computed(() => 'orders.' + props.orderId)`
2. Pass reactive channel to `useEcho(channel, listeners)`
3. Verify that navigation updates the subscription

### Detection Checklist
- [ ] Channel name is a static string
- [ ] Subscriptions don't update on navigation
- [ ] Stale data displayed for wrong resource

### Related Rules
- (Rule: Always make channel names reactive)

---

## Anti-Pattern 5: Hooks Without Echo Configured First

### Category
Framework Usage

### Description
Using framework-specific Echo hooks before Echo is globally configured, causing runtime errors and component mount failures.

### Warning Signs
- `useEcho` throws at component mount
- Error: "Echo is not defined" or similar
- Components crash on page load
- Echo not configured before `createRoot` (React) or `createApp` (Vue)

### Why It Is Harmful
Framework hooks depend on a pre-configured Echo instance. Without it, hooks throw runtime errors because the Echo connector object is undefined. Components fail to mount, potentially breaking the entire page.

### Real-World Consequences
A Vue application imports `useEcho` but forgets to call `configureEcho()` before `createApp`. Every component using `useEcho` throws an error on mount. The entire real-time feature fails silently with no clear error message.

### Preferred Alternative
Configure Echo globally at application bootstrap before any component renders.

### Refactoring Strategy
1. Call `configureEcho()` at app entry point (before `createApp` in Vue)
2. Or create Echo instance before `createRoot` in React
3. Verify Echo is defined before hooks are called

### Detection Checklist
- [ ] Echo hooks used before Echo configured
- [ ] Runtime errors on component mount
- [ ] Real-time features completely broken

### Related Rules
- (Rule: Always configure Echo before using framework hooks)

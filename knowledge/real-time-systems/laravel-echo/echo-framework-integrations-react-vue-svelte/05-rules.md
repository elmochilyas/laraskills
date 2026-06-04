## Always Configure Echo Before Using Framework Hooks
---
## Framework Usage
---
Always ensure Echo is globally configured before using any framework-specific hooks (`useEcho`, `useEchoPublic`, etc.).
---
Framework hooks depend on a pre-configured Echo instance. Without it, hooks throw runtime errors because Echo is undefined.
---
```javascript
// Vue component uses useEcho without configureEcho
const { status } = useEcho('orders.1', { ... }); // Throws
```
---
```javascript
// app.js bootstrapping
configureEcho(); // Called once at app bootstrap
// Component
const { status } = useEcho('orders.1', { ... }); // Works
```
---
Vanilla JavaScript applications not using framework hooks. No common exceptions for hook usage.
---
Runtime errors; components fail to mount.

## Use `useEchoPublic` for Public Channels, Not `useEcho`
---
## Performance
---
Always use `useEchoPublic` when subscribing to public channels instead of the default `useEcho` hook.
---
`useEcho` defaults to private channel behavior and triggers an unnecessary auth request. `useEchoPublic` skips auth entirely, reducing HTTP overhead.
---
```javascript
useEcho('public.updates', { ... }); // Unnecessary auth request
```
---
```javascript
useEchoPublic('public.updates', { ... }); // No auth — direct subscription
```
---
Applications using private channels exclusively (no public channel subscriptions). No common exceptions.
---
Unnecessary auth requests; wasted HTTP round-trips.

## Always Provide Stable Callback References to Prevent Re-Subscription Loops
---
## Performance
---
Always memoize callback references passed to Echo hooks using `useCallback` (React) or stable function references.
---
Inline callbacks create new function instances on every render, triggering re-subscription logic that can cause infinite loops and memory leaks.
---
```javascript
useEcho('chat.1', {
    MessageSent: (data) => { /* inline — recreated each render */ }
});
```
---
```javascript
const onMessage = useCallback((data) => { /* stable */ }, []);
useEcho('chat.1', { MessageSent: onMessage });
```
---
One-shot subscriptions that don't persist across renders. No common exceptions.
---
Infinite re-subscription loops; memory leaks; degraded performance.

## Always Call `useConnectionStatus()` at a High Component Level
---
## Design
---
Always place `useConnectionStatus()` in a root or layout component and pass the status down via context or props.
---
Calling `useConnectionStatus()` in every child component creates redundant listeners, wasting resources and making status management inconsistent.
---
```vue
// Every component calls useConnectionStatus()
<template>
  <NotificationBell :connectionStatus="useConnectionStatus()" />
  <ChatPanel :connectionStatus="useConnectionStatus()" />
</template>
```
---
```vue
// Layout component calls once, passes down
const { status } = useConnectionStatus();
provide('connectionStatus', status);
```
---
Single-component applications where only one component needs connection status. No common exceptions for multi-component apps.
---
Redundant listeners; inconsistent status display; wasted resources.

## Always Make Channel Names Reactive
---
## Framework Usage
---
Always use reactive channel names in framework hooks so subscriptions update when route params or props change.
---
Static channel names in hooks never update, so navigating to a different resource (e.g., different order ID) leaves the old subscription active and the new one never created.
---
```vue
useEcho('orders.' + props.orderId, { ... }); // Non-reactive — old subscription persists
```
---
```vue
const channel = computed(() => 'orders.' + props.orderId);
useEcho(channel, { ... }); // Reactive — updates when orderId changes
```
---
Single-page applications without navigation. No common exceptions for dynamic content.
---
Stale subscriptions; wrong channel data displayed.

## Always Clean Up Subscriptions on Component Unmount
---
## Reliability
---
Always use framework hooks (which auto-cleanup) or manually call `leaveChannel()` on component unmount.
---
Without cleanup, Echo listeners accumulate and callbacks fire for unmounted components, causing memory leaks, "setState on unmounted component" warnings, and stale updates.
---
```javascript
// Raw Echo subscription without leave
Echo.private('orders.1').listen('Shipped', callback);
```
---
```javascript
// Framework hooks auto-cleanup
const { leaveChannel } = useEcho('orders.1', { Shipped: callback });
onUnmounted(() => leaveChannel());
```
---
Root-level subscriptions that live for the entire application lifetime. No common exceptions.
---
Memory leaks; stale callback execution; degraded performance.

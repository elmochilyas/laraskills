# Rule Card: K033 — Laravel Echo Client-Side Consumption

---

## Rule 1

**Rule Name:** call-echo-leave-on-unmount

**Category:** Always

**Rule:** Always call `Echo.leave()` or `Echo.leaveChannel()` in component cleanup lifecycles.

**Reason:** Without leaving, callbacks accumulate and memory usage grows — zombie callbacks cause memory leaks.

**Bad Example:**
```javascript
// Vue component — no leave in beforeUnmount
mounted() { Echo.private('orders.1').listen('OrderShipped', (e) => { ... }); }
```

**Good Example:**
```javascript
mounted() { this.channel = Echo.private('orders.1').listen(...); }
beforeUnmount() { Echo.leave('orders.1'); }
```

**Exceptions:** Global listeners on the Echo instance (not per-component) don't need cleanup.

**Consequences Of Violation:** After navigating between views 100 times, 100 identical callbacks are registered — each event fires 100 handlers, degrading performance and causing duplicate side effects.

---

## Rule 2

**Rule Name:** guard-echo-in-ssr-contexts

**Category:** Always

**Rule:** Always guard Echo usage in server-side rendering contexts.

**Reason:** Echo uses browser-specific APIs (WebSocket, window) that don't exist during SSR.

**Bad Example:**
```javascript
import Echo from 'laravel-echo';
// ReferenceError in SSR context
```

**Good Example:**
```javascript
let Echo;
if (typeof window !== 'undefined') {
    Echo = new Echo({ ... });
}
```

**Exceptions:** Client-side-only frameworks (Vue SPA, React CSR) don't need the guard.

**Consequences Of Violation:** SSR build fails with `ReferenceError: window is not defined` — the entire application fails to render on the server.

---

## Rule 3

**Rule Name:** keep-callbacks-lightweight

**Category:** Always

**Rule:** Always keep Echo `listen()` callbacks lightweight — avoid heavy computation.

**Reason:** Each callback fires on the main thread — heavy callbacks block UI updates.

**Bad Example:**
```javascript
Echo.private('orders.1').listen('OrderShipped', (e) => {
    this.heavyDataProcessing(e); // Blocks UI
});
```

**Good Example:**
```javascript
Echo.private('orders.1').listen('OrderShipped', (e) => {
    this.status = e.status; // Lightweight state update
});
```

**Exceptions:** Background processing (analytics, logging) that doesn't affect UI can be heavier.

**Consequences Of Violation:** UI freezes momentarily on each broadcast event — users perceive stuttering during real-time interactions.

---

## Rule 4

**Rule Name:** match-event-names-consistently

**Category:** Always

**Rule:** Always match `listen()` event name to the server's `broadcastAs()` or class name.

**Reason:** Event name mismatch is the most common Echo debugging issue — events arrive but no callback fires.

**Bad Example:**
```php
// Server
public function broadcastAs(): string { return 'order.shipped'; }
```
```javascript
// Client — wrong name
Echo.private('orders.1').listen('OrderShipped', ...);
```

**Good Example:**
```javascript
Echo.private('orders.1').listen('.order.shipped', ...); // Prefixed with . for broadcastAs
```

**Exceptions:** When using the class name (no `broadcastAs`), the client listens without a dot prefix.

**Consequences Of Violation:** The event is sent to the client but no callback fires — developers spend hours debugging why real-time updates aren't working.

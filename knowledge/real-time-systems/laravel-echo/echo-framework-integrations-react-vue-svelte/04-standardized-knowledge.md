# Standardized Knowledge: Echo Framework Integrations (React/Vue/Svelte)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Client-Side Subscriptions (Echo) |
| Knowledge Unit ID | K10 |
| Knowledge Unit | Echo Framework Integrations (React/Vue/Svelte) |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Laravel Echo provides first-party framework-specific packages for React, Vue 3, and Svelte 5 that expose reactive hooks and composables for subscribing to broadcast channels. The `@laravel/echo-react` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, and `useEchoModel` hooks. The `@laravel/echo-vue` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`, `useConnectionStatus`, and `configureEcho`. The `@laravel/echo-svelte` package provides equivalent rune-based hooks for Svelte 5's `$state` and `$effect` runes. All packages handle automatic channel cleanup on component unmount.

## Core Concepts

Each framework integration wraps Echo's core API in framework-native reactivity primitives. React hooks use `useEffect` for lifecycle, Vue composables use `onMounted`/`onUnmounted`, Svelte uses `$effect` runes. The hooks accept a channel name, event name(s), and a callback. They return lifecycle control methods (`leaveChannel`, `leave`, `stopListening`, `listen`). The `useConnectionStatus()` hook provides reactive connection state: connected, connecting, reconnecting, disconnected, failed.

## When To Use

- React 18+ applications using `@laravel/echo-react`
- Vue 3 + Inertia.js or standalone Vue applications using `@laravel/echo-vue`
- Svelte 5 applications using `@laravel/echo-svelte`
- Any Laravel frontend project using the corresponding starter kit

## When NOT To Use

- Vanilla JavaScript applications (use Echo core API directly)
- Applications not using Echo for broadcasting
- Projects using older framework versions without hook support

## Best Practices (WHY)

- **Automatic lifecycle management**: Hooks subscribe on mount and unsubscribe on unmount, preventing memory leaks
- **Use `useEchoPublic` for public channels**: Avoids unnecessary auth configuration for public channel subscriptions
- **Centralize connection status**: Call `useConnectionStatus()` once at a high component level; pass status down
- **Stable callback references**: Use `useCallback` (React) or `computed` (Vue) to prevent re-subscription loops
- **Configure Echo before hooks**: Call `configureEcho` (Vue) or set up Echo globally before using hooks

## Architecture Guidelines

- Framework-specific packages avoid cross-framework dependency bloat
- Hooks return imperative control methods for flexibility beyond pure subscription
- `useEcho` defaults to private channels (most common use case)
- The `useEchoModel` hook specifically handles model broadcasting events

## Performance Considerations

- Hooks use native reactive primitives with minimal overhead
- `useEchoModel` subscribes to one channel per model instance; many instances = many subscriptions
- `useConnectionStatus()` should be called once at a high level, not in every child component
- Callback closures are recreated on each render; stable references reduce subscription churn

## Security Considerations

- Channel names in hooks should be sanitized if derived from user input
- Presence channel user data is visible to all subscribers—be mindful of data exposure
- Token-based auth headers are sent with every auth request; ensure tokens are short-lived

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not calling `configureEcho` in Vue | Omission before using hooks | Hook throws without configured Echo | Call `configureEcho` at app bootstrap |
| Using `useEcho` (private) for public channels | Copy-paste pattern | Auth request made unnecessarily | Use `useEchoPublic` for public channels |
| Unstable event array reference | Inline array in hook call | Infinite re-subscription loop | Use memoized/stable array reference |
| Non-reactive channel name | Channel name never updates | Subscription never changes when it should | Make channel name reactive (ref/computed) |
| Multiple `useConnectionStatus()` instances | Every component calls it | Redundant listeners | Call once at root, pass via context/props |

## Anti-Patterns

- **No lifecycle management**: Using raw Echo API in components without cleanup on unmount
- **Per-component Echo instances**: Creating new Echo instances instead of using the globally configured one
- **Over-subscription**: Subscribing to many channels in a single component when fewer would suffice

## Examples

```tsx
// React
import { useEcho } from '@laravel/echo-react';

function OrderTracker({ orderId }) {
    const { leaveChannel } = useEcho(
        `orders.${orderId}`,
        {
            OrderShipped: (data) => { /* ... */ },
            OrderUpdated: (data) => { /* ... */ },
        }
    );

    return <div>{/* ... */}</div>;
}
```

```vue
<!-- Vue -->
<script setup>
import { useEcho, useConnectionStatus } from '@laravel/echo-vue';

const { status } = useConnectionStatus();
const { leaveChannel } = useEcho('orders.' + props.orderId, {
    OrderShipped: (data) => { /* ... */ },
});
</script>
```

## Related Topics

- K09: Laravel Echo Core API
- K11: Public/Private/Presence Channel Patterns
- K19: Real-Time Notifications (Broadcast + Database)
- K30: Model Broadcasting (BroadcastsEvents Trait)

## AI Agent Notes

- Framework-specific packages are part of the `laravel/echo` monorepo
- Svelte 5 integration uses runes (`$state`, `$effect`) native to Svelte 5
- All packages at v2.3.4 as of April 2026
- The `useConnectionStatus()` hook is available across all framework packages

## Verification

- [ ] Echo is configured before using framework hooks (globally or via `configureEcho`)
- [ ] `useEchoPublic` is used for public channels, `useEcho` for private
- [ ] Lifecycle cleanup works correctly on component unmount
- [ ] `useConnectionStatus()` is called at an appropriate component level
- [ ] Callback references are stable to prevent re-subscription loops
- [ ] Channel names are reactive and update correctly when props change

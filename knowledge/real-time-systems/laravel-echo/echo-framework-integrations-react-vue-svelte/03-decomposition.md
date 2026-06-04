# Decomposition: Echo Framework Integrations React Vue Svelte

## Topic Overview
Laravel Echo provides first-party framework-specific packages for React, Vue 3, and Svelte 5 that expose reactive hooks and composables for subscribing to broadcast channels. The `@laravel/echo-react` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, and `useEchoModel` hooks. The `@laravel/echo-vue` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`, `useConnectionStatus`, and `configureEcho`. The `@laravel/echo-svelte` package provides equivalent run...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
client-side-subscriptions-echo/K10-echo-framework-integrations-react-vue-svelte/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Echo Framework Integrations React Vue Svelte
- **Purpose:** Laravel Echo provides first-party framework-specific packages for React, Vue 3, and Svelte 5 that expose reactive hooks and composables for subscribing to broadcast channels. The `@laravel/echo-react` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, and `useEchoModel` hooks. The `@laravel/echo-vue` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`, `useConnectionStatus`, and `configureEcho`. The `@laravel/echo-svelte` package provides equivalent run...
- **Difficulty:** Intermediate
- **Dependencies:
  - K09: Laravel Echo Core API
  - K11: Public/Private/Presence Channel Patterns
  - K19: Real-Time Notifications (Broadcast + Database)
  - K30: Model Broadcasting (BroadcastsEvents Trait)

## Dependency Graph
**Depends on:**
  - K09: Laravel Echo Core API
  - K11: Public/Private/Presence Channel Patterns
  - K19: Real-Time Notifications (Broadcast + Database)
  - K30: Model Broadcasting (BroadcastsEvents Trait)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Automatic lifecycle management**: Subscribe on mount, unsubscribe on unmount**Returned control methods**: `leaveChannel`, `leave`, `stopListening`, `listen` for manual control**Convenience wrappers**: `useEchoPublic` and `useEchoPresence` avoid needing to specify channel type**Reactive connection status**: Centralized hook for displaying connection state in UI**Model broadcasting bridge**: `useEchoModel` subscribes to the correct private channel based on model type**Framework-specific packages**: Separate packages avoid cross-framework dependency bloat**Hooks return control methods**: Rather than pure subscriptions, hooks return imperative control for flexibility**useEcho as private-channel default**: Private channels are the most common use case for real-time features**Per-component subscription cost**: Each hook call creates a subscription; many components subscribing to different channels increases overhead**Hook state management**: Connection status state is local to the component tree; sharing across components requires context/prop drilling or a global store**Framework coupling**: Mixing framework packages is not possible; each project must use its corresponding package**Learning surface shift**: Developers need to understand both Echo's core API and the framework-specific hook APIHooks use native reactive primitives with minimal overhead`useEchoModel` subscribes to a single channel per model instance; many model instances = many subscriptions`useConnectionStatus()` should ideally be called once at a high component level and passed down, not called in every child componentCallback closures are recreated on each render; stable callback references (via `useCallback` / `computed`) reduce subscription churnConfigure Echo before using any hooks (via `configureEcho` in Vue, or Echo setup in React/Svelte)Ensure `leaveChannel()` is called during optimistic UI updates where the subscription target changesUse `useConnectionStatus()` for connection health indicators in the UIAvoid creating new Echo instances per component—hooks use the globally configured Echo instanceTest that channel cleanup occurs correctly during component unmount in complex component treesNot calling `configureEcho` in Vue before using `useEcho` (hook throws without configured Echo)Using `useEcho` (private) when `useEchoPublic` is sufficient for public channelsForgetting to pass a stable array reference for multiple events (causes infinite re-subscription loops)Calling `useEcho` with a non-reactive channel name that never updates when it shouldLeaving multiple `useConnectionStatus()` instances across components, creating redundant listeners**Stale callback**: If the callback closure captures stale state, the handler acts on outdated data**Channel name mismatch**: If the channel name prop changes without a key change, old subscription persists**Echo not configured**: Hooks fail silently or throw if Echo instance is not available**Multiple rapid re-renders**: Subscription/unsubscription cycles on every render if dependencies are unstable**Context loss on reconnect**: Reconnection clears subscriptions; hooks should re-subscribe on `reconnected` event`@laravel/echo-react` for React 18+ applications (including Inertia.js)`@laravel/echo-vue` for Vue 3 + Inertia.js or standalone Vue applications`@laravel/echo-svelte` for Svelte 5 applications using runesStarter kits (Breeze, Jetstream) use framework-specific packages in their stacksAll packages are installed by `php artisan install:broadcasting` for the corresponding starter kitK09: Laravel Echo Core APIK11: Public/Private/Presence Channel PatternsK19: Real-Time Notifications (Broadcast + Database)K30: Model Broadcasting (BroadcastsEvents Trait)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
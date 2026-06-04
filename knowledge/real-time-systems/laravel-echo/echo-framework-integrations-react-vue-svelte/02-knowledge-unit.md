# Metadata
Domain: Real-Time Systems
Subdomain: Client-Side Subscriptions (Echo)
Knowledge Unit: Echo Framework Integrations (React/Vue/Svelte)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Laravel Echo provides first-party framework-specific packages for React, Vue 3, and Svelte 5 that expose reactive hooks and composables for subscribing to broadcast channels. The `@laravel/echo-react` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, and `useEchoModel` hooks. The `@laravel/echo-vue` package provides `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`, `useConnectionStatus`, and `configureEcho`. The `@laravel/echo-svelte` package provides equivalent rune-based hooks for Svelte 5's `$state` and `$effect` runes. All packages handle automatic channel cleanup on component unmount, preventing callback leaks and stale subscriptions. The `useConnectionStatus()` hook is available across all frameworks, providing reactive connection state: connected, connecting, reconnecting, disconnected, failed.

## Core Concepts
Each framework integration wraps Echo's core API in framework-native reactivity primitives. React hooks use `useEffect` for lifecycle management, Vue composables use `onMounted`/`onUnmounted`, and Svelte uses `$effect` runes. The hooks accept a channel name, event name(s), and a callback. They return lifecycle control methods (`leaveChannel`, `leave`, `stopListening`, `listen`). The `useEcho` hook (for private channels) is the primary API; `useEchoPublic` and `useEchoPresence` are convenience wrappers. The `useEchoModel` hook specifically handles model broadcasting events, accepting a model class name and ID.

## Mental Models
These hooks are "reactive bridges" between Echo's imperative channel API and the framework's declarative component model. They ensure that when a component mounts, it subscribes; when it unmounts, it unsubscribes—automatically.

## Internal Mechanics
Each hook internally manages the Echo channel instance. On mount, it calls `Echo.private(channel)` (or `channel()` / `join()`) and registers event listeners via `.listen()`. On unmount, it calls `.leave()` or `.leaveChannel()` to clean up. The `stopListening()` method removes the specific event callback without leaving the channel. The `leave()` method leaves the channel and all associated state. The `useConnectionStatus()` hook attaches listeners to the Echo connector's `connected`, `disconnected`, `connecting`, `reconnecting`, and `failed` events, updating reactive state accordingly.

## Patterns
- **Automatic lifecycle management**: Subscribe on mount, unsubscribe on unmount
- **Returned control methods**: `leaveChannel`, `leave`, `stopListening`, `listen` for manual control
- **Convenience wrappers**: `useEchoPublic` and `useEchoPresence` avoid needing to specify channel type
- **Reactive connection status**: Centralized hook for displaying connection state in UI
- **Model broadcasting bridge**: `useEchoModel` subscribes to the correct private channel based on model type

## Architectural Decisions
- **Framework-specific packages**: Separate packages avoid cross-framework dependency bloat
- **Hooks return control methods**: Rather than pure subscriptions, hooks return imperative control for flexibility
- **useEcho as private-channel default**: Private channels are the most common use case for real-time features

## Tradeoffs
- **Per-component subscription cost**: Each hook call creates a subscription; many components subscribing to different channels increases overhead
- **Hook state management**: Connection status state is local to the component tree; sharing across components requires context/prop drilling or a global store
- **Framework coupling**: Mixing framework packages is not possible; each project must use its corresponding package
- **Learning surface shift**: Developers need to understand both Echo's core API and the framework-specific hook API

## Performance Considerations
- Hooks use native reactive primitives with minimal overhead
- `useEchoModel` subscribes to a single channel per model instance; many model instances = many subscriptions
- `useConnectionStatus()` should ideally be called once at a high component level and passed down, not called in every child component
- Callback closures are recreated on each render; stable callback references (via `useCallback` / `computed`) reduce subscription churn

## Production Considerations
- Configure Echo before using any hooks (via `configureEcho` in Vue, or Echo setup in React/Svelte)
- Ensure `leaveChannel()` is called during optimistic UI updates where the subscription target changes
- Use `useConnectionStatus()` for connection health indicators in the UI
- Avoid creating new Echo instances per component—hooks use the globally configured Echo instance
- Test that channel cleanup occurs correctly during component unmount in complex component trees

## Common Mistakes
- Not calling `configureEcho` in Vue before using `useEcho` (hook throws without configured Echo)
- Using `useEcho` (private) when `useEchoPublic` is sufficient for public channels
- Forgetting to pass a stable array reference for multiple events (causes infinite re-subscription loops)
- Calling `useEcho` with a non-reactive channel name that never updates when it should
- Leaving multiple `useConnectionStatus()` instances across components, creating redundant listeners

## Failure Modes
- **Stale callback**: If the callback closure captures stale state, the handler acts on outdated data
- **Channel name mismatch**: If the channel name prop changes without a key change, old subscription persists
- **Echo not configured**: Hooks fail silently or throw if Echo instance is not available
- **Multiple rapid re-renders**: Subscription/unsubscription cycles on every render if dependencies are unstable
- **Context loss on reconnect**: Reconnection clears subscriptions; hooks should re-subscribe on `reconnected` event

## Ecosystem Usage
- `@laravel/echo-react` for React 18+ applications (including Inertia.js)
- `@laravel/echo-vue` for Vue 3 + Inertia.js or standalone Vue applications
- `@laravel/echo-svelte` for Svelte 5 applications using runes
- Starter kits (Breeze, Jetstream) use framework-specific packages in their stacks
- All packages are installed by `php artisan install:broadcasting` for the corresponding starter kit

## Related Knowledge Units
- K09: Laravel Echo Core API
- K11: Public/Private/Presence Channel Patterns
- K19: Real-Time Notifications (Broadcast + Database)
- K30: Model Broadcasting (BroadcastsEvents Trait)

## Research Notes
The framework-specific Echo packages were released alongside Laravel 11 and have matured significantly through 2025-2026. The Svelte 5 integration uses runes (`$state`, `$effect`) native to Svelte 5. The React hooks use standard `useEffect` and `useCallback` patterns. The Vue composables use Vue 3's Composition API. All packages are part of the `laravel/echo` monorepo on GitHub. Version alignment across packages is maintained (all at v2.3.4 as of April 2026).

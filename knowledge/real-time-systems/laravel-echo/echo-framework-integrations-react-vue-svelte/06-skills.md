# Skill: Integrate Echo Framework Hooks in React/Vue/Svelte

## Purpose
Use `@laravel/echo-react`, `@laravel/echo-vue`, or `@laravel/echo-svelte` framework-specific packages for reactive real-time subscriptions with automatic lifecycle management.

## When To Use
- React 18+ applications using `@laravel/echo-react`
- Vue 3 + Inertia.js or standalone Vue apps using `@laravel/echo-vue`
- Svelte 5 applications using `@laravel/echo-svelte`
- Any Laravel frontend using the corresponding starter kit

## When NOT To Use
- Vanilla JavaScript applications (use Echo core API directly)
- Projects using older framework versions without hook support

## Prerequisites
- Echo configured globally before using hooks
- Framework-specific Echo package installed (`@laravel/echo-react`, `@laravel/echo-vue`, `@laravel/echo-svelte`)
- Broadcast driver configured on the Laravel backend

## Inputs
- Channel name (string or reactive ref)
- Event name-to-callback mapping object
- Component lifecycle context

## Workflow
1. Install the framework-specific Echo package: `npm install @laravel/echo-{framework}`
2. Configure Echo globally at app bootstrap (React: before `createRoot`, Vue: `configureEcho()`)
3. Import the hook: `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`
4. Use `useEchoPublic` for public channels (skips auth request)
5. Use `useEcho` for private channels (triggers auth)
6. Pass reactive channel names (use `useMemo`/`computed`/`$derived` for reactivity)
7. Provide stable callback references to prevent re-subscription loops
8. Call `useConnectionStatus()` once at a high component level
9. Handle `leaveChannel` return value for manual cleanup if needed
10. Test lifecycle: mount component, verify subscription, unmount, verify cleanup

## Validation Checklist
- [ ] Echo configured before any hook is called
- [ ] `useEchoPublic` used for public channels, `useEcho` for private
- [ ] Channel names are reactive and update correctly when props change
- [ ] Callback references are stable (memoized) to prevent re-subscription loops
- [ ] `useConnectionStatus()` called at appropriate component level (not per-child)
- [ ] Subscriptions clean up correctly on component unmount

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Hook throws at mount | Echo not configured before hook call | Ensure Echo is created/configured before rendering |
| Infinite re-subscription loop | Unstable callback reference | Wrap callbacks in `useCallback` or stable function ref |
| Channel never updates | Non-reactive channel name | Use `computed()` or `useMemo()` for derived channel names |
| Events never received | Namespace misconfigured | Set `namespace: ''` when using `broadcastAs()` |

## Decision Points
- **`useEcho` vs `useEchoPublic`**: Use `useEchoPublic` for public channels to avoid unnecessary auth overhead
- **`useConnectionStatus()` placement**: Call once at a root/layout component and pass down via context

## Performance/Security Considerations
- Stable callback references prevent re-subscription loops and memory leaks
- `useConnectionStatus()` should be called once at a high level, not per child component
- Channel names should be sanitized if derived from user input
- Presence channel user data is visible to all subscribers—keep minimal

## Related Rules (from 05-rules.md)
- Always Configure Echo Before Using Framework Hooks
- Use `useEchoPublic` for Public Channels, Not `useEcho`
- Always Provide Stable Callback References to Prevent Re-Subscription Loops
- Always Call `useConnectionStatus()` at a High Component Level
- Always Make Channel Names Reactive

## Related Skills
- Configure Echo Core API for Frontend Subscriptions
- Set Up Real-Time Notifications with Broadcast + Database

## Success Criteria
- Components subscribe to channels on mount and unsubscribe on unmount
- No memory leaks from orphaned subscriptions
- Connection status is shown consistently across the app
- Channel subscriptions update reactively when route params change

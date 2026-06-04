# Metadata

**Domain:** real-time-systems
**Subdomain:** laravel-echo
**Knowledge Unit:** echo-framework-integrations-react-vue-svelte
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `useConnectionStatus()` is called at an appropriate component level
- [ ] `useEchoPublic` is used for public channels, `useEcho` for private
- [ ] Callback references are stable to prevent re-subscription loops
- [ ] Always Call useConnectionStatus() at a High Component Level
- [ ] Always Clean Up Subscriptions on Component Unmount
- [ ] Always Configure Echo Before Using Framework Hooks
- [ ] Always Make Channel Names Reactive
- [ ] Always Provide Stable Callback References to Prevent Re-Subscription Loops
- [ ] `useConnectionStatus()` called at appropriate component level (not per-child)
- [ ] `useEchoPublic` used for public channels, `useEcho` for private
- [ ] Callback references are stable (memoized) to prevent re-subscription loops
- [ ] Call `useConnectionStatus()` once at a high component level
- [ ] Configure Echo globally at app bootstrap (React: before `createRoot`, Vue: `configureEcho()`)
- [ ] Handle `leaveChannel` return value for manual cleanup if needed
- [ ] Channel subscriptions update reactively when route params change
- [ ] Components subscribe to channels on mount and unsubscribe on unmount
- [ ] Connection status is shown consistently across the app

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Call `useConnectionStatus()` once at a high component level
- [ ] Configure Echo globally at app bootstrap (React: before `createRoot`, Vue: `configureEcho()`)
- [ ] Handle `leaveChannel` return value for manual cleanup if needed
- [ ] Import the hook: `useEcho`, `useEchoPublic`, `useEchoPresence`, `useEchoModel`
- [ ] Install the framework-specific Echo package: `npm install @laravel/echo-{framework}`
- [ ] Pass reactive channel names (use `useMemo`/`computed`/`$derived` for reactivity)
- [ ] Provide stable callback references to prevent re-subscription loops
- [ ] Test lifecycle: mount component, verify subscription, unmount, verify cleanup
- [ ] Use `useEcho` for private channels (triggers auth)
- [ ] Use `useEchoPublic` for public channels (skips auth request)
- [ ] Always Call useConnectionStatus() at a High Component Level
- [ ] Always Clean Up Subscriptions on Component Unmount

---

# Performance Checklist

- [ ] `useConnectionStatus()` should be called once at a high level, not in every child component
- [ ] `useEchoModel` subscribes to one channel per model instance; many instances = many subscriptions
- [ ] Callback closures are recreated on each render; stable references reduce subscription churn
- [ ] Hooks use native reactive primitives with minimal overhead
- [ ] `useConnectionStatus()` should be called once at a high level, not per child component
- [ ] Stable callback references prevent re-subscription loops and memory leaks

---

# Security Checklist

- [ ] Channel names in hooks should be sanitized if derived from user input
- [ ] Presence channel user data is visible to all subscribersâ€”be mindful of data exposure
- [ ] Token-based auth headers are sent with every auth request; ensure tokens are short-lived
- [ ] Channel names should be sanitized if derived from user input

---

# Reliability Checklist

- [ ] Channel never updates
- [ ] Events never received
- [ ] Hook throws at mount
- [ ] Infinite re-subscription loop
- [ ] Always Call useConnectionStatus() at a High Component Level
- [ ] Always Clean Up Subscriptions on Component Unmount
- [ ] Always Configure Echo Before Using Framework Hooks
- [ ] Always Make Channel Names Reactive
- [ ] Always Provide Stable Callback References to Prevent Re-Subscription Loops

---

# Testing Checklist

- [ ] `useConnectionStatus()` called at appropriate component level (not per-child)
- [ ] `useConnectionStatus()` is called at an appropriate component level
- [ ] `useEchoPublic` is used for public channels, `useEcho` for private
- [ ] `useEchoPublic` used for public channels, `useEcho` for private
- [ ] Callback references are stable (memoized) to prevent re-subscription loops
- [ ] Callback references are stable to prevent re-subscription loops
- [ ] Channel names are reactive and update correctly when props change
- [ ] Channel subscriptions update reactively when route params change
- [ ] Components subscribe to channels on mount and unsubscribe on unmount
- [ ] Connection status is shown consistently across the app

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using useEcho for Public Channels]
- [ ] [Unstable Callback References Causing Re-Subscription Loops]
- [ ] [Multiple useConnectionStatus() Calls]
- [ ] [Non-Reactive Channel Names]
- [ ] [Hooks Without Echo Configured First]
- [ ] No lifecycle management
- [ ] Over-subscription
- [ ] Per-component Echo instances

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md



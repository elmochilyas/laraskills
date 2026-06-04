# Metadata

**Domain:** real-time-systems
**Subdomain:** laravel-echo
**Knowledge Unit:** laravel-echo-core-api
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `authEndpoint` and `auth.headers` are configured for private channels
- [ ] `forceTLS: true` in production
- [ ] `pusher-js` is installed when using Reverb or Pusher backends
- [ ] Always Call leave() or leaveChannel() on Component Unmount
- [ ] Always Configure authEndpoint and auth.headers for Private Channels
- [ ] Always Install pusher-js When Using Reverb or Pusher Backends
- [ ] Always Monitor Connection Status
- [ ] Always Set forceTLS: true in Production
- [ ] `authEndpoint` and `auth.headers` configured for private channels
- [ ] `forceTLS: true` in production
- [ ] `leave()` or `leaveChannel()` called on component unmount
- [ ] Clean up subscriptions on component unmount: `.leave()` or `.stopListening()`
- [ ] Configure with correct broadcaster (`reverb` or `pusher`), key, host, and port
- [ ] Create a single global Echo instance at app bootstrap
- [ ] Channels subscribe successfully (public, private, presence)
- [ ] Connection status is displayed and handled appropriately
- [ ] Echo connects to the configured broadcast backend

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Clean up subscriptions on component unmount: `.leave()` or `.stopListening()`
- [ ] Configure with correct broadcaster (`reverb` or `pusher`), key, host, and port
- [ ] Create a single global Echo instance at app bootstrap
- [ ] Handle sender exclusion: Echo auto-injects `X-Socket-ID` for `toOthers()`
- [ ] Install dependencies: `npm install laravel-echo pusher-js`
- [ ] Listen for events: `.listen('EventName', callback)`
- [ ] Monitor connection state via `Echo.connector.pusher.connection` state changes
- [ ] Set `authEndpoint` and `auth.headers` with Bearer token for private channels
- [ ] Set `forceTLS: true` in production and `namespace: ''` with `broadcastAs()`
- [ ] Subscribe to channels: `Echo.channel()`, `Echo.private()`, `Echo.join()`
- [ ] Always Call leave() or leaveChannel() on Component Unmount
- [ ] Always Configure authEndpoint and auth.headers for Private Channels

---

# Performance Checklist

- [ ] Each `listen()` callback is registered in memory; thousands of listeners may impact performance
- [ ] Event payload parsing overhead is negligible for typical payload sizes
- [ ] Reconnection overhead depends on backoff strategy configured in the connector
- [ ] Single WebSocket connection shared across all subscriptions (efficient)
- [ ] Single Echo instance = single WebSocket connection shared across all subscriptions

---

# Security Checklist

- [ ] Auth endpoint URL is configured client-side; ensure it points to correct, TLS-protected endpoint
- [ ] Bearer tokens in `auth.headers` are accessible in client-side code
- [ ] CORS configuration must allow the Echo origin to access the auth endpoint
- [ ] Socket ID is exposed to the server via `X-Socket-ID` header for `toOthers()` exclusion
- [ ] `forceTLS: true` prevents unencrypted `ws://` fallback
- [ ] Bearer tokens in `auth.headers` are accessible in client-side codeâ€”use short-lived tokens

---

# Reliability Checklist

- [ ] Echo never connects
- [ ] Events never received client-side
- [ ] Memory leak over time
- [ ] Private subscriptions fail
- [ ] WebSocket connects over `ws://`
- [ ] Always Call leave() or leaveChannel() on Component Unmount
- [ ] Always Configure authEndpoint and auth.headers for Private Channels
- [ ] Always Install pusher-js When Using Reverb or Pusher Backends
- [ ] Always Monitor Connection Status
- [ ] Always Set forceTLS: true in Production

---

# Testing Checklist

- [ ] `authEndpoint` and `auth.headers` are configured for private channels
- [ ] `authEndpoint` and `auth.headers` configured for private channels
- [ ] `forceTLS: true` in production
- [ ] `leave()` or `leaveChannel()` called on component unmount
- [ ] `namespace: ''` set when server events use `broadcastAs()`
- [ ] `pusher-js` installed when using Reverb or Pusher backends
- [ ] `pusher-js` is installed when using Reverb or Pusher backends
- [ ] Channel cleanup (`leave()`) is called on component unmount
- [ ] Channels subscribe successfully (public, private, presence)
- [ ] Connection status changes handled in the UI

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No leave() on Component Unmount]
- [ ] [Multiple Echo Instances Per Application]
- [ ] [Namespace Misconfigured With broadcastAs()]
- [ ] [Missing pusher-js Dependency]
- [ ] [No Connection Status Monitoring]
- [ ] Manual socket ID management
- [ ] Multiple Echo instances
- [ ] No leave on unmount

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



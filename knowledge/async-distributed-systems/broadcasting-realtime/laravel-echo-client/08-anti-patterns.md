---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K033 — Laravel Echo Client-Side Consumption
Knowledge ID: K033
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Not Calling `Echo.leave()` on Component Unmount | Performance/Memory | High |
| 2 | Heavy Computation in `listen()` Callbacks | Performance | Medium |
| 3 | Using Echo for API Calls (Client-to-Server) | Architecture | Medium |
| 4 | Echo in SSR Context Without Guard | Configuration | High |
| 5 | Global Echo Instance Attached to Window | Design | Low |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Zombie Channel Subscriptions (missing leave) | High — memory leaks accumulate with SPA navigation | Enforce cleanup in component lifecycle hooks |
| Main Thread Blocking (heavy callbacks) | Medium — stuttering UI on each broadcast event | Keep callbacks to state updates only; offload heavy work |
| Event Name Mismatch (`broadcastAs` vs `listen`) | High — most common Echo debugging issue | Use shared event name constants between server and client |

---

## 1. Not Calling `Echo.leave()` on Component Unmount

### Category
Performance / Memory

### Description
Subscribing to broadcast channels in component lifecycle hooks (mounted, created) without corresponding `Echo.leave()` or `Echo.leaveChannel()` calls in cleanup hooks (beforeUnmount, onUnmounted, destroy). Callbacks accumulate on every mount, causing memory leaks and duplicate event handling.

### Why It Happens
- Framework-agnostic Echo usage without considering component lifecycle
- Vue/React developers forget cleanup methods
- Single-page applications where components mount/unmount frequently
- Copy-paste from examples that don't show cleanup
- Assuming Echo subscription is globally managed (it's per-component)

### Warning Signs
- Memory usage grows with each navigation in SPA
- Broadcast event triggers the same callback multiple times
- After navigating back and forth, `listen()` callbacks fire N times for N visits
- Browser memory profiling shows Echo channel objects accumulating
- UI updates happen multiple times per broadcast event

### Why Harmful
- Each component mount adds a new subscription without removing the old one
- Memory grows linearly with navigation actions — not freed until page reload
- Each broadcast event triggers N callbacks instead of 1 — N grows unbounded
- Performance degrades over session time
- Side effects (HTTP calls, state updates) happen multiple times per event

### Consequences
- Memory leak crash for long-lived SPAs
- Duplicate API calls on each broadcast event
- UI flickers (state set multiple times)
- Reduced battery life on mobile
- Event handling becomes slower as session progresses

### Alternative
- Always pair `Echo.private()` / `Echo.channel()` with `Echo.leave()` in cleanup
- In Vue: `mounted()` → subscribe, `beforeUnmount()` → leave
- In React: `useEffect()` → subscribe, return cleanup function → leave

### Refactoring Strategy
1. Identify all components with Echo subscriptions
2. Verify each has a corresponding leave call
3. Add `Echo.leave('channel-name')` in cleanup lifecycle
4. Test component mount/unmount cycle — verify single callback per event
5. Profile memory after 100 navigation cycles

### Detection Checklist
- [ ] Every component with `Echo.listen()` has `Echo.leave()` in cleanup
- [ ] Callback fires exactly once per broadcast event
- [ ] Memory usage stabilizes over session lifetime
- [ ] No duplicate side effects on broadcast events
- [ ] SPA navigation doesn't accumulate subscriptions

### Related Rules
- call-echo-leave-on-unmount

### Related Skills
- Set Up Laravel Echo Client-Side Consumption

### Related Decision Trees
- Echo + WebSocket vs Polling for Real-Time Updates

---

## 2. Heavy Computation in `listen()` Callbacks

### Category
Performance

### Description
Performing heavy computation, synchronous API calls, or expensive DOM manipulations inside Echo `listen()` callbacks. These callbacks run on the browser's main thread — heavy work blocks UI rendering and user interaction.

### Why It Happens
- Developer treats the callback as a regular function without considering threading
- Data processing logic is placed inline instead of deferred
- Framework state updates trigger expensive re-renders
- Not profiling callback execution time
- Copy-paste from other event handlers that are not real-time

### Warning Signs
- UI freezes or stutters when broadcast events arrive
- Frame rate drops during real-time updates
- `listen()` callback contains `fetch()`, `axios()`, or heavy loops
- Browser DevTools performance recording shows long tasks on broadcast events
- User reports "lag" during real-time interactions

### Why Harmful
- Main thread is blocked during callback execution
- All UI updates, user interactions, and animations freeze
- Each broadcast event causes perceptible stutter
- Heavy callbacks can cause cumulative blocking at high event frequency
- CSS animations, typing, scrolling all affected

### Consequences
- Poor user experience — app feels sluggish
- Missed user input during callback execution
- Higher CPU usage, battery drain on mobile
- Event processing backlog — callback queue grows
- Frame drops in animated real-time features (chat, live cursors)

### Alternative
- Keep callbacks lightweight — only update reactive state:
  ```javascript
  Echo.private('orders.1').listen('OrderShipped', (e) => {
      this.status = e.status; // Fast — just sets a property
  });
  ```
- Offload heavy processing to Web Workers or `requestAnimationFrame`
- Batch updates if events arrive faster than rendering

### Refactoring Strategy
1. Profile `listen()` callback execution time
2. Move heavy computation out of callback
3. Use `requestAnimationFrame` or `setTimeout` for non-critical work
4. Consider Web Workers for data processing
5. Test with rapid event bursts — verify no frame drops

### Detection Checklist
- [ ] `listen()` callbacks contain only state updates
- [ ] No synchronous API calls or heavy loops in callbacks
- [ ] Callback execution time under 16ms (1 frame at 60fps)
- [ ] Profiling shows no long tasks from broadcast events
- [ ] UI remains responsive during rapid event bursts

### Related Rules
- keep-callbacks-lightweight

### Related Skills
- Set Up Laravel Echo Client-Side Consumption

### Related Decision Trees
- Echo + WebSocket vs Polling for Real-Time Updates

---

## 3. Using Echo for API Calls (Client-to-Server)

### Category
Architecture

### Description
Using Echo's whisper or channel mechanisms to send data from client to server, instead of standard HTTP requests. Echo is designed for server-to-client push — using it for client-to-server communication creates complexity, reliability issues, and security concerns.

### Why It Happens
- "Real-time" mindset — developer thinks all communication should go through WebSocket
- Not knowing that whisper messages are one-directional (client→client, not client→server)
- Server-side Echo subscription to catch whisper messages (unsupported antipattern)
- Convenience — Echo is already set up, so why not reuse it
- Misunderstanding that broadcasting supports bidirectional communication

### Warning Signs
- Server-side code listens for whisper events
- Client sends data via `Echo.whisper()` that the server consumes
- HTTP endpoints are duplicated in WebSocket channels
- Application has no REST/GraphQL API for feature data
- Whisper messages are used for data persistence, not ephemeral notification

### Why Harmful
- Whispers are ephemeral — not persisted, not guaranteed delivery
- Echo is not designed for client-to-server — no server-side event listener exists
- Server cannot receive whisper messages without unsupported hacks
- Loss of HTTP features: status codes, caching, idempotency, content negotiation
- Authentication errors from mixing broadcasting auth with data mutation auth

### Consequences
- Data loss from missed whisper messages
- No server-side processing guarantee (whispers are fire-and-forget)
- Security issues (broadcasting auth vs mutation auth are different)
- Debugging complexity — data flow is unclear
- No request/response pattern — client never knows if server received the data

### Alternative
- Use standard HTTP requests (POST, PUT, DELETE) for client-to-server data
- Use Echo only for receiving real-time server push
- Use whispers only for ephemeral client-to-client messages (typing indicators, cursors)

### Refactoring Strategy
1. Identify all client-to-server data sent via Echo
2. Replace with HTTP endpoints (fetch, axios)
3. Remove server-side whisper handling code
4. Keep Echo only for receiving broadcast events
5. Test data flow with HTTP requests

### Detection Checklist
- [ ] Echo is used only for receiving broadcast events (server→client)
- [ ] All client→server data uses HTTP requests
- [ ] Whispers used only for ephemeral client→client messages
- [ ] No server-side code processes whisper events
- [ ] Data mutations have proper HTTP endpoints with auth

### Related Rules
- keep-callbacks-lightweight

### Related Skills
- Set Up Laravel Echo Client-Side Consumption

### Related Decision Trees
- Echo + WebSocket vs Polling for Real-Time Updates

---

## 4. Echo in SSR Context Without Guard

### Category
Configuration

### Description
Importing and initializing Laravel Echo in a server-side rendering context (Nuxt, Next, Inertia SSR) without guarding against the absence of browser APIs. Echo uses `window`, `WebSocket`, and other browser globals that are undefined during SSR.

### Why It Happens
- Developer uses Echo in a framework that supports SSR without checking execution context
- Copy-paste from client-side-only examples
- Not knowing that Echo requires browser APIs
- Assuming all JavaScript runs in browser context
- Nuxt/Next configuration that doesn't separate client and server code

### Warning Signs
- SSR build fails with `ReferenceError: window is not defined`
- Application crashes on initial server render (before any browser code runs)
- Error stack trace points to `laravel-echo` import
- Building for production fails when SSR is enabled
- Only client-side rendering works, server render is broken

### Why Harmful
- SSR build fails entirely — application cannot be deployed
- Server-side rendering is broken for all pages, not just real-time ones
- SEO impact — server-rendered content is missing
- First paint is delayed (no SSR content)
- Framework's SSR optimization is deactivated

### Consequences
- Deployment pipeline fails
- SEO degradation (no server-rendered HTML)
- Increased Time to First Paint (TTFP) — users see blank page longer
- Waterfall effect: JS loads → client renders → content appears
- Framework SSR features cannot be used

### Alternative
- Guard Echo initialization with `typeof window !== 'undefined'`:
  ```javascript
  let Echo;
  if (typeof window !== 'undefined') {
      Echo = new Echo({ ... });
  }
  ```
- Use dynamic imports with client-only flag in SSR frameworks
- Separate Echo-related code into client-only plugins

### Refactoring Strategy
1. Find all Echo import and initialization sites
2. Add `typeof window !== 'undefined'` guard around Echo usage
3. Use dynamic `import()` for Echo module in SSR frameworks
4. Configure SSR framework to exclude Echo from server bundle
5. Verify SSR build succeeds and client-side Echo works

### Detection Checklist
- [ ] All Echo imports guarded with `typeof window !== 'undefined'`
- [ ] SSR build succeeds without ReferenceError
- [ ] Client-side Echo works after hydration
- [ ] No Echo code in server-rendered HTML
- [ ] SSR framework configured for client-only Echo plugin

### Related Rules
- guard-echo-in-ssr-contexts

### Related Skills
- Set Up Laravel Echo Client-Side Consumption

### Related Decision Trees
- Echo + WebSocket vs Polling for Real-Time Updates

---

## 5. Global Echo Instance Attached to Window

### Category
Design

### Description
Attaching the Echo instance to `window.Echo` as a global variable instead of using module imports and dependency injection. This pollutes the global namespace, makes testing difficult, and violates module encapsulation.

### Why It Happens
- Laravel's default scaffolding creates `window.Echo = new Echo(...)`
- Tutorials commonly show `window.Echo` for simplicity
- Legacy code from before ES module adoption
- Convenience — any script can access `window.Echo` without imports
- Not considering testability or module boundaries

### Warning Signs
- `window.Echo` assignment in the codebase
- Components access `window.Echo` instead of imported instance
- Tests must mock `window.Echo` global
- Multiple scripts depend on the global being set
- Echo instance is not injectable — tightly coupled to global state

### Why Harmful
- Global namespace pollution
- All code depends on implicit global — hidden coupling
- Testing requires global mock setup and teardown
- Only one Echo instance per page — cannot scope to different backends
- Module bundlers cannot tree-shake Echo usage

### Consequences
- Test setup is complicated (must mock global)
- Cannot run multiple Echo instances for different apps
- Refactoring is hard — unknown consumers of the global
- SSR guard must also protect the global assignment
- Code review: globals are an anti-pattern in modern JS

### Alternative
- Export Echo from a module file:
  ```javascript
  // lib/echo.js
  import Echo from 'laravel-echo';
  export default new Echo({ ... });
  ```
- Import where needed: `import Echo from '@/lib/echo'`
- Pass Echo instance as dependency to components or use provide/inject

### Refactoring Strategy
1. Create `lib/echo.js` that exports configured Echo instance
2. Update all components to import Echo from this module
3. Remove `window.Echo` assignment
4. Update test setup to mock the module instead of global
5. Verify SSR guard still works with module approach

### Detection Checklist
- [ ] No `window.Echo` assignment in codebase
- [ ] Echo imported from module file, not global
- [ ] Tests mock Echo module, not global
- [ ] Multiple instances possible if needed
- [ ] Module bundler can tree-shake unused Echo code

### Related Rules
- call-echo-leave-on-unmount

### Related Skills
- Set Up Laravel Echo Client-Side Consumption

### Related Decision Trees
- Echo + WebSocket vs Polling for Real-Time Updates

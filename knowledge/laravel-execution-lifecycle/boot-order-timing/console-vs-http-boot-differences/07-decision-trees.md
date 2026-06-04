# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Console vs HTTP Boot Differences
**Generated:** 2026-06-03

---

# Decision Inventory

1. Context-Aware Registration: Service registration for HTTP vs Console contexts
2. Middleware-Dependent Code: Using middleware-provided state in console commands
3. Testing Strategy: Testing code that behaves differently in CLI vs HTTP

---

# Architecture-Level Decision Trees

---

## Decision Name: Context-Aware Service Registration

---

## Decision Context

Deciding whether to register services conditionally based on the execution context (HTTP vs Console).

---

## Decision Criteria

* performance — conditional registration avoids loading HTTP-only services in CLI
* architectural — Console and HTTP kernels share the same Application instance
* security — middleware-dependent services should not load in CLI (no middleware pipeline)
* maintainability — conditional registration is clear but must be used consistently

---

## Decision Tree

Does the service depend on middleware-provided state (session, auth, CSRF)?
↓
YES → Guard with `$this->app->runningInConsole()` — register only for HTTP context
NO → Is the service only used in Console commands (scheduler, command handlers)?
↓
YES → Guard with `$this->app->runningInConsole()` — register only for CLI context
NO → Is the service used in both contexts (repositories, domain services)?
↓
YES → Register unconditionally — shared services belong in both contexts
NO → Register unconditionally — if in doubt, register for both contexts

---

## Rationale

The Console kernel has no middleware pipeline — session, auth, CSRF, and other request-scoped services are not available. Services that depend on middleware-provided state should only be registered in HTTP context. Conversely, CLI-only services (command-only providers) should be registered only in console context. Unconditionally shared services (repositories, domain services) should be registered without guards.

---

## Recommended Default

**Default:** Register shared services unconditionally; use `runningInConsole()` guards only for services explicitly tied to one context.
**Reason:** Minimizes conditional logic; only guard when context truly matters.

---

## Risks Of Wrong Choice

- HTTP service in console: runtime error when resolving session/auth/CSRF — null pointer or missing binding.
- Console service in HTTP: unnecessary memory overhead loading CLI-only services on web requests.
- No guard where needed: command works in dev but fails in production CLI environment.

---

## Related Rules

- Guard console-specific provider registration (05-rules.md, Rule 1)
- Never depend on middleware state in console commands (05-rules.md, Rule 2)

---

## Related Skills

- Implement Console Commands (console-kernel-dispatch)

---

## Decision Name: Middleware-Dependent Code Safety

---

## Decision Context

Determining whether code that uses auth, session, or other middleware-provided services is safe to run in a console command.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — Console kernel has no middleware pipeline; no session, auth, or CSRF
* security — accessing auth in console returns null; session throws
* maintainability — commands should be self-contained using arguments and options

---

## Decision Tree

Does the code access `auth()`, `session()`, or `csrf_token()`?
↓
YES → UNSAFE in console — these depend on middleware that does not run in CLI
NO → Does the code access `request()` or `Request::` facade?
↓
YES → UNSAFE in console — no HTTP request object available in CLI
NO → Does the code access cookies, uploaded files, or encrypted cookies?
↓
YES → UNSAFE in console — these are HTTP-specific, middleware-dependent services
NO → Does the code use `$this->argument()` or `$this->option()` for input?
↓
YES → SAFE — command arguments/options are the correct input mechanism for CLI
NO → SAFE — use direct container resolution with `app()` for services

---

## Rationale

Console commands must use command arguments, options, and direct container resolution for input. Middleware-provided state (session, auth, CSRF, request) does not exist in the console context. The safest pattern is to never access middleware-dependent services in command `handle()` methods.

---

## Recommended Default

**Default:** Use `$this->argument()`, `$this->option()`, and `$this->choice()` for command input; use `app()->make(Service::class)` for container resolution.
**Reason:** Console-safe patterns that do not depend on HTTP middleware.

---

## Risks Of Wrong Choice

- Accessing `auth()->user()` in command: returns `null` — silent failure, not an error.
- Accessing `session()` in command: throws `RuntimeException` — session not available.
- Accessing `request()` in command: returns null or throws depending on runtime context.

---

## Related Rules

- Never depend on middleware state in console commands (05-rules.md, Rule 2)
- Test console commands in CI separately from HTTP tests (05-rules.md, Rule 3)

---

## Related Skills

- Implement Console Commands (console-kernel-dispatch)

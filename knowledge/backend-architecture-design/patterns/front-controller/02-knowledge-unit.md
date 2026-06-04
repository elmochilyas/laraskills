# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Front Controller pattern
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Front Controller centralizes all incoming requests through a single handler, which performs common pre-processing (routing, authentication, logging) before delegating to appropriate actions. In Laravel, `public/index.php` and the routing layer implement Front Controller — all HTTP requests enter through index.php, which bootstraps the application and passes control to the router. The pattern centralizes cross-cutting concerns, eliminates duplicate code across pages, and enables clean application-wide behavior injection.

---

# Core Concepts

- Single entry point: all requests handled by one file/class
- Common pre-processing: routing, auth, session, CSRF
- Request dispatch: delegates to appropriate handler
- Centralized configuration: middleware, error handling, logging
- Separation: application logic doesn't know about HTTP handling

---

# Mental Models

- **Reception Desk**: All visitors go to reception first, who directs them appropriately
- **Airport Control Tower**: All flights routed through central control
- **Switchboard**: All calls go through operator who routes to correct extension

---

# Internal Mechanics

Laravel `index.php` requires Composer autoloader, creates application instance, sets up kernel, sends request through middleware pipeline → router → controller. The kernel handles error conversion, maintenance mode checks, and HTTP method spoofing. Front Controller ensures every request goes through same bootstrap sequence.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Front Controller (Laravel kernel) | Centralized request handling | Consistent pre-processing, security | Single point of failure, bottleneck |
| Page Controller (alternative) | Per-page handling | Simple, no routing | Duplicate cross-cutting code |
| Middleware Pipeline | Pre/post processing | Composable behavior | Middleware order matters |

---

# Architectural Decisions

- Front Controller is standard for all Laravel applications — non-negotiable
- Use Page Controller only in: legacy apps or simple scripts without framework
- Extend Front Controller via: middleware, not by modifying index.php
- Add cross-cutting behavior in: middleware, service providers, not in controllers

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized cross-cutting logic | Single entry point becomes bottleneck | If index.php fails, app is down |
| Consistent request lifecycle | Must go through entry point for all routes | Static files bypass (handled by web server) |
| Easy to add application-wide behavior | Entry point must handle all request types | Complex kernel for different SAPI (HTTP, CLI, queue) |

---

# Performance Considerations

- Front Controller overhead: bootstrap cost on every request
- Laravel bootstrap (index.php → kernel → router) ~20-50ms
- Octane: boot once, handle many requests — amortizes bootstrap cost
- Static file serving: bypasses Front Controller (web server handles directly)
- Route caching: reduces route registration overhead

---

# Production Considerations

- OpCache: ensure index.php and all bootstrapped files are cached
- Octane for high-traffic apps to amortize bootstrap cost
- Monitor 500 errors (kernel exception handling is critical path)
- Don't modify index.php directly — extend via middleware/service providers
- Health check endpoints handled through same Front Controller

---

# Common Mistakes

- Adding logic to index.php → not testable, bypasses framework lifecycle
- Bypassing Front Controller → routes not registered, middleware not applied
- Duplicating Front Controller logic in Page Controllers in same app → inconsistent behavior
- Not understanding middleware order (global vs route middleware) → wrong processing sequence

---

# Failure Modes

- **index.php crashes**: application completely unavailable (no requests processed)
- **Bootstrap failure**: provider or binding error → all routes fail
- **Middleware stack corruption**: middleware modifying request breaks downstream handlers
- **Route mismatch**: Front Controller receives request but no route matches → 404

---

# Ecosystem Usage

- **Laravel index.php**: `public/index.php` — Front Controller entry point
- **Laravel Kernel**: `Illuminate\Foundation\Http\Kernel` — HTTP request processing
- **Laravel Console Kernel**: `Illuminate\Foundation\Console\Kernel` — CLI commands
- **Middleware**: application-wide behavior via Front Controller pipeline
- **Route Service Provider**: route registration during Front Controller bootstrap

---

# Related Knowledge Units

**Prerequisites**: HTTP lifecycle, Middleware | **Related**: Page Controller (alternative for simple apps), Application Controller (routing + flow control), MVC pattern | **Advanced**: Kernel internals, Octane Front Controller differences, Multiple SAPI support

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.


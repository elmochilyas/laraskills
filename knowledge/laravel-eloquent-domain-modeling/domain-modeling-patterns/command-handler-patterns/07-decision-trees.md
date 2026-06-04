# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Command Handler Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Command handler vs controller
* Single handler vs multiple steps
* Command bus vs direct invocation

---

# Architecture-Level Decision Trees

---

## Command Handler vs Controller

---

## Decision Context

Choosing between putting business logic in a controller action vs extracting it into a dedicated command handler.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the action involve more than loading a model and returning a response?
↓
YES → Is the orchestration logic complex (multiple models, validation, side effects)?
    YES → Extract to a command handler — keeps controller thin
    NO → Can the logic be expressed as a model domain method?
        YES → Use model domain method directly (simpler)
        NO → Extract to command handler
NO → Simple CRUD? Keep in controller — handler adds unnecessary indirection

---

## Rationale

Command handlers provide a clear boundary between HTTP concerns and domain logic. They make orchestration testable without HTTP and enable reuse across controllers, CLI commands, and queue jobs.

---

## Recommended Default

**Default:** Controller for simple CRUD; command handler for complex orchestration
**Reason:** Over-engineering with handlers for trivial operations adds files without benefit.

---

## Risks Of Wrong Choice

Missing command handler for complex logic leads to fat controllers with duplicated orchestration. Using handlers for simple CRUD creates unnecessary indirection.

---

## Related Rules

* Keep command DTOs as data carriers only
* Handlers orchestrate, models decide

---

## Related Skills

* Implement a Command Handler

---

## Single Handler vs Multiple Steps

---

## Decision Context

Deciding whether a command handler should call one domain method or orchestrate multiple steps.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the command require multiple sequential domain operations?
↓
YES → Can the operations be composed into a single domain method?
    YES → Prefer a single domain method — clearer intent
    NO → Handler orchestrates multiple domain methods in sequence
NO → Single step? Handler calls one domain method and returns result

---

## Rationale

A handler that calls a single domain method is the simplest and most maintainable. When multiple steps are needed, the handler sequences them without adding business logic itself.

---

## Recommended Default

**Default:** Single domain method call per handler
**Reason:** Simpler, more testable, and clearer intent.

---

## Risks Of Wrong Choice

Handlers with too many steps become procedural scripts that duplicate business knowledge. Single-step handlers that should compose multiple operations force callers to sequence them externally.

---

## Related Rules

* Handler orchestrates, doesn't implement
* Return typed results from handlers

---

## Related Skills

* Implement a Command Handler

---

## Command Bus vs Direct Invocation

---

## Decision Context

Choosing between dispatching commands through a command bus vs directly invoking command handlers.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Do you need middleware/decoration (logging, transactions, authorization) around command execution?
↓
YES → Use a command bus — middleware pipeline handles cross-cutting concerns
NO → Is the handler called from multiple entry points (HTTP, CLI, queue)?
    YES → Consider a command bus for consistent processing
    NO → Direct handler invocation is sufficient — simpler

---

## Rationale

A command bus adds a middleware pipeline for cross-cutting concerns but adds indirection. Direct invocation is simpler but requires manual wiring of concerns like transactions or logging.

---

## Recommended Default

**Default:** Direct handler invocation
**Reason:** Simpler, no additional dependency, sufficient for most Laravel applications.

---

## Risks Of Wrong Choice

Using a command bus without middleware needs adds unnecessary complexity. Direct invocation without any orchestration consistency leads to scattered transaction/authorization logic.

---

## Related Rules

* Wire in service providers, not controllers

---

## Related Skills

* Implement a Command Handler

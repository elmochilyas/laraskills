# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Gracefully Handling Errors
**Generated:** 2026-06-03

---

# Decision Inventory

* Try-Catch at Controller Level vs Service Layer vs Global Handler
* Return Error Response vs Throw Exception vs Return Null
* User-Facing Error Message vs Internal Error Details

---

# Architecture-Level Decision Trees

---

## Decision 1: Try-Catch at Controller Level vs Service Layer vs Global Handler

---

## Decision Context

Where in the application stack to catch exceptions and convert them into user-friendly error responses.

---

## Decision Criteria

* Whether the exception is recoverable (can the application continue without the failed operation?)
* Whether the exception should produce an immediate user-facing error message
* Whether the exception needs cleanup (transaction rollback, resource release) at the layer that caught it
* Whether the exception type is specific enough to handle differently at different entry points

---

## Decision Tree

Can the application gracefully degrade and continue without the failed operation?
↓
YES → Catch at the service layer or action level — isolate the failure, degrade the feature, continue
NO → Should the user receive an immediate error response for this failure?
    YES → Does the exception need HTTP-specific handling (different status code, redirect, session flash)?
        YES → Catch at the controller level — HTTP concerns belong in the web layer
        NO → Let the global handler manage it — the handler has full context for rendering
    NO → Does the exception require cleanup at the current layer (DB transaction rollback, file deletion)?
        ↓
        YES → Catch, perform cleanup, re-throw — layer is responsible for its own cleanup
        NO → Let the exception bubble up — don't catch what you can't handle

---

## Rationale

The controller is the correct place to catch exceptions that need HTTP-specific responses (redirect with flash, different status code). The service layer should catch exceptions that represent recoverable failures (cache a degraded response, fall back to a default). The global handler handles everything else.

---

## Recommended Default

**Default:** Let unhandled exceptions bubble to the global handler. Catch at the service layer for recoverable failures. Catch at the controller for HTTP-specific error responses.
**Reason:** Catching at the wrong layer couples concerns — service layers shouldn't know about redirects, controllers shouldn't contain recovery logic.

---

## Risks Of Wrong Choice

* Catch all in controller: Controller bloat, mixed concerns — error handling obscures request flow
* Catch all in service: Service knows about HTTP — can't be reused in queue jobs or CLI commands
* Let everything bubble: Can't provide user-friendly error for specific failure — generic "something went wrong"
* Catch and swallow: Silent failures — user sees success but data wasn't saved

---

## Related Rules

* Controller-Level try-catch for User Feedback
* Service Layer Exception Handling

---

## Related Skills

* Graceful Error Recovery

---

---

## Decision 2: Return Error Response vs Throw Exception vs Return Null

---

## Decision Context

How to signal failure from a method — whether to return a nullable result, return an error response directly, or throw an exception.

---

## Decision Criteria

* Whether the failure is an expected possible outcome (user not found, record exists check)
* Whether the caller needs to handle the failure differently based on its type
* Whether the method is called from multiple contexts (HTTP, queue, CLI, tests)
* Whether the error needs immediate user-facing feedback vs logging for later investigation

---

## Decision Tree

Is the failure an expected possible outcome of normal operation (user might not exist, search might return nothing)?
↓
YES → Return null or use a Maybe/Option pattern — not an exceptional situation
NO → Does the caller need to handle different failure types differently?
    YES → Throw a custom exception — typed catching is the cleanest dispatch
    NO → Is the method called from multiple contexts (HTTP + queue + CLI + tests)?
        YES → Throw an exception — only the exception can bubble correctly through all contexts
        NO → Is immediate user feedback required?
            YES → Is the method already at the controller level?
                YES → Return error response directly (abort(), redirect()->back()->withErrors())
                NO → Throw an exception — the global handler will produce the response
            NO → Throw an exception — log and continue via the handler

---

## Rationale

Returning null is the right choice for "not found" situations that are part of normal flow. Exceptions are for "this should not happen" situations. Returning error responses from deep layers creates coupling — the method can only be used in HTTP contexts.

---

## Recommended Default

**Default:** Return null for expected absences. Throw exceptions for unexpected failures. Never return error responses from non-controller layers.
**Reason:** Return types communicate intent — nullable types show the caller that absence is expected. Exceptions communicate that something went wrong. Response objects couple the method to HTTP.

---

## Risks Of Wrong Choice

* Null for unexpected failures: Silent failure — caller may not check for null, leading to later confusing errors
* Exception for expected absences: Expensive control flow — exceptions are for exceptional situations
* Response from service layer: Method can't be called from queue, CLI, or tests without HTTP
* Throw from controller: Bypasses handler's rendering customization

---

## Related Rules

* Null Return for Expected Absence
* Custom Exception for Unexpected Failure

---

## Related Skills

* Graceful Error Recovery
* Custom Exception Class

---

---

## Decision 3: User-Facing Error Message vs Internal Error Details

---

## Decision Context

What information to show to the user versus what to log internally when an error occurs.

---

## Decision Criteria

* Whether the user can act on the information (fix input, retry, contact support)
* Whether the information contains sensitive data (stack traces, DB queries, file paths)
* Whether the error has a known, user-actionable resolution (validation error vs server error)
* Whether the application provides a support channel where users can report the error

---

## Decision Tree

Can the user do anything useful with this information?
↓
YES → Is the error actionable by the user (fix input, choose a different value, retry later)?
    YES → Show user-friendly message with specific guidance — "Email is already taken" not "SQLSTATE[23000]"
    NO → Show generic message with support reference — "Something went wrong. Reference: ERR-abc123"
NO → Does the information contain sensitive system details (stack trace, query, file path)?
    YES → Log full details internally — show nothing to user except "Please try again"
    NO → Does the application have customer support?
        ↓
        YES → Show generic message with support reference ID — support uses the ID to find the log
        NO → Show "Something went wrong. Please try again." — no reference needed

---

## Rationale

Users need actionable error messages or nothing at all. Stack traces, SQL queries, and file paths are not actionable — they expose attack surface. Internal logs should contain full context (trace, input, state) with an error reference ID that links user reports to logs.

---

## Recommended Default

**Default:** Show user-friendly, actionable messages for validation/domain errors. Show generic "Something went wrong" with a reference ID for unexpected system errors. Log full stack traces, input, and state internally.
**Reason:** This balance provides useful feedback without exposing sensitive internals or frustrating users with technical jargon.

---

## Risks Of Wrong Choice

* Full stack trace to user: Security vulnerability — attackers learn file paths, framework versions, DB structure
* Generic message for all errors: User can't fix email-taken or password-too-short — bad UX
* No error reference ID: User reports "I got an error" with no way to find the log entry
* Internal details in validation message: "This field must be unique in table `users`" — exposes schema

---

## Related Rules

* User-Friendly Error Messages
* Sensitive Data Protection in Logs

---

## Related Skills

* Graceful Error Recovery

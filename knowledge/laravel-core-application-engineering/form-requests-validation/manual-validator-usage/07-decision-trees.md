# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Manual Validator Usage
**Generated:** 2026-06-03

---

# Decision Inventory

* FormRequest vs Manual Validator for Validation Context
* Validator::make() in Service Layer vs CLI Command
* Manual Validation Error Handling: Exception vs Conditional Check

---

# Architecture-Level Decision Trees

---

## Decision 1: FormRequest vs Manual Validator for Validation Context

---

## Decision Context

Whether to use FormRequest (auto-validation via type-hint) or manual `Validator::make()` based on the execution context.

---

## Decision Criteria

* Whether the code runs in an HTTP context (controller, middleware)
* Whether the code runs in a non-HTTP context (CLI, queue, scheduled task)
* Whether auto-validation on resolution is desired or explicit control is needed
* Whether the input source is an HTTP request or a data array

---

## Decision Tree

Is the validation happening in an HTTP context (controller action receiving a request)?
↓
YES → Use FormRequest — type-hint in controller, auto-validation on resolution
NO → Is the validation happening in a non-HTTP context (CLI command, queued job, scheduled task)?
    YES → Use `Validator::make()` — FormRequests require the HTTP request lifecycle
    NO → Is the input source a data array (API response, file import, external data)?
        YES → Use `Validator::make()` — data comes from a non-HTTP source
        NO → Is explicit control over validation flow needed (validate, check, handle)?
            ↓
            YES → Use `Validator::make()` — call `passes()`, `fails()`, or `validate()` explicitly
            NO → Use FormRequest — simplest for standard HTTP validation

---

## Rationale

FormRequests are designed for HTTP contexts where the request lifecycle (resolution, validation, authorization) is handled automatically. `Validator::make()` is the correct choice for CLI commands, queued jobs, and any context where data arrives as an array rather than an HTTP request.

---

## Recommended Default

**Default:** FormRequest for HTTP controller actions. `Validator::make()` for all non-HTTP contexts.
**Reason:** FormRequests leverage the framework's auto-validation pipeline. `Validator::make()` provides the same validation engine without requiring an HTTP request. Using FormRequest outside HTTP requires extensive scaffolding and is not idiomatic.

---

## Risks Of Wrong Choice

* FormRequest in CLI command: No HTTP request — FormRequest can't resolve, throws exception
* `Validator::make()` in controller: Manual validation bypasses auto-validation — must manually redirect on failure
* No validation in non-HTTP context: Invalid data from file import or queue payload reaches domain — data corruption
* Mixed patterns: Some CLI commands use FormRequest via hacking, others use `Validator::make()` — inconsistent

---

## Related Rules

* Always Validate Input in Non-HTTP Contexts

---

## Related Skills

* Validate Input in Non-HTTP Contexts Using Manual Validator

---

---

## Decision 2: Validator::make() in Service Layer vs CLI Command

---

## Decision Context

Where to place `Validator::make()` calls — whether in the service layer (closer to business logic) or at the entry point (CLI command, queue job).

---

## Decision Criteria

* Whether validation is tightly coupled to the entry point's input format
* Whether the validation rules are the same across multiple entry points
* Whether the service layer is reused across different input sources
* Whether validation should happen at the boundary or deep in the stack

---

## Decision Tree

Is the validation specific to one entry point's input format (CLI argument, queue payload structure)?
↓
YES → Validate at the entry point — each entry point validates its own input format
NO → Is the same validation logic used across 2+ entry points?
    YES → Validate in the service layer — shared validation, single source of truth
    NO → Is the service reused across different input sources (HTTP + CLI + queue + API)?
        YES → Validate at each entry point — the service receives pre-validated data
        NO → Validate at the entry point — simpler, validation is close to the input source

---

## Rationale

Validation should happen at the application boundary — as early as possible. For CLI commands, that means in the command's `handle()` method. For services called from multiple entry points, validation should happen at each entry point so the service receives pre-validated data. If the same validation rules apply regardless of entry point, a shared validation method makes sense.

---

## Recommended Default

**Default:** Validate at the entry point (CLI command, queue job). If the same validation applies across 2+ entry points, extract to a shared method or a dedicated validator class.
**Reason:** Validating at the boundary catches invalid data as early as possible. The service layer remains focused on business logic, not input format concerns.

---

## Risks Of Wrong Choice

* Validation deep in service: Invalid data travels through layers before being caught — wasted processing
* No validation at entry point: Service validates, but the entry point doesn't — inconsistent behavior
* Validation in reused service with different rules: CLI validation blocks HTTP-valid data — incompatible rules
* No shared validation method: Same rules duplicated in command and queue job — drift

---

## Related Rules

* Validate at Entry Points

---

## Related Skills

* Validate Input in Non-HTTP Contexts Using Manual Validator

---

---

## Decision 3: Manual Validation Error Handling: Exception vs Conditional Check

---

## Decision Context

Whether to let `Validator::make()->validate()` throw a `ValidationException` on failure (letting the framework handle it) or use `passes()`/`fails()` with conditional handling.

---

## Decision Criteria

* Whether the validation failure should produce a user-facing error or internal handling
* Whether the application runs in HTTP context (where framework handles exception) or CLI
* Whether recovery from validation failure is possible (fallback value, default, retry)
* Whether multiple validation failures should be aggregated or reported individually

---

## Decision Tree

Is the validation context HTTP (controller) — where the framework handles `ValidationException`?
↓
YES → Use `validate()` — let the exception produce the standard validation error response
NO → Is the validation context CLI (command) — where exceptions show as red error text?
    YES → Use `fails()` — check result, output formatted error messages, return exit code
    NO → Is recovery from validation failure possible (use default value, skip record, log warning)?
        YES → Use `fails()` — check result, handle accordingly, continue processing
        NO → Is the validation failure truly exceptional (should never happen with correct code)?
            YES → Use `validate()` — throw exception, log it, let error handler deal with it
            NO → Use `fails()` — handle validation failure gracefully

---

## Rationale

`validate()` throws `ValidationException`, which is the standard Laravel error mechanism. This is appropriate for HTTP contexts where the framework handles it. In CLI contexts or batch processing, `fails()` with conditional handling provides better control — you can log the error, skip the record, and continue processing.

---

## Recommended Default

**Default:** Use `validate()` in HTTP contexts (framework handles the exception). Use `fails()` with conditional handling in CLI, queue, and batch processing contexts.
**Reason:** HTTP contexts have standard error handling for `ValidationException`. CLI and batch processing need explicit control — stop on first error, skip the record, or aggregate errors.

---

## Risks Of Wrong Choice

* `validate()` in batch processing: First invalid record throws exception — entire batch fails
* `fails()` in HTTP controller: Must manually redirect, flash errors, return response — duplicates FormRequest behavior
* `validate()` in CLI: Exception shows Laravel stack trace — poor UX for CLI users
* Silent `fails()` without handling: Invalid record silently skipped — user thinks it succeeded

---

## Related Rules

* validate() for HTTP, passes()/fails() for CLI

---

## Related Skills

* Validate Input in Non-HTTP Contexts Using Manual Validator

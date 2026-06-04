---
id: KU-039 (AI Safety)
title: "Psalm/PHPStan Taint Analysis - Rules"
subdomain: "ai-safety-security"
ku-type: "static-analysis"
date-created: "2026-06-02"
---

## Rules for Psalm/PHPStan Taint Analysis

### R1: Configure custom taint sinks for all AI SDK entry points in your Psalm/PHPStan configuration
- **Category:** Security
- **Rule:** Register every method that sends data to an LLM (e.g., `Ai::chat()`, `Ai::complete()`, `Ollama::generate()`, custom `Agent::run()`) as a custom taint sink; never assume default configurations cover AI-specific sinks.
- **Reason:** Default Psalm/PHPStan configurations don't know about AI libraries and their entry points. Without custom sink configuration, Psalm sees no issue with `$_GET['prompt']` reaching `Ai::chat()` directly.
- **Bad Example:** Psalm configured with no custom sinks — a new endpoint passes raw `$request->input('text')` to `$ai->chat()` and Psalm reports no issues.
- **Good Example:** Psalm XML with `<taintSink name="ai-sink" type="TaintedInput"/>` and PHP attribute `#[TaintedSink('ai-sink')]` on Agent's `execute()` method.
- **Exceptions:** Projects not using static analysis.
- **Consequences of Violation:** Unsanitized user input reaches the LLM through code paths that Psalm should have caught but didn't; injection vulnerabilities escape automated detection.

### R2: Add taint source annotations to all methods that load external data (database, files, APIs)
- **Category:** Security
- **Rule:** Annotate any method that retrieves data from external sources (database queries, file reads, HTTP API calls) with `@psalm-taint-source` for database/files/network; never assume only `$_GET` is a taint source.
- **Reason:** Stored injection — an attacker POISONS data in the database or a file, and that data propagates to the LLM through a "safe" database read. Without annotating database reads as taint sources, Psalm won't flag this path.
- **Bad Example:** A product review stored in the database via a form injection, then loaded by a "Get product info" agent and passed to the LLM — Psalm sees no issue because the database read is not annotated as a source.
- **Good Example:** `#[TaintSource('database')]` on `ProductRepository::getProduct()`. When the return value flows to an AI sink, Psalm flags the path.
- **Exceptions:** Sources that only contain data verified by non-AI sanitization.
- **Consequences of Violation:** Second-order injection through persistent storage is undetected; attacker injects data via one channel, and it reaches the LLM via another, bypassing input validation.

### R3: Configure the CI pipeline to require passing taint analysis before deployment to any environment
- **Category:** Workflow
- **Rule:** Add a CI gate: `vendor/bin/psalm --taint-analysis` (or PHPStan equivalent) that must pass with zero taint violations before deployment to staging or production; never deploy with known taint paths.
- **Reason:** A known but unaddressed taint path is a vulnerability waiting to be exploited. If the team knows about a taint path but deploys anyway, they accept the risk of AI injection attacks until it's fixed.
- **Bad Example:** A project with 12 known taint violations scheduled as "refactoring for next sprint" — the next sprint is three months away, and an injection vulnerability exists in production.
- **Good Example:** CI fails when `--taint-analysis` reports any violation. New code must have zero violations; existing violations are tracked in a security backlog with explicit risk acceptance.
- **Exceptions:** Zero — known taint violations that cannot be fixed must have documented risk acceptance from the security lead.
- **Consequences of Violation:** Known injection vulnerabilities remain in production despite being detectable; security debt accumulates until a breach occurs.

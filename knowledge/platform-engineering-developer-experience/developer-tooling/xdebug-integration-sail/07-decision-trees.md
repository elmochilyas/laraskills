# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Xdebug Integration with Sail
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Enable Xdebug by default or on-demand? | Performance impact | On-demand — enable only when actively debugging |
| 2 | Xdebug mode selection? | Debugging need, overhead | `debug` mode for step debugging; `off` for daily dev |

---

# Architecture-Level Decision Trees

---

## Decision 1: Enable Xdebug by Default or On-Demand?

---

## Decision Context

Xdebug adds significant overhead (2-10x) when enabled. It should be off by default and activated only when debugging.

---

## Decision Criteria

* performance

---

## Decision Tree

Are you actively step-debugging?
↓
YES → Set `SAIL_XDEBUG_MODE=debug` in `.env`
NO → ↓
Is development performance important?
↓
YES → **Leave Xdebug disabled** (`SAIL_XDEBUG_MODE=off` or unset)
NO → Enable `develop` mode (minimal ~1-5% overhead for enhanced var_dump)
Best practice:
- Keep Xdebug disabled in `.env`
- Set mode only when needed: `sail debug` command or manual env change
- Use browser Xdebug Helper extension to trigger sessions
- Disable `profile` and `coverage` modes when not needed

---

## Recommended Default

**Default:** Xdebug disabled by default; enable on-demand when debugging
**Reason:** 2-10x overhead makes always-on Xdebug impractical

---

## Risks Of Wrong Choice

- **Xdebug always on (debug mode):** 2-10x slower requests; sluggish development experience
- **Xdebug disabled when debugging:** No breakpoints; can't inspect variables

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Xdebug Mode Selection?

---

## Decision Context

Xdebug 3 has multiple modes: `debug`, `develop`, `profile`, `coverage`, `trace`. Each adds different overhead. Mode should match the current task.

---

## Decision Criteria

* performance

---

## Decision Tree

What are you doing?
↓
**Step debugging** → `SAIL_XDEBUG_MODE=debug` (breakpoints, variable inspection)
**Investigating performance** → `SAIL_XDEBUG_MODE=profile` (cachegrind output)
**Running test coverage** → `SAIL_XDEBUG_MODE=coverage`
**Daily development** → `SAIL_XDEBUG_MODE=off` or `develop` for enhanced var_dump
**Multiple modes** → Comma-separated: `debug,profile`

---

## Recommended Default

**Default:** `off` for daily dev; `debug` when step debugging; `profile` when investigating performance
**Reason:** Each mode adds specific overhead; only enable what's needed

---

## Risks Of Wrong Choice

- **Profile mode always on:** 10-30% overhead; large cachegrind files filling disk
- **Debug + profile simultaneously:** Combined overhead slows debugging experience

---

## Related Rules

- TEMPLATE-RULE-016: Template rendering under 2 seconds

---

## Related Skills

- Build Internal Template Registries for Laravel Projects


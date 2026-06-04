# Rules: Pulse Cards Custom Development

## Metadata
- **Source KU:** pulse-cards-custom-development
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PULSECARD-RULE-001: **Extend Pulse\Card** — Custom cards are Livewire components extending `Pulse\Card`.
- PULSECARD-RULE-002: **Register in pulse.php** — Add to `config/pulse.php` `cards` array with display order.
- PULSECARD-RULE-003: **Use Pulse::record()** — Record metric entries with `Pulse::record('metric_name', $key, $value)`.
- PULSECARD-RULE-004: **Use Pulse::values()** — Retrieve aggregated values via `Pulse::values('metric_name', ['count'])`.

## Architecture Rules
- PULSECARD-RULE-005: **Recorder class** — Extends `Pulse\Recorder`, captures metrics via event listening or `Pulse::record()`.
- PULSECARD-RULE-006: **Dashboard width** — `cols-1` (full), `cols-2` (half), `cols-3` (third) for layout control.
- PULSECARD-RULE-007: **Built with Livewire + Alpine.js + Tailwind** — Follows Pulse's component architecture.

## Decision Rules
- PULSECARD-RULE-008: **Start with built-in cards** — Add custom cards only for business-critical or app-specific metrics.
- PULSECARD-RULE-009: **Not for high-frequency metrics** > 1000 records/second without batching.

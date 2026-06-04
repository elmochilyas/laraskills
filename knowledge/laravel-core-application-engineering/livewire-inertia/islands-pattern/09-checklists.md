# Livewire Islands Pattern — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Islands Pattern
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Standard Blade layout with `@extends('layouts.app')` in use
- [ ] Understanding of full-page vs embedded component modes

## Implementation Checklist
- [ ] Content-heavy pages use Islands, not full-page Livewire
- [ ] Each island is self-contained with its own data fetching
- [ ] No shared state between islands (use events if needed)
- [ ] `:key` attribute on all island instances
- [ ] Islands focused on interactive portions, not entire page
- [ ] Lazy loading considered for below-the-fold islands
- [ ] No Livewire inside Inertia (or vice versa)
- [ ] Initial page render performance measured and improved
- [ ] Island templates render only the interactive portion, not the entire page layout

## Verification Checklist
- [ ] Island renders in standard Blade with `<livewire:comments :post="$post" />`
- [ ] Each island has its own component ID, snapshot, checksum, Alpine scope
- [ ] Islands do NOT share state (separate instances)
- [ ] `:key` attribute prevents state mixups when lists re-render
- [ ] Initial page render is fast (plain Blade, no Livewire serialization overhead)
- [ ] Only interactive islands incur Livewire's hydration/dehydration overhead
- [ ] `boot()` → `mount()` → render → dehydrate lifecycle works independently per island

## Security Checklist
- [ ] Each island has its own security context (checksum, CSRF, authorization)
- [ ] Islands cannot access each other's state
- [ ] Props passed to islands don't contain sensitive data (serialized in page)
- [ ] Data passed via props is authorized before reaching the island
- [ ] Cross-island communication uses `$dispatch` (not shared state exploits)

## Performance Checklist
- [ ] Initial page render is significantly faster with Islands vs full-page
- [ ] Only interactive components incur Livewire overhead
- [ ] Lazy loading (`#[Lazy]`) combined with Islands for maximum performance
- [ ] Island payloads are minimal — only what's needed for the interactive portion
- [ ] Content-heavy pages (80% static, 20% interactive) use Islands appropriately
- [ ] No island renders the entire page (use full-page mode instead)

## Production Readiness Checklist
- [ ] Content-heavy vs interactive page decision is documented
- [ ] Teams understand when to use Islands vs full-page components
- [ ] Below-the-fold islands use `#[Lazy]` for deferred loading
- [ ] Marketing/landing pages use Islands for performance
- [ ] Admin/dashboard pages use full-page components for cohesiveness
- [ ] `:key` attribute is not forgotten on any island list

## Common Mistakes to Avoid
- [ ] Using full-page for static content — unnecessary overhead
- [ ] Islands trying to share state — doesn't work without events
- [ ] Missing `:key` on island lists — state mixed between items
- [ ] Island too large — defeats purpose of the pattern
- [ ] No lazy loading for heavy islands — many AJAX calls on page load
- [ ] Island that renders the entire page — use full-page Livewire instead
- [ ] Island inside Inertia page — mixing Livewire and Inertia on same page

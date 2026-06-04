# Livewire Lazy Loading — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Lazy Loading
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed with `#[Lazy]` attribute support
- [ ] Browser supports Intersection Observer (polyfill for older browsers if needed)
- [ ] Component structure supports lazy initialization

## Implementation Checklist
- [ ] Heavy components use `#[Lazy]` attribute
- [ ] Placeholder method returns meaningful loading skeleton
- [ ] Placeholder dimensions match final component height
- [ ] Above-the-fold content loads immediately (not lazy)
- [ ] Props to lazy components are lightweight (IDs, not full models)
- [ ] No expensive operations in `placeholder()`
- [ ] Layout shift minimized when lazy components load
- [ ] Lazy loading works on slow network
- [ ] Nested lazy loading considered (parent lazy → child lazy)

## Verification Checklist
- [ ] `#[Lazy]` attribute is on the component class
- [ ] `placeholder()` method returns a View or string
- [ ] `mount()` is NOT called during initial render — only during lazy load
- [ ] Intersection Observer triggers AJAX when placeholder enters viewport
- [ ] On lazy load: `boot()` → `mount()` → `booted()` → `rendering()` → render → `rendered()`
- [ ] Placeholder has access to constructor dependencies but NOT mount data
- [ ] Lazy components can receive props from parent: `<livewire:heavy :post="$post" />`

## Security Checklist
- [ ] Lazy-loaded components go through same Livecycle (checksum, auth, validation)
- [ ] Props passed to lazy components don't contain sensitive data (serialized in initial snapshot)
- [ ] Authorization checks in mount() are enforced on lazy load
- [ ] Placeholder doesn't reveal sensitive information
- [ ] Lazy component initialization respects the same access controls

## Performance Checklist
- [ ] Above-the-fold content loads immediately (not lazy)
- [ ] Placeholder matches final component dimensions (no layout shift)
- [ ] Heavy components with expensive queries use `#[Lazy]`
- [ ] Each lazy component makes one AJAX request on viewport entry
- [ ] Multiple lazy components load in parallel as they enter viewport
- [ ] Below-the-fold widgets and dashboard panels use lazy loading
- [ ] Tab panels with lazy content load only when tab is active
- [ ] Modals load data only when opened

## Production Readiness Checklist
- [ ] Placeholder provides visual feedback (skeleton, spinner)
- [ ] Placeholder is styled (not raw text)
- [ ] Lazy loading is tested on slow network
- [ ] Non-critical dashboard widgets use `#[Lazy]`
- [ ] Intersection Observer fallback exists for non-supporting browsers
- [ ] Layout shift measurement shows improvement with lazy loading
- [ ] Component renders correctly after lazy load

## Common Mistakes to Avoid
- [ ] No placeholder method — blank space until component loads
- [ ] Placeholder different height than component — layout shift
- [ ] Lazy loading above-the-fold content — flash of placeholder in viewport
- [ ] Expensive queries in `placeholder()` — slow initial page render
- [ ] Props with large data to lazy component — large initial snapshot
- [ ] Placeholder without styling — raw text during loading
- [ ] All components lazy — unnecessary AJAX for lightweight components

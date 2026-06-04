# Decision Trees: Livewire + Laravel Integration

## Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** LivewireInertia
**Knowledge Unit:** LivewireLaravel
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Published Assets vs Bundled Scripts | Configuration | Deployment |
| 2 | Default Layout vs Per-Component Layout | Design | Project Init |
| 3 | Default Namespace vs Custom Namespace | Configuration | Project Init |
| 4 | Auto-Discovery vs Manual Registration | Configuration | Setup |

---

## Decision 1: Published Assets vs Bundled Scripts

### Context
How to deliver Livewire's frontend assets in production.

### Decision Tree
Does the application use Vite or Mix for asset bundling?
- **YES** → Continue
- **NO** → Published assets (php artisan livewire:publish)

Does the application have an existing JS build pipeline?
- **YES** → Consider bundling
- **NO** → Published assets

Can Livewire assets be safely embedded in the main JS bundle?
- **YES** → Bundling preferred (fewer HTTP requests)
- **NO** → Continue

Does the team want independent versioning of Livewire frontend updates?
- **YES** → Published assets (independent updates)
- **NO** → Bundling (updated with app build)

### Recommended Default
Published assets for simple deployments. Bundling for applications with an existing Vite/Mix pipeline.

### Risks
- Published assets: extra browser request, no versioning with app build
- Bundling: Livewire update requires app rebuild, larger bundle

---

## Decision 2: Default Layout vs Per-Component Layout

### Context
How to define the layout for full-page Livewire components.

### Decision Tree
Do all full-page components share the same layout structure?
- **YES** → Default layout in `config/livewire.php`
- **NO** → Continue

Are there 2-3 distinct layouts used across the application?
- **YES** → Per-component `#[Layout()]` attribute
- **NO** → Continue

Do some components need no layout (API responses, embedded)?
- **YES** → Per-component layout (flexible per component)
- **NO** → Default layout

### Recommended Default
Default layout for single-layout applications. Per-component `#[Layout()]` attribute for multi-layout applications.

### Risks
- Default layout for multi-layout: components may render in wrong shell
- Per-component for single layout: repetitive, harder to change site-wide

---

## Decision 3: Default Namespace vs Custom Namespace

### Context
Component namespace configuration.

### Decision Tree
Are Livewire components organized under `app/Livewire/`?
- **YES** → Default namespace (`App\Livewire`)
- **NO** → Continue

Are components in a packages or module directory?
- **YES** → Custom namespace per directory
- **NO** → Continue

Is there a compelling reason to rename the namespace?
- **YES** → Custom namespace (renamed in `config/livewire.php`)
- **NO** → Default namespace

### Recommended Default
Default `App\Livewire` namespace. Custom only for packages or module architectures.

### Risks
- Custom namespace: developers must remember import path, harder onboarding
- Default namespace: cannot use for third-party packages

---

## Decision 4: Auto-Discovery vs Manual Registration

### Context
How to register Livewire components.

### Decision Tree
Are components in `app/Livewire/`?
- **YES** → Auto-discovery (no registration needed)
- **NO** → Continue

Are components from a package or external vendor?
- **YES** → Manual registration (`Livewire::component()`)
- **NO** → Continue

Is there a small number of components (< 5)?
- **YES** → Either approach works
- **NO** → Auto-discovery (less boilerplate)

### Recommended Default
Auto-discovery for application components. Manual registration for packages.

### Risks
- Manual registration for large apps: high boilerplate, easy to forget registration
- Auto-discovery for packages: not supported; packages must register explicitly

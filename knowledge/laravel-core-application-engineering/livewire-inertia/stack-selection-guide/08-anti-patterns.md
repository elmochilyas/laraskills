# Stack Selection Guide — Anti-Patterns

## Anti-Pattern 1: Choosing a Stack Based on Familiarity Without Considering Requirements

**Symptom:** Selecting Livewire because "the team knows PHP" or Inertia because "everyone uses React," without evaluating the application's interactivity needs.

**Problem:** Team familiarity matters, but stack misfit creates long-term pain. A real-time dashboard with frequent partial updates (chat, notifications, live search) is painful in Inertia (requires custom API endpoints, client-side state management). A traditional CRUD app with simple forms is over-engineered in Inertia with Vuex/Pinia for basic validation.

```php
// BAD — chosen for familiarity, not fit
// Team knows PHP, so Livewire is used for a complex SPA dashboard
// Result: massive single-component file, slow updates, state management nightmare
```

**Solution:** Evaluate interactivity requirements first:
- Simple forms, occasional updates → Livewire
- Rich SPA experience, complex client state → Inertia
- Server-rendered pages, minimal JS → Blade + Alpine

**Detection:** Review Livewire components with 1000+ lines of code. Review Inertia projects using Vue/React mostly for simple forms.

---

## Anti-Pattern 2: Switching Stacks Mid-Project

**Symptom:** Starting with Blade, switching to Livewire for one feature, then to Inertia for another — all in the same project.

**Problem:** Each stack switch invalidates previous patterns, forces team retraining, and creates a hybrid codebase that is confusing to navigate. Developers must context-switch between Blade, Livewire, and Inertia patterns within the same day.

```php
// BAD — three stacks in one project
// routes/web.php:
Route::get('/', [WelcomeController::class, 'index']); // Blade
Route::get('/dashboard', DashboardController::class); // Inertia
Route::get('/settings', SettingsController::class); // Livewire
```

**Solution:** Choose one primary stack for the project. Use secondary stacks only for clearly isolated sections (e.g., admin panel in Livewire, public site in Blade).

```php
// GOOD — primary stack with isolated sections
Route::middleware(['inertia'])->group(function () {
    Route::get('/dashboard', DashboardController::class);
    Route::get('/profile', ProfileController::class);
    // All SPA pages use Inertia consistently
});
```

**Detection:** Search for Blade templates, Livewire components, and Inertia pages all used in the same project without clear separation.

---

## Anti-Pattern 3: Choosing Livewire for a Public-Facing SPA With Complex Client Interactions

**Symptom:** Building a single-page application with drag-and-drop, complex client-side state, real-time multi-user editing, or canvas manipulation using Livewire.

**Problem:** Livewire's server-side rendering model means every interaction requires a network round-trip. Complex client interactions (drag-and-drop reordering, canvas drawing, rich text editing) feel sluggish because each micro-interaction must sync with the server.

```php
// BAD — drag-and-drop in Livewire
// Every drag event fires a server request:
// wire:dragstart, wire:dragend, wire:dragover
class KanbanBoard extends Component
{
    public function moveTask($taskId, $newColumn, $newPosition)
    {
        // Round-trip for every drag
    }
}
```

**Solution:** Use Inertia + React/Vue for pages with heavy client interaction. Reserve Livewire for form-heavy, interaction-light pages.

**Detection:** Search for Livewire components handling drag-and-drop, canvas, or real-time mouse events.

---

## Anti-Pattern 4: Choosing Inertia for a Server-Driven Admin Panel With Simple CRUD

**Symptom:** Using Inertia + Vue/React for a CRUD admin panel where most pages are simple forms, tables, and detail views.

**Problem:** Inertia adds Node.js build tooling, component compilation, client-state management, and routing complexity for pages that could be built with Blade + Alpine in a fraction of the time. The tooling overhead is significant — Vuex, NPM dependencies, component architecture — for what amounts to HTML forms.

```javascript
// BAD — Vue component for a simple form
// resources/js/Components/UserForm.vue
<template>
    <form @submit.prevent="submit">
        <input v-model="form.name" />
        <button type="submit">Save</button>
    </form>
</template>

// vs Blade:
// resources/views/users/form.blade.php
<form wire:submit="save">
    <input wire:model="name" />
    <button type="submit">Save</button>
</form>
```

**Solution:** Use Livewire (or Blade + Alpine) for CRUD-heavy admin panels. Reserve Inertia for pages with rich user interactions.

**Detection:** Search for Inertia projects where most Vue/React components contain only `<form>`, `<input>`, and `<button>` elements.

---

## Anti-Pattern 5: Not Planning for SEO Before Stack Selection

**Symptom:** Building a public-facing content site (blog, marketing pages, documentation) with a stack that requires JavaScript rendering.

**Problem:** Inertia and Livewire both require JavaScript to render content. Search engine crawlers execute limited JS or none at all, meaning the site has poor or no SEO. Content is invisible to Google/Bing until a crawler capable of JS rendering indexes it.

```php
// BAD — blog built with Inertia, content invisible to crawlers
Route::get('/blog/{post}', [BlogController::class, 'show']); // Inertia — JS required
```

**Solution:** For content/public sites, use Blade for server-rendered HTML with minimal JS. Reserve Inertia/Livewire for authenticated sections.

```php
// GOOD — Blade for public content, Inertia for app
Route::get('/blog/{post}', [BlogController::class, 'show']); // Blade — SSR, SEO-friendly
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class); // Inertia — app section
});
```

**Detection:** Search for Inertia or Livewire rendering on public, unauthenticated routes that contain content for SEO.

---

## Anti-Pattern 6: Stack Selection Based on "What's New" Rather Than Stability

**Symptom:** Choosing a stack because it's the newest or trendiest (e.g., adopting Volt/Single-File Components immediately on release).

**Problem:** New stacks have less community knowledge, fewer packages, and undiscovered edge cases. Choosing a stack for a production application based on novelty introduces risk from API instability, immature tooling, and limited troubleshooting resources.

```php
// BAD — production app on a beta stack
// "We used the alpha release of Livewire X because it looked cool"
// Result: breaking changes on update, no community packages, hard to hire
```

**Solution:** For production projects, prefer stable, well-documented stacks with a large community. Evaluate new stacks in side projects first.

**Detection:** Review `composer.json` and `package.json` for pre-release versions (`alpha`, `beta`, `dev`, `@rc`) used in production.

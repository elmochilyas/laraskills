# Livewire + Laravel — Anti-Patterns

## Anti-Pattern 1: Database Queries in render()

**Symptom:** Writing Eloquent queries directly in the `render()` method of a Livewire component.

**Problem:** Livewire re-renders the component on every network round-trip (every property update, action, or lifecycle hook). Database queries in `render()` execute on every single interaction, even when the queried data has not changed. A component that fetches `User::all()` on mount also fetches it on every checkbox toggle.

```php
// BAD — query on every render
class UserDashboard extends Component
{
    public $search = '';

    public function render()
    {
        return view('livewire.user-dashboard', [
            'users' => User::where('name', 'like', "%{$this->search}%")->get(),
        ]);
    }
}
```

**Solution:** Use computed properties with caching, or defer expensive queries to lifecycle hooks that run conditionally.

```php
// GOOD — cached computation
class UserDashboard extends Component
{
    public $search = '';

    #[Computed]
    public function users()
    {
        return User::where('name', 'like', "%{$this->search}%")->get();
    }

    public function render()
    {
        return view('livewire.user-dashboard');
    }
}
```

**Detection:** Search for `::where`, `::all`, `::get`, `::first`, `::find`, `::paginate` inside `render()` methods of Livewire components.

---

## Anti-Pattern 2: Heavy Logic in propertyUpdated() Hooks

**Symptom:** Running expensive validation, API calls, or database queries inside `updated*` hooks that fire on every keystroke.

**Problem:** `updated*` hooks fire for every property change including individual keystrokes. An `updatedSearch()` hook that queries the database fires 10+ times while the user types a search term of 10 characters.

```php
// BAD — fires on every keystroke
public function updatedSearch($value)
{
    $this->results = Product::search($value)->get(); // 10+ queries
}
```

**Solution:** Debounce the property update on the frontend or use lazy update.

```php
// GOOD — debounced frontend
// In Blade: <input wire:model.live.debounce.500ms="search">

// Or use lazy update:
// <input wire:model.lazy="search">

public function updatedSearch($value)
{
    $this->results = Product::search($value)->get();
}
```

**Detection:** Search for `updated` hooks in Livewire components. Check for database queries or API calls without debounce configuration.

---

## Anti-Pattern 3: Massive Public Properties Arrays

**Symptom:** Using public properties to store collections, Eloquent models, or large arrays of data (thousands of records).

**Problem:** Livewire serializes all public properties between requests. A property holding `User::all()` (1000+ users) is serialized, sent to the client, stored in Alpine's state, and sent back on every request. This balloons payload size and degrades performance.

```php
// BAD — serializes entire collection on every request
class UserList extends Component
{
    public $users = [];

    public function mount()
    {
        $this->users = User::all()->toArray(); // 1000+ users, serialized every time
    }
}
```

**Solution:** Defer large data to the Blade view using computed properties. Only send identifiers, not full models.

```php
// GOOD — computed, not serialized
class UserList extends Component
{
    #[Computed]
    public function users()
    {
        return User::all();
    }

    public function render()
    {
        return view('livewire.user-list');
    }
}
```

**Detection:** Search for public properties typed as `Collection` or `array` in Livewire components that could hold large data sets.

---

## Anti-Pattern 4: Mutating Data Directly Outside Actions

**Symptom:** Modifying properties in `mount()`, `hydrate()`, or other lifecycle methods in ways that bypass Livewire's action system.

**Problem:** Direct mutation in lifecycle hooks skips the action authorization, validation, and event system. Bugs introduced by unexpected mutations are hard to trace because the change origin is not in an action method.

```php
// BAD — mutation in lifecycle hook
public function mount($postId)
{
    $this->post = Post::find($postId);
    $this->post->increment('views'); // Side effect in mount!
}
```

**Solution:** Use actions for state-changing operations. Keep lifecycle hooks for initialization only.

```php
// GOOD — action for mutations
public function incrementViews()
{
    $this->post->increment('views');
}

public function mount($postId)
{
    $this->post = Post::find($postId);
    // No side effects here
}
```

**Detection:** Search for `->save()`, `->update()`, `->create()`, `->delete()`, `dispatch(`, `Mail::` inside `mount()`, `hydrate()`, `boot()` methods of Livewire components.

---

## Anti-Pattern 5: No Authorization on Livewire Actions

**Symptom:** Livewire action methods that perform destructive operations (insert, update, delete) without checking authorization.

**Problem:** Livewire actions are server-side methods callable from the frontend. Without authorization, any user can trigger destructive actions by manipulating component state in the browser's dev tools.

```php
// BAD — unauthorized action
public function deletePost($postId)
{
    Post::find($postId)->delete(); // Any user can trigger this
}
```

**Solution:** Always authorize actions using policies or gates.

```php
// GOOD — authorized action
public function deletePost($postId)
{
    $post = Post::findOrFail($postId);
    $this->authorize('delete', $post);
    $post->delete();
}
```

**Detection:** Search for Livewire action methods (public methods without `render`/`mount`/`hydrate`/`boot`) that perform data mutation. Check for `$this->authorize()`, `$this->can()`, or `Gate::` calls.

---

## Anti-Pattern 6: Show/Hide Tabs Controlled by Separate Livewire Components

**Symptom:** Multiple Livewire components rendered on the same page that manage their own visibility independently, causing duplicate server requests.

**Problem:** Each Livewire component on a page manages its own lifecycle independently. When interactivity triggers component updates, nested/multiple components make separate requests. Tab switching that shows/hides components causes unnecessary server round-trips.

```html
<!-- BAD — every tab is a separate Livewire component -->
<div>
    <livewire:profile-tab />    <!-- Separate request -->
    <livewire:settings-tab />   <!-- Separate request -->
    <livewire:billing-tab />    <!-- Separate request -->
</div>
```

**Solution:** Use a single Livewire component for multi-tab pages. Use `wire:key` and conditional rendering internally.

```html
<!-- GOOD — single component manages tabs -->
<div>
    @if ($activeTab === 'profile')
        @include('livewire.partials.profile')
    @elseif ($activeTab === 'settings')
        @include('livewire.partials.settings')
    @endif
</div>
```

**Detection:** Search for Blade files with multiple `<livewire:` tags. Flag pages with 3+ components that could be merged.

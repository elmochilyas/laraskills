# Hybrid Approaches — Anti-Patterns

## Anti-Pattern 1: Mixing Livewire and Inertia on the Same Route

**Symptom:** A single route or page that uses both Livewire components and Inertia rendering in different sections of the same page.

**Problem:** Livewire and Inertia manage state, rendering, and network requests differently. Livewire uses `wire:model` and component lifecycle; Inertia uses client-side routing and Vue/React reactivity. On the same page, they compete for DOM control, causing flickering, double requests, and unpredictable state synchronization.

```php
// BAD — Inertia page with Livewire components
class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'stats' => StatsResource::collection(Stats::all()),
        ]);
    }
}
```

```html
<!-- Blade partial included in Inertia page — broken -->
<livewire:stats-widget />
```

**Solution:** Commit fully to one stack per route group. Use Inertia for full-page SPA interactions and Livewire for interactive widgets — but never on the same page.

**Detection:** Search for Blade files that contain both `@inertia` or `<inertia-link>` and `<livewire:` or `@livewire` tags.

---

## Anti-Pattern 2: Inconsistent Validation UX Across Stacks

**Symptom:** Form validation errors displayed differently depending on whether the page uses Livewire or Inertia — sometimes inline, sometimes as toasts, sometimes as session flashes.

**Problem:** Users experience different feedback patterns when moving between stacks. A form on an Inertia page shows inline errors on individual fields, but switching to a Livewire page shows a generic toast. This inconsistency creates a disjointed user experience.

```php
// BAD — Inertia: inline errors (via useForm)
// Livewire: session flash errors only
```

```php
// Inertia controller returns errors for form binding
// Livewire component may just flash() without per-field errors
```

**Solution:** Standardize validation error presentation across the application. Use Laravel's `$errors` bag consistently for both stacks.

```php
// GOOD — both stacks use $errors
// Inertia: useForm handles $errors automatically
// Livewire: $this->addError('field', 'message') or $this->validate()
```

**Detection:** Search for validation error display patterns in Blade and Inertia views. Flag different patterns between stacks.

---

## Anti-Pattern 3: Duplicate Business Logic Across Stacks

**Symptom:** Implementing the same validation rules, authorization checks, or transformation logic separately for Livewire and Inertia endpoints.

**Problem:** Business logic duplication creates two maintenance paths. A change to validation rules must be applied in both the FormRequest and the Livewire component's `rules()` method. Over time, they inevitably diverge.

```php
// BAD — rules duplicated
class PostController extends Controller
{
    public function store(StorePostRequest $request) { /* ... */ }
    // rules in StorePostRequest
}

class CreatePost extends Component
{
    public function rules()
    {
        return ['title' => 'required|string|max:255']; // Same rules, different file
    }
}
```

**Solution:** Extract shared validation rules into a reusable method, trait, or dedicated rule class. Consume from both stacks.

```php
// GOOD — rules in one place
trait PostValidationRules
{
    public function postRules(): array
    {
        return ['title' => ['required', 'string', 'max:255']];
    }
}

class StorePostRequest extends FormRequest
{
    use PostValidationRules;
    public function rules(): array { return $this->postRules(); }
}

class CreatePost extends Component
{
    use PostValidationRules;
    public function rules(): array { return $this->postRules(); }
}
```

**Detection:** Search for duplicate rule arrays across FormRequests and Livewire components. Flag for extraction.

---

## Anti-Pattern 4: Over-Engineering the Stack Decision Early

**Symptom:** Building extensive abstraction layers, adapters, or factory patterns to keep the stack swappable between Livewire and Inertia.

**Problem:** Premature abstraction for stack portability adds significant complexity with zero benefit until the stack actually changes — which rarely happens. The abstraction layers obscure business logic and increase maintenance burden.

```php
// BAD — abstract stack adapter for a hypothetical future switch
interface FormHandler
{
    public function validate(array $rules);
    public function handleError(array $errors);
}

class LivewireFormHandler implements FormHandler { /* ... */ }
class InertiaFormHandler implements FormHandler { /* ... */ }
```

**Solution:** Pick the right stack for the job and commit. Only introduce abstraction when you have concrete evidence of multiple implementations needed.

```php
// GOOD — concrete, direct
class UpdateProfile extends Component
{
    public function save()
    {
        $this->validate();
        // Direct, simple, maintainable
    }
}
```

**Detection:** Search for interfaces, adapters, or abstract factories named with stack terminology (`FormHandler`, `ResponseAdapter`, `StackBridge`). Flag for removal.

---

## Anti-Pattern 5: Hybrid Pages Without Clear Data Flow

**Symptom:** Passing the same data through both Inertia's props and Livewire's mount parameters, resulting in double serialization and stale data.

**Problem:** When Inertia passes data as props and Livewire components on the same page receive the same data via mount, the two data stores can become out of sync. User interaction through Livewire updates the component's data but not Inertia's props, creating visible inconsistencies.

```php
// BAD — double data source
class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'notifications' => NotificationResource::collection(
                Notification::where('user_id', auth()->id())->get()
            ),
        ]);
    }
}
```

```php
// Livewire component also fetches notifications
class NotificationBell extends Component
{
    public $notifications = [];

    public function mount()
    {
        $this->notifications = Notification::where('user_id', auth()->id())->get();
    }
}
```

**Solution:** Use a single source of truth — either Inertia props or Livewire's mount — and let the other component read from it.

```php
// GOOD — single source
// Pass notifications only through Inertia; Livewire component does not re-fetch
```

**Detection:** Search for Inertia pages that also contain Livewire components fetching the same data.

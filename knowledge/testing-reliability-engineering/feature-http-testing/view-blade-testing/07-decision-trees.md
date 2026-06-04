# Decision Trees — View & Blade Component Testing

## Decision Tree 1: Isolated Component Test vs Full HTTP Test

```
How should this view rendering be tested?
│
├── Are you testing a Blade component in isolation?
│   └── Use `$this->blade()` (fast: ~5ms)
│       `$this->blade('<x-alert type="error">Message</x-alert>')`
│       Test: slot content, props, conditional rendering
│       Does NOT test: view composers, layout, controller
│
├── Are you testing the full page rendering end-to-end?
│   └── Use HTTP test with `get()` (~40ms)
│       `$this->actingAs($user)->get('/dashboard')`
│       Test: view data, layout, middleware, authorization
│       Does test: everything in the HTTP pipeline
│
└── Strategy: Use both
    ├── Component isolation tests for focused component behavior (90%)
    └── HTTP tests for integration coverage (10%)
        Example: component test + HTTP test for page-level assertions
```

## Decision Tree 2: `assertSee()` vs `assertSeeHtml()` vs `assertViewHas()`

```
What aspect of the view output needs verification?
│
├── Is the assertion about visible text content?
│   └── Use `assertSee($text)` (strips HTML tags)
│       `assertSee('Welcome back!')` — matches text regardless of HTML wrapping
│
├── Is the assertion about HTML structure (tags, attributes, classes)?
│   └── Use `assertSeeHtml($html)` (raw HTML comparison)
│       `assertSeeHtml('role="alert"')` — checks actual attribute presence
│       `assertSee('role="alert"')` would match escaped text, giving false positive
│
├── Is the assertion about controller passing correct data?
│   └── Use `assertViewHas($key, $value)`
│       `assertViewHas('user', fn($u) => $u->id === $user->id)`
│       Verifies controller computed correct data before rendering
│
└── Is the assertion about XSS escaping?
    └── Use `assertSee()` + `assertDontSeeHtml()`
        `assertSee('<script>')` — escaped text IS visible
        `assertDontSeeHtml('<script>')` — raw HTML must NOT be present
```

## Decision Tree 3: Conditional Display Testing

```
Does this UI element have conditional visibility?
│
├── Is it authorization-gated (role/permission based)?
│   └── Test BOTH sides
│       ├── Admin test: `$this->actingAs(admin)->get('/dashboard')->assertSee('Admin Panel')`
│       └── User test: `$this->actingAs(user)->get('/dashboard')->assertDontSee('Admin Panel')`
│       Missing the "dont see" test is the most common view testing gap
│
├── Is it conditional on data presence (empty vs populated)?
│   └── Test BOTH sides
│       ├── With data: `assertSee('Order #1234')`
│       └── Empty state: `assertSee('No orders yet')`
│
├── Is it a component with optional slots?
│   └── Test BOTH sides
│       ├── With slot: `assertSee('Custom content')` + `assertDontSee('Default content')`
│       └── Without slot: `assertSee('Default content')`
│
└── Is the element always visible?
    └── Single test is sufficient
        Still verify it renders on the page
```

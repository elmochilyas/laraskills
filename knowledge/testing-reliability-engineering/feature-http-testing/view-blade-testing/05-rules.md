# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: View & Blade Component Testing

---

### Rule 1: Test each conditional display branch with `assertSee()` and `assertDontSee()`

| Field | Value |
|-------|-------|
| **Name** | Test both sides of conditional display |
| **Category** | Conditional Content |
| **Rule** | For every authorization-gated or conditionally-rendered UI element, write two tests: one where the condition is true (`assertSee()`), and one where it is false (`assertDontSee()`). |
| **Reason** | Each condition branch is an independent failure mode. Testing only the "true" case means display bugs for unauthorized users or edge cases go undetected. The most common view testing gap is missing the "should not see" test. |
| **Bad Example** | Testing only that admin sees "Admin Panel" — guest sees it too due to missing `@can` check. |
| **Good Example** | `test_admin_sees_admin_panel()` + `test_user_does_not_see_admin_panel()`. |
| **Exceptions** | Content that is always visible regardless of user state. |
| **Consequences Of Violation** | Authorization-gated UI elements shown to unauthorized users. Sensitive controls exposed to wrong roles. |

---

### Rule 2: Test Blade components in isolation using `$this->blade()`

| Field | Value |
|-------|-------|
| **Name** | Use `$this->blade()` for component tests |
| **Category** | Component Testing |
| **Rule** | Test Blade components in isolation using `$this->blade('<x-component attr="value">Slot</x-component>')` before writing full HTTP page-level tests. |
| **Reason** | Component isolation tests are fast (~5ms vs ~40ms for full HTTP) and focused — they test the component rendering, not the controller, middleware, or layout. |
| **Bad Example** | Only testing component output via full HTTP page tests — slower and less focused. |
| **Good Example** | `$rendered = $this->blade('<x-alert type="error">Message</x-alert>'); $rendered->assertSee('Message'); $rendered->assertSeeHtml('role="alert"');`. |
| **Exceptions** | Components that depend on view composers or injected services only available through full HTTP requests. |
| **Consequences Of Violation** | Component tests are slow and tightly coupled to controller behavior. |

---

### Rule 3: Test components with and without optional slots/props

| Field | Value |
|-------|-------|
| **Name** | Test slot presence and absence |
| **Category** | Slot Testing |
| **Rule** | For components with optional slots or props, test both with and without the optional content. Verify default content appears when slot is empty. |
| **Reason** | Default/fallback content in Blade components uses `{{ $slot ?? 'Default' }}` syntax. A refactored component may break the fallback rendering while the primary rendering still works. |
| **Bad Example** | Testing only `<x-card>Custom content</x-card>` — default "No content" fallback breaks silently. |
| **Good Example** | `test_card_with_slot_shows_slot_content()` + `test_card_without_slot_shows_default()`. |
| **Exceptions** | Components with no optional elements (all slots are required). |
| **Consequences Of Violation** | Default content silently disappears. Users see empty containers or broken layouts. |

---

### Rule 4: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure

| Field | Value |
|-------|-------|
| **Name** | Use correct HTML assertion method |
| **Category** | HTML Assertions |
| **Rule** | Use `assertSee()` for visible text content (it strips HTML tags). Use `assertSeeHtml()` for HTML structure assertions (it checks raw HTML including tags). |
| **Reason** | `assertSee()` passes for text content regardless of HTML context (escaped vs raw). `assertSeeHtml()` catches missing attributes, wrong HTML classes, and malformed structure. Using the wrong method produces false positives or brittle tests. |
| **Bad Example** | `assertSee('<div class="alert">')` — matches escaped `&lt;div&gt;`, giving false positive. |
| **Good Example** | `assertSeeHtml('<div class="alert">')` — checks actual HTML structure. |
| **Exceptions** | `assertSee()` is sufficient for most text content assertions; reserve `assertSeeHtml()` for structure-specific checks. |
| **Consequences Of Violation** | HTML assertion false positives. Structural changes (missing classes, broken attributes) go undetected. |

---

### Rule 5: Assert view data with `assertViewHas()` for controller output verification

| Field | Value |
|-------|-------|
| **Name** | Verify controller passes correct view data |
| **Category** | View Data |
| **Rule** | Use `assertViewHas('key', $expectedValue)` to verify the controller passes the correct data to the view. |
| **Reason** | Rendered output assertions (`assertSee()`) verify the view displays data correctly. View data assertions (`assertViewHas()`) verify the controller computed the data correctly. They catch different failure modes. |
| **Bad Example** | Only `assertSee($user->name)` — doesn't verify the controller passed the data with the correct variable name. |
| **Good Example** | `assertViewHas('user', fn ($u) => $u->id === $user->id)` + `assertSee($user->name)`. |
| **Exceptions** | API responses where view data is not applicable (use JSON assertions). |
| **Consequences Of Violation** | Controller passes wrong data to view. View may display nothing or wrong content despite passing rendered checks. |

---

### Rule 6: Test that XSS in user-provided data is properly escaped

| Field | Value |
|-------|-------|
| **Name** | Verify XSS escaping in views |
| **Category** | Security |
| **Rule** | Create a user with XSS payload in their name/bio, render the view, and verify the payload is escaped (not rendered as HTML) using `assertSee()` and `assertDontSeeHtml()`. |
| **Reason** | Unescaped user content in Blade views is the most common XSS vulnerability in Laravel applications. `{{ }}` escapes automatically, but `{!! !!}` does not. Missing escaping allows stored XSS attacks. |
| **Bad Example** | No test — view uses `{!! $user->bio !!}` and attacker injects `<script>`. |
| **Good Example** | `$user = User::factory()->create(['bio' => '<script>alert("xss")</script>']); $this->actingAs($user)->get('/profile')->assertSee('<script>')->assertDontSeeHtml('<script>alert("xss")</script>');`. |
| **Exceptions** | Fields that are intentionally rendered as HTML (e.g., WYSIWYG editor content), where the test should verify that the HTML sanitizer is applied. |
| **Consequences Of Violation** | Stored XSS vulnerability in production. User data renders as executable script. |

# ECC Anti-Patterns — Blade Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Blade Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Structural HTML Assertions (Brittle Tests)
2. Single-Branch Conditional Testing (Missing `assertDontSee`)
3. Testing Framework Behavior Instead of Custom Logic
4. Asserting on Translation Keys Instead of Translated Values
5. Over-Asserting (Testing Every HTML Element)

---

## Repository-Wide Anti-Patterns

- Snapshot Testing for Full View HTML
- View Tests That Depend on Database State (using `create()` when `make()` suffices)
- HTTP Integration Tests for Simple Template Logic (slow, unnecessary)
- Testing Every Template Including Static Pages
- CSS Class Assertions for Styling Correctness

---

## Anti-Pattern 1: Structural HTML Assertions

### Category
Testing | Maintainability

### Description
Writing assertions that check for specific HTML tags, CSS classes, or markup structure instead of visible text content.

### Why It Happens
Developers inspect the rendered HTML and copy-paste tag structure into assertions, treating the test as a "snapshot" of the output.

### Warning Signs
- `assertSee('<h1>Title</h1>', false)` — hardcoded tags
- `assertSee('<div class="card">', false)` — class name assertions
- Tests break when a designer changes `<h1>` to `<h2>` or adds a CSS class
- High false-positive rate on UI changes; developers ignore failing view tests

### Preferred Alternative
Use `assertSeeText()` for visible content. Reserve structural assertions only for component attribute merging verification.

### Related Rules
- Rule: Assert on Visible Content, Not HTML Structure

---

## Anti-Pattern 2: Single-Branch Conditional Testing

### Category
Testing | Security

### Description
Testing only the "true" branch of a conditional display (e.g., admin sees admin panel) without testing the "false" branch (non-admin does NOT see admin panel).

### Why It Happens
Developers follow the happy path and don't think about negative assertions. The "false" branch feels like "nothing should happen" rather than testable behavior.

### Warning Signs
- `assertSee` for privileged content exists but no corresponding `assertDontSee` for unauthorized users
- Template refactoring accidentally exposes admin UI — test suite still passes
- All view tests are "positive" assertions only

### Preferred Alternative
Write paired assertions: one `assertSee` for the authorized user and one `assertDontSee` for the unauthorized user. Security-critical conditionals MUST have both.

### Related Rules
- Rule: Test Both Branches of Every Conditional

---

## Anti-Pattern 3: Testing Framework Behavior

### Category
Testing | Waste

### Description
Writing assertions that verify Laravel framework mechanics — that `view()` returns a `View` instance, that a component class exists, or that Blade's compiler works.

### Why It Happens
Developers write tests to achieve coverage metrics rather than testing actual business logic. The simplest "test" is checking that a method exists.

### Warning Signs
- `$this->assertInstanceOf(View::class, view('home'))`
- `$this->assertTrue(class_exists(Alert::class))`
- `$this->assertFileExists(resource_path('views/home.blade.php'))`
- Tests with zero assertions about actual rendered content

### Preferred Alternative
Test YOUR logic — conditional branches, data formatting, and display contracts. Framework behavior is already tested by Laravel core.

### Related Rules
- Rule: Do Not Test Framework Behavior

---

## Anti-Pattern 4: Asserting on Translation Keys Instead of Values

### Category
Testing | Reliability

### Description
Writing `$response->assertSee('messages.welcome')` instead of asserting on the actual translated string that the user sees.

### Why It Happens
Developers see translation function calls (`@lang('messages.welcome')`) in the template and assert on the key, not realizing the key itself appears in the HTML when the translation is missing.

### Warning Signs
- Assertions check for `messages.welcome` or `__('key')` patterns
- Missing translation files or locale directories don't cause test failures
- Tests pass even when placeholders are not substituted correctly
- No locale-specific assertions for supported languages

### Preferred Alternative
Set the locale explicitly with `App::setLocale('es')` and assert on the translated value (e.g., `Bienvenido`), not the translation key.

### Related Rules
- Rule: Test Translation Output, Not Translation Keys

---

## Anti-Pattern 5: Over-Asserting

### Category
Testing | Maintainability

### Description
Writing 20+ assertions per view test covering every `<div>`, CSS class, and structural element — effectively recreating the template structure in the test.

### Why It Happens
Developers aim for "complete coverage" of the rendered HTML, treating the test as a snapshot verification.

### Warning Signs
- 15+ assertions per view (most checking structural elements)
- Every CSS class name appears in the test assertions
- Tests require updates for minor UI changes (adding a wrapper div, changing a class)
- Developers spend more time maintaining view tests than writing new ones

### Preferred Alternative
Test critical content paths: visible text, conditional branches, data presence. Aim for 3-5 focused assertions per view.

### Related Rules
- Rule: Assert on Visible Content, Not HTML Structure

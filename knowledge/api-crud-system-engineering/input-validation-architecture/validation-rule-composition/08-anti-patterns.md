# Anti-Patterns: Validation Rule Composition

## String-Only Rules
**Description:** Using `'required|email|max:255|unique:users,email'` exclusively, avoiding array syntax entirely.
**Why it happens:** Developers learned Laravel with string syntax and never migrated to arrays.
**Consequences:** Cannot use Rule objects; string manipulation is fragile; extending is harder.
**Better approach:** Use array syntax. Add Rule objects and custom rules as composition needs grow.

## God Custom Rule
**Description:** A single custom rule class that checks format, uniqueness, business logic, and side effects — all in one passes() method.
**Why it happens:** Developers think "one rule per field" instead of "one check per rule."
**Consequences:** Rule is untestable in isolation; error messages are generic; reusability is limited.
**Better approach:** One rule per validation concern. Compose multiple rules at the Form Request level.

## Rule Fragmentation
**Description:** Repeating the same `['required', 'string', 'email', 'max:255']` rules array across 15 Form Requests.
**Why it happens:** No effort to extract shared definitions.
**Consequences:** Changing 'max:255' to 'max:500' requires updating 15 files.
**Better approach:** Extract shared rules to a method, base class, or custom rule.

## Conditional Maze
**Description:** Multiple nested ternary operators in the rules array that are impossible to read:
```
$this->has('role') ? ($this->role === 'admin' ? ['required', ...] : ['nullable', ...]) : ['sometimes']
```
**Why it happens:** Developers try to handle all conditions in a single rules() method.
**Consequences:** Rules are unreadable; conditions are untestable.
**Better approach:** Use Rule::when() with clear conditions. Or split into separate Form Requests.

## Regex Overreach
**Description:** Using a single regex pattern to validate format, length, and character restrictions combined.
**Why it happens:** Developers want compact validation and believe regex covers everything.
**Consequences:** Regex failures produce unhelpful "format invalid" messages; debugging regex is difficult.
**Better approach:** Compose multiple simple rules. Each produces a specific, actionable error message.

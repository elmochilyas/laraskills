# Rules: Validation Rule Composition

## Rule: Prefer Array Syntax Over Pipe Syntax
- **Condition:** When defining validation rules
- **Action:** Use array syntax: `['required', 'string', 'max:255']`. Avoid pipe-delimited strings: `'required|string|max:255'`.
- **Consequence:** Rule objects can be added without string manipulation.
- **Enforcement:** Linter flags pipe syntax in rule definitions.

## Rule: Use Rule Objects For Database Queries
- **Condition:** When validation needs to query the database
- **Action:** Use `Rule::unique()`, `Rule::exists()`, and other Rule objects. Avoid string equivalents.
- **Consequence:** Query parameters are explicit; injection-safe.
- **Enforcement:** Review flags `'unique:table,column'` string syntax.

## Rule: Create Custom Rule Classes For Reuse
- **Condition:** When the same validation logic is needed across multiple Form Requests
- **Action:** Create a custom rule class in `App\Rules` implementing `ValidationRule`. Use it in all affected Form Requests.
- **Consequence:** Single source of truth for reusable validation logic.
- **Enforcement:** Review flags duplicated closure rules across 3+ Form Requests — extract to class.

## Rule: Use Rule::when() For Conditional Composition
- **Condition:** When validation rules depend on application state
- **Action:** Use `Rule::when($condition, $rules, $defaultRules)` for explicit conditional composition. Avoid inline ternary in rules arrays.
- **Consequence:** Conditions are explicit; default behavior is clear.
- **Enforcement:** Review flags ternary operators in rules arrays.

## Rule: Compose Rules At Field Level
- **Condition:** When defining rules for a field with multiple validation requirements
- **Action:** List each validation rule as a separate array element. Don't combine concerns into a single regex or custom rule.
- **Consequence:** Each rule is independently testable; rule failures produce specific error messages.
- **Enforcement:** Review flags overly broad regex or custom rules that check multiple concerns.

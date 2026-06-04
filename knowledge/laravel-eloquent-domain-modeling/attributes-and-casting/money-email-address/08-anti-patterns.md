# Money, Email, Address Value Objects — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Money/Email/Address Patterns |
| Focus | Anti-patterns in domain primitive value object design |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Primitive Obsession With Monetary Values | Design | Critical |
| 2 | Float Arithmetic for Monetary Amounts | Reliability | Critical |
| 3 | Unnormalized Email Storage | Reliability | High |
| 4 | Unstructured String Address | Design | Medium |
| 5 | Missing Equality Comparison | Design | Medium |
| 6 | Missing Email Validation at Construction | Security | High |

## Repository-Wide Cross-Cutting Patterns

- Primitive obsession is pervasive: monetary amounts are stored as floats or strings, emails as unvalidated strings, addresses as unstructured text
- Float-based monetary arithmetic is the single most costly anti-pattern in financial applications, silently introducing rounding errors that accumulate into significant accounting discrepancies
- Email normalization is the most commonly missed validation step, causing duplicate accounts and confusing login failures

---

## 1. Primitive Obsession With Monetary Values

### Category
Design

### Description
Representing monetary amounts as plain integers, floats, or strings throughout the application instead of using a dedicated Money value object. Code passes around raw `int $cents` or `float $amount` where a Money type would provide type safety, arithmetic operations, and currency awareness.

### Why It Happens
Primitives are easy — no class to create, no constructor to call. The extra overhead of defining a Money object seems unnecessary for "simple" amounts. The cost of primitive obsession only appears as the application grows.

### Warning Signs
- Method signatures using `int $cents` or `float $amount` instead of `Money $money`
- Currency passed as a separate `string $currency` parameter alongside amount
- Inline currency arithmetic scattered across controllers and services
- No single type that represents "money with currency"
- Code that compares amounts without verifying currency compatibility

### Why Harmful
- No type safety: a function expecting cents can receive a dollar value and vice versa
- Currency is disconnected from amount: mixed-currency arithmetic passes silently
- Operations (add, subtract, allocate) are duplicated across every use site
- Refactoring to add a Money type later requires changing every method signature
- Business logic for monetary operations is scattered instead of centralized

### Consequences
- Mixed-currency arithmetic bugs (USD + EUR = incorrect total)
- Duplicated monetary logic across the codebase
- No single source of truth for monetary operations
- Higher risk of financial calculation errors
- Refactoring cost grows with every new feature using raw primitives

### Preferred Alternative
```php
class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public function add(Money $other): Money
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->cents + $other->cents, $this->currency);
    }
}
```

### Refactoring Strategy
1. Identify all places where monetary amounts are passed as raw primitives
2. Create a Money value object with integer cents and currency
3. Replace primitive parameters with Money type in method signatures
4. Update all callers to construct Money instances
5. Remove duplicated monetary arithmetic logic in favor of Money methods

### Detection Checklist
- [ ] Search for `int $cents`, `float $amount`, `$price`, `$total` parameters without type safety
- [ ] Count function signatures with separate amount and currency parameters
- [ ] Search for `$amount * 100`, `$value / 100` (raw cents conversion scattered)
- [ ] Check for monetary arithmetic in controllers and services (not in value object)
- [ ] Review if any type represents "money" — if not, primitive obsession exists

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Primitive obsession anti-pattern |
| Decision Tree | `07-decision-trees.md` — Decision 1: Integer Cents vs brick/money vs Float |
| Rule | `05-rules.md` — Use brick/money for monetary types |

---

## 2. Float Arithmetic for Monetary Amounts

### Category
Reliability

### Description
Using PHP `float` or `double` for monetary calculations. Floating-point arithmetic introduces precision errors (e.g., `0.1 + 0.2 !== 0.3`) that accumulate into accounting discrepancies over thousands of transactions.

### Why It Happens
Floats are the natural numeric type in PHP. Developers reach for `float` without considering precision implications. The errors are small per operation and only become visible at scale.

### Warning Signs
- Money amounts stored or calculated as `float` in PHP
- `round()`, `ceil()`, `floor()` applied to monetary values for "safety"
- Comparison `$a === $b` on float monetary values (unreliable)
- Accounting reports showing totals off by fractions of a cent
- Customer complaints about small pricing discrepancies

### Why Harmful
- Float arithmetic produces binary rounding errors: `0.1 + 0.2 = 0.30000000000000004`
- At scale (thousands of transactions), errors accumulate into real monetary losses
- Comparing float amounts for equality is unreliable
- Float precision errors are non-deterministic across platforms and architectures
- Financial audits will identify float-based arithmetic as a systemic risk

### Consequences
- Accounting reconciliation failures: system totals don't match bank totals
- Customer-facing price display errors: prices shown as `19.9999999999`
- Audit trail inaccuracies: every transaction has a small, accumulated error
- Financial reporting discrepancies that require manual correction
- Legal exposure from systematic accounting errors

### Preferred Alternative
```php
// Use integer cents
$totalCents = 1999 + 499; // $19.99 + $4.99 = $24.98

// Or use brick/money
use Brick\Money\Money;
$total = Money::of('19.99', 'USD')->plus(Money::of('4.99', 'USD'));
```

### Refactoring Strategy
1. Identify all float-based monetary calculations in the application
2. Convert to integer cents (multiply by 100 on input, divide by 100 on display)
3. For complex financial operations, adopt `brick/money`
4. Change database columns from DECIMAL/FLOAT to INTEGER cents
5. Add tests that verify monetary arithmetic with known precision-critical cases

### Detection Checklist
- [ ] Search for `float` type hints in monetary contexts
- [ ] Search for `round(`, `ceil(`, `floor(` on price/salary/amount variables
- [ ] Search for `===` comparisons on monetary float values
- [ ] Check database schema for `DECIMAL`, `FLOAT`, `DOUBLE` columns for money
- [ ] Test `0.1 + 0.2` patterns in the codebase — do they use floats?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use brick/money for Monetary Types, Not Float Arithmetic |
| Rule | `05-rules.md` — Store Money Amounts as Integer Cents Internally |
| Decision Tree | `07-decision-trees.md` — Decision 1: Integer Cents vs brick/money vs Float |

---

## 3. Unnormalized Email Storage

### Category
Reliability

### Description
Storing email addresses without normalizing to lowercase. Due to case-insensitivity per RFC 5321, `User@Example.com` and `user@example.com` are treated as different addresses, causing duplicate accounts and failed logins.

### Why It Happens
Users type their email in different cases during registration and login. Without normalization, these appear as different addresses. Developers may not know that the local part of an email is case-insensitive in practice (RFC 5321).

### Warning Signs
- Multiple user accounts with the same email in different cases
- Login failures when the user types their email in different case than registration
- Unique email constraint violated by case-different duplicates
- Email comparison logic that doesn't use case-insensitive matching
- Support tickets about "email already taken" when user tries their own email

### Why Harmful
- Users cannot log in if they type their email in different case than registration
- Duplicate accounts for the same person create data fragmentation
- Unique email constraints at the database level may be case-sensitive or case-insensitive depending on collation, creating inconsistent behavior across environments
- Password reset flows fail because the system can't find the user by their email

### Consequences
- User frustration from login failures due to case mismatch
- Duplicate user records for the same email address
- Support team workload from case-related account issues
- Data cleanup required to merge duplicate accounts
- Inconsistent behavior: some users "exist" in one case but not another

### Preferred Alternative
```php
class Email
{
    public function __construct(
        public readonly string $address
    ) {
        $normalized = strtolower(trim($address));
        if (! filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
        $this->address = $normalized;
    }
}
```

### Refactoring Strategy
1. Identify email storage points — are they normalized to lowercase?
2. Add normalization logic to the email value object constructor or setter
3. Run a migration to lowercase all existing email addresses
4. Update unique constraints to use case-insensitive collation (e.g., `utf8mb4_unicode_ci`)
5. Merge duplicate accounts that were created with different case variations

### Detection Checklist
- [ ] Search for `filter_var($email` or email assignment — is `strtolower` applied?
- [ ] Check database columns for case-insensitive collation
- [ ] Search for duplicate user accounts with same email in different cases
- [ ] Review login logic for case-insensitive email matching
- [ ] Test registration and login with mixed-case email addresses

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Normalize Emails to Lowercase on Construction |
| Rule | `05-rules.md` — Validate Email Format Before Storage |
| Decision Tree | `07-decision-trees.md` — Decision 3: Normalized vs Preserved Case |

---

## 4. Unstructured String Address

### Category
Design

### Description
Storing geographic addresses as a single unstructured string (e.g., `"123 Main St, Springfield, IL 62701"`) instead of a structured value object with typed components. Address components cannot be validated, queried, or formatted individually.

### Why It Happens
A single text field is the simplest database schema. Forms often collect addresses as a single textarea. Address parsing is complex, so storing as-is avoids parsing effort.

### Warning Signs
- Address stored as a single `VARCHAR` or `TEXT` column
- Code that tries to parse address components from the string using `explode(',')`
- Address validation limited to "is not empty"
- Shipping or billing addresses that cannot be validated at the component level
- Integration with address verification APIs requiring component parsing

### Why Harmful
- Cannot validate individual components (zip code format, state abbreviation, country code)
- Cannot query or filter by city, state, or zip code for reporting or shipping
- Country-specific formatting is impossible without parsing
- Address verification APIs require structured components
- International addresses with different formats are inconsistently stored

### Consequences
- Invalid addresses in the database (bad zip codes, nonexistent states)
- Shipping errors from unvalidated address components
- Inability to query customers by geographic region for analytics
- Difficult integration with address verification services
- Manual address correction required when components are misassigned

### Preferred Alternative
```php
class Address
{
    public function __construct(
        public readonly string $street,
        public readonly string $city,
        public readonly string $state,
        public readonly string $postalCode,
        public readonly string $country,
    ) {}
}
```

### Refactoring Strategy
1. Identify unstructured address columns in the database
2. Create a structured Address value object with typed components
3. Run a migration to add component columns and parse existing data
4. Update forms and API inputs to collect structured address components
5. Remove the old unstructured string column

### Detection Checklist
- [ ] Search for address fields stored as single string columns
- [ ] Search for `explode(',', $address)` or regex address parsing
- [ ] Check if address validation checks individual components
- [ ] Review address verification API integration for component requirements
- [ ] Assess internationalization — does the address format support non-US addresses?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Structured Value Objects for Addresses |
| Decision Tree | `07-decision-trees.md` — Decision 2: Structured vs Unstructured |
| Knowledge | `04-standardized-knowledge.md` — Address mapping to JSON or multiple columns |

---

## 5. Missing Equality Comparison

### Category
Design

### Description
Value objects for Money, Email, and Address that lack an `equals()` method, forcing callers to compare individual properties manually. Property-based comparison logic is duplicated, inconsistent, and fragile when new properties are added.

### Why It Happens
Explicit equality comparison seems unnecessary when PHP's `===` operator exists. Developers don't think of value objects as needing identity comparison — they compare properties as needed at each call site.

### Warning Signs
- Code comparing `$money->cents === $other->cents && $money->currency === $other->currency`
- No `equals()` method on value objects
- Comparison logic duplicated across controllers, services, and tests
- New property added to a value object but existing comparisons still exclude it
- Inconsistent comparison: some code checks currency, some doesn't

### Why Harmful
- Properties are omitted from comparisons inadvertently when new ones are added
- Comparison logic is scattered across the codebase — changing it requires finding every site
- Different developers implement comparisons differently (some check currency, some don't)
- Tests cannot easily assert equality of two value objects
- Increases cognitive load: developers must manually compare property by property

### Consequences
- Subtle bugs from incomplete comparisons (missing currency, missing country)
- Maintenance burden: adding a property to a value object requires updating comparisons everywhere
- Inconsistent comparison logic across the codebase
- Harder to write concise unit tests for value object behavior
- Code duplication from repeated property comparison patterns

### Preferred Alternative
```php
class Address
{
    public function equals(Address $other): bool
    {
        return $this->street === $other->street
            && $this->city === $other->city
            && $this->state === $other->state
            && $this->postalCode === $other->postalCode
            && $this->country === $other->country;
    }
}
```

### Refactoring Strategy
1. Add `equals()` method to each value object type
2. Remove all scattered property-level comparisons, replacing with `->equals()` calls
3. Include `equals()` in the value object's test suite
4. Add a new property checklist item: "update equals() when adding properties"

### Detection Checklist
- [ ] Check each value object for an `equals()` method
- [ ] Search for property-by-property comparisons (`->cents ===`, `->address ===`, `->street ===`)
- [ ] Count comparison sites per value object — are they duplicated?
- [ ] Review whether all properties are covered in existing comparisons
- [ ] Test: add a new property to a value object and see if comparisons break

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Implement Equality Comparison for All Domain Primitives |
| Knowledge | `04-standardized-knowledge.md` — Proper equality semantics |

---

## 6. Missing Email Validation at Construction

### Category
Security

### Description
Storing email addresses without validating their format at the value object boundary. Invalid emails enter the system, causing delivery failures, bounce processing errors, and potential injection vulnerabilities.

### Why It Happens
Validation seems like a presentation-layer concern. Developers trust that upstream validation (FormRequest, JavaScript) catches invalid emails. The value object accepts any string without checking.

### Warning Signs
- Email value object constructor that assigns `$this->address = $address` without validation
- Invalid emails in the database (missing `@`, invalid domains, empty strings)
- Email delivery failures traced back to malformed stored addresses
- No `filter_var($address, FILTER_VALIDATE_EMAIL)` in the codebase
- Multiple validation points scattered instead of one in the value object

### Why Harmful
- Invalid emails waste delivery resources (attempts to send to malformed addresses)
- Bounce processing systems receive malformed addresses that cannot be parsed
- Email injection attacks: unvalidated emails used in raw mail headers can inject BCC or attachments
- Downstream systems must re-validate, creating unnecessary complexity
- No single enforcement point — validation varies by code path

### Consequences
- Increased email delivery failure rate
- Potential email injection vulnerabilities
- Wasted server resources on delivery attempts to invalid addresses
- Duplicated validation logic across the codebase
- Bounce handling systems receiving unparseable address data

### Preferred Alternative
```php
public function __construct(
    public readonly string $address
) {
    if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
        throw new \InvalidArgumentException("Invalid email: {$address}");
    }
}
```

### Refactoring Strategy
1. Add email format validation to the email value object constructor
2. Remove scattered validation from controllers, FormRequests, and services
3. Run a migration to identify and clean up existing invalid emails
4. Add tests verifying that invalid emails throw exceptions at construction
5. Consider using a dedicated email validation library for more thorough checks

### Detection Checklist
- [ ] Check email value object constructor for `filter_var` or validation logic
- [ ] Search for `filter_var($email, FILTER_VALIDATE_EMAIL)` outside the value object
- [ ] Check database for known invalid email patterns
- [ ] Review email delivery error logs for format-related failures
- [ ] Verify email injection attempts are blocked by value object validation

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Validate Email Format Before Storage |
| Skill | `06-skills.md` — Email validation on construction |
| Knowledge | `04-standardized-knowledge.md` — Validate email with filter_var |

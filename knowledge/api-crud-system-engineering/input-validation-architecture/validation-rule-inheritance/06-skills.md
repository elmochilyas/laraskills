# Validation Rule Inheritance — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-rule-inheritance |

## Skills

### Skill: Design Store/Update Inheritance Hierarchy
- **Description:** Create a base FormRequest with shared rules and extend it for store/update-specific rules.
- **Steps:**
  1. Identify rules common to both store and update
  2. Create base FormRequest with those rules
  3. Create `StoreXRequest` extending base, adding store-specific rules
  4. Create `UpdateXRequest` extending base, overriding with `sometimes` and ignoring current ID
- **Context:** Use `array_merge(parent::rules(), [...])` to combine inherited and specific rules.

### Skill: Extract Reusable Rule Traits
- **Description:** Create traits for rule groups used across multiple FormRequests.
- **Steps:**
  1. Identify rule groups repeated across 3+ requests
  2. Create a trait with a method returning the rules array
  3. Use the trait in each FormRequest
  4. Call the trait method inside `rules()` using `array_merge`
- **Context:** Traits are preferable to deep inheritance for sharing rules across unrelated requests.

### Skill: Override Specific Rules in Child Classes
- **Description:** Replace or extend inherited rules in child FormRequests.
- **Steps:**
  1. Call `parent::rules()` to get inherited rules
  2. Use `array_merge` to override specific field rules
  3. Add new rules specific to the child class
  4. Use `array_diff_key` to remove inherited rules if needed
- **Context:** `array_merge` replaces rules by field key; new fields are added; identical fields are replaced.

### Skill: Compose Rules from Multiple Sources
- **Description:** Merge rules from a base class and one or more traits into a single rules array.
- **Steps:**
  1. Collect rules from parent: `$rules = parent::rules()`
  2. Merge in trait rules: `$rules = array_merge($rules, $this->addressRules())`
  3. Add request-specific rules: `$rules['field'] = ['rule1', 'rule2']`
  4. Return the composed array
- **Context:** Later merges override earlier ones; order traits by priority.

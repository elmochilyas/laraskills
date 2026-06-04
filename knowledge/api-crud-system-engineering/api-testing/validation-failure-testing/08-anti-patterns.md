# Anti-Patterns: Validation Failure Testing

## AP-1: No Validation Failure Tests
**Category**: Testing

**Description**: Writing only happy path tests without testing that invalid input is rejected with 422. Invalid data passes through to the database, causing data corruption and inconsistent state.

**Warning Signs**:
- Only happy path tests exist for endpoints with validation rules
- No `assertStatus(422)` or `assertJsonValidationErrors` in the test suite
- Developers rely on manual testing to verify validation
- Database log shows records with invalid data
- Form request rules exist but are not covered by tests

**Harms**:
- Invalid data passes through, causing data corruption
- Inconsistent database state
- Consumers send invalid data and receive 200 (success) with partial save
- No regression detection when validation rules are accidentally removed
- Data quality degrades over time

**Real-World Consequence**: A required `email` field is accidentally changed from `required|email` to `nullable|string` during a refactoring. No validation failure test exists. Invalid emails (plain text, missing @ sign) are accepted by the API. The marketing team's email campaign fails because half the user emails are invalid. Three months of data is corrupted before discovery.

**Preferred Alternative**: Write at least one validation failure test for each validation rule applied to each field.

**Refactoring Strategy**: Review all Form Request rule definitions, create a test dataset with invalid values for each rule, add `assertJsonValidationErrors` tests, use PestPHP datasets for efficiency.

**Detection Checklist**:
- `[ ]` Does every validation rule have a corresponding failure test?
- `[ ]` Are there Form Request rules not covered by tests?
- `[ ]` Would removing a `required` rule be caught by tests?
- `[ ]` Are boundary conditions (min-1, max+1) tested?

**Related**: 05-rules.md (One Test Per Validation Rule Per Field), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: Testing Only the 422 Status Without Specific Errors
**Category**: Testing

**Description**: Asserting only `assertStatus(422)` without verifying which fields have validation errors or what the error messages say. The test passes even when the wrong field fails validation.

**Warning Signs**:
- Validation tests only call `$response->assertStatus(422)`
- No `assertJsonValidationErrors` for specific fields
- No `assertJsonMissingValidationErrors` for fields that should pass
- A different field's error could trigger the 422 and test would pass
- Wrong validation rule on the wrong field goes undetected

**Harms**:
- False-positive validation tests
- Wrong field gets validation error (title error on body field)
- Missing validation on critical fields goes undetected
- Error message format is untested
- Cannot distinguish which rule triggered the error

**Real-World Consequence**: A test sends empty title and asserts `assertStatus(422)`. The 422 fires because `body` is also required, not because `title` validation works. The test passes. In production, `title` can be empty because the `required` rule was accidentally removed from the title field — but body still has its required rule, so the 422 always fires.

**Preferred Alternative**: Assert specific validation errors using `assertJsonValidationErrors(['field'])` and `assertJsonMissingValidationErrors(['field'])`.

**Refactoring Strategy**: Replace generic `assertStatus(422)` with field-specific `assertJsonValidationErrors(['field_name'])`, add `assertJsonMissingValidationErrors` for fields that should pass, use valid defaults for non-target fields.

**Detection Checklist**:
- `[ ]` Do validation tests assert specific field errors?
- `[ ]` Are `assertJsonValidationErrors` calls field-specific?
- `[ ]` Would a wrong-field error be detected?
- `[ ]` Are valid defaults provided for non-target fields?

**Related**: 05-rules.md (Set Valid Defaults For Non-Target Fields), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Testing Only Store, Not Update Validation
**Category**: Testing

**Description**: Writing validation failure tests only for POST (store) endpoints but not for PUT/PATCH (update) endpoints. Store and update often have different rule sets — `required` on store but `sometimes` on update.

**Warning Signs**:
- Validation tests exist only for POST endpoints
- PUT/PATCH endpoints have no validation failure tests
- Update rules are assumed to match store rules
- Update endpoint accepts partial data (sometimes rules) — untested
- Consumers report that update accepts invalid data

**Harms**:
- Update endpoint may accept invalid data that store rejects
- Sometimes/optional rules on update go untested
- Update may require fields that should be optional
- Consumers forced to send unchanged fields
- Inconsistent validation between create and update

**Real-World Consequence**: Store requires `title` (required rule). Update rule is `sometimes|string|max:255`. No update validation tests exist. A consumer sends PUT with a numeric title field (integer instead of string). The `sometimes` rule triggers (field is present), but one of the required rules is missing. The number passes validation. The database has a post with an integer title. The frontend crashes trying to uppercase the title.

**Preferred Alternative**: Write validation failure tests for both POST (store) and PUT/PATCH (update) form requests.

**Refactoring Strategy**: Review update Form Request rules (often different from store), add validation tests for update endpoint, test that update accepts partial data correctly, test that update rejects invalid data on fields that are present.

**Detection Checklist**:
- `[ ]` Are both store and update validation tested?
- `[ ]` Do update tests cover `sometimes`/optional rule behavior?
- `[ ]` Are update-specific rules (unique-with-ignore, sometimes) tested?
- `[ ]` Can the update endpoint accept valid partial data?

**Related**: 05-rules.md (Test Both Store And Update Form Requests), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Middleware Transformation Awareness
**Category**: Testing

**Description**: Writing validation tests without accounting for Laravel's `TrimStrings` and `ConvertEmptyStringsToNull` middleware. Empty strings are converted to null before validation, causing unexpected behavior.

**Warning Signs**:
- Validation tests send empty string `""` expecting required rule to catch it
- Tests pass but production validates differently
- Developers confused by `""` vs `null` behavior
- `nullable|string` fields accept empty strings when they shouldn't
- Framework upgrade changes middleware behavior, tests don't catch it

**Harms**:
- False-positive validation tests
- `""` passes validation when it should fail (converted to null on nullable fields)
- `""` fails validation when it should pass (converted to null on non-nullable required fields)
- Confusing developer experience — tests pass but production behaves differently
- Middleware configuration changes silently affect validation

**Real-World Consequence**: A test sends `['title' => '']` expecting `assertJsonValidationErrors(['title'])`. `ConvertEmptyStringsToNull` converts `""` to `null`. The `title` field is `nullable|string|max:255`. The validation passes because `null` is accepted by nullable. The test somehow still passes (because another required field is also missing). Wait — actually if `title` is the only field, the test would fail to get 422. But the real problem: the developer sees the test pass and believes empty strings are rejected. In production, empty strings are converted to null, which passes nullable validation, and the database stores null for title.

**Preferred Alternative**: Always test with input values that trigger middleware transformations. Send `null`, empty string `""`, and whitespace-only strings to verify middleware behavior.

**Refactoring Strategy**: Add tests with `null` value, empty string value, and whitespace-only string value for nullable fields, understand how `TrimStrings` and `ConvertEmptyStringsToNull` affect each field's validation, use `assertJsonValidationErrors` for values transformed by middleware.

**Detection Checklist**:
- `[ ]` Are middleware transformations tested for nullable/string fields?
- `[ ]` Are tests written with `null` values not just empty strings?
- `[ ]` Would `ConvertEmptyStringsToNull` behavior change be caught?
- `[ ]` Are whitespace-only values tested for string fields?

**Related**: 05-rules.md (Test Middleware Transformations), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: Single Test for All Validation Rules
**Category**: Testing

**Description**: Combining all validation rule tests into one massive test or dataset without clear separation. When validation changes, it's unclear which specific rule broke.

**Warning Signs**:
- Single test method covers all validation rules for an endpoint
- Dataset has 20+ rows with no clear grouping
- Test name is generic ("validates input") with no per-rule granularity
- Adding/removing a rule requires editing a massive test
- Failure message says "row 14 failed" — unclear which rule

**Harms**:
- Removing or relaxing a specific rule goes undetected
- Unclear failure messages — which rule broke?
- Hard to add regression tests for specific rules
- Dataset becomes unmanageable at scale
- Test doesn't serve as rule documentation

**Real-World Consequence**: A validation test has a dataset with 25 rows covering all rules. Rows 1-10 test `title` rules, rows 11-20 test `body` rules, rows 21-25 test `email` rules. The `title.required` rule is accidentally removed. Row 4 (which tested empty title) now fails — but the test report says "row 4 failed: expected 422, got 201." The developer must determine which rule row 4 tested. This takes 10 minutes of investigation.

**Preferred Alternative**: Group validation tests by field or logical rule group. Use separate test methods for critical rules (required, unique) and datasets for variations of the same rule.

**Refactoring Strategy**: Split monolithic validation tests into per-field test methods, use datasets for variations within a single field (min, max, format), keep each test method focused on one field's rules, add clear test method names reflecting the field.

**Detection Checklist**:
- `[ ]` Are validation tests organized by field?
- `[ ]` Can you tell which rule broke from the test failure message?
- `[ ]` Are test names descriptive of the field and rule?
- `[ ]` Would removing a single rule be clearly identified by a test failure?

**Related**: 05-rules.md (One Test Per Validation Rule Per Field), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-6: Not Testing Boundary Conditions
**Category**: Testing

**Description**: Testing only that invalid values fail (e.g., empty string for required) without testing boundary conditions (e.g., 2 characters for `min:3`, 256 characters for `max:255`). Validation can work for complete absence but fail for boundary values.

**Warning Signs**:
- No tests for `min-1` values (2 chars for min:3 rule)
- No tests for `max+1` values (256 chars for max:255 rule)
- Boundary values that should fail are accepted
- Boundary values that should pass are rejected
- String length and numeric range rules have no boundary tests

**Harms**:
- Boundary validation bugs undetected
- Off-by-one errors in min/max rules accepted
- Too-long strings truncate silently in database
- Too-short values accepted when they should be rejected
- Data integrity issues from boundary values

**Real-World Consequence**: A `title` field has `max:255` rule. The database column is `varchar(255)`. A test sends 256 characters — it should get 422. But there's no boundary test. In production, a consumer sends a 260-character title. Validation passes (max rule has off-by-one bug). The database truncates at 255 characters silently. Data is lost without warning.

**Preferred Alternative**: For every min/max/length rule, test the boundary: min-1 (should fail), min (should pass), max (should pass), max+1 (should fail).

**Refactoring Strategy**: Identify all min, max, size, between rules in form requests, add boundary test cases for each (min-1, min, max, max+1), use PestPHP datasets for boundary values, verify both rejection and acceptance boundaries.

**Detection Checklist**:
- `[ ]` Are boundary values tested for min/max rules?
- `[ ]` Is `min-1` tested (should fail)?
- `[ ]` Is `max+1` tested (should fail)?
- `[ ]` Are both lower and upper boundaries tested for between rules?

**Related**: 04-standardized-knowledge.md, 06-skills.md

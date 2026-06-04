# Anti-Patterns — API Version Behavior Testing

## Anti-Pattern 1: No Mirrored Version Test Directory Structure

**Category**: Test organization

**Description**: Storing all version-specific tests in flat test files without mirroring the version directory structure.

**Warning Signs**:
- All version tests live in a single `tests/Feature/Api/` directory with filenames like `V1PostsTest.php`, `V2PostsTest.php`
- No directory structure mirrors the version namespace
- Finding tests for a specific version requires searching by filename

**Why It's Harmful**: As versions grow and diverge, flat naming becomes inconsistent (`PostsV1Test`, `V1Posts`, `OldPostsTest`). Removing a version requires identifying all scattered test files. New developers cannot navigate the test suite by version.

**Real-World Consequence**: A team deletes `routes/v1.php` but forgets to delete scattered `*V1*` test files. The dead test files are never removed. A year later, someone refactors the `User` model and breaks a v1 test that's been dead for 12 months — CI fails with no corresponding code to fix.

**Preferred Alternative**: Mirror the version directory structure: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`.

**Refactoring Strategy**:
1. Create version directories: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`
2. Move version-specific test files into their respective directories
3. Remove version prefixes from filenames (they're implied by the directory)

**Detection Checklist**:
- [ ] Test directory mirrors version structure
- [ ] Filenames don't repeat version information already present in the directory path
- [ ] Removing a version means deleting one directory

**Related Rules**: Mirror Version Directory Structure In Tests
**Related Skills**: Test API Version Behavior
**Related Decision Trees**: Tree 1 — Version Test Structure

---

## Anti-Pattern 2: Duplicated Shared Assertions Across Versions

**Category**: Maintainability

**Description**: Copying the same shared assertions (error shape, pagination, auth failure) into every version's test class instead of extracting into a shared base.

**Warning Signs**:
- The same error shape assertion appears in `V1/PostsTest.php` and `V2/PostsTest.php`
- Changing the global error message format requires editing every version's test class
- Version test classes extend `TestCase` directly instead of a shared version base class

**Why It's Harmful**: Shared contract changes (e.g., error message format, pagination structure) require touching every version's test suite. Missed updates cause false failures. The maintenance burden grows linearly with the number of active versions.

**Real-World Consequence**: A team changes the error message from `"Not Found."` to `"Resource not found."`. They update V1 tests but forget V2. V2 CI fails. A junior developer spends an hour debugging before realizing it's a copy-paste gap.

**Preferred Alternative**: Create an `ApiVersionTestCase` base class with shared assertions, extended by all version-specific tests.

**Refactoring Strategy**:
1. Create `ApiVersionTestCase` with shared error shape, pagination, and auth failure tests
2. Make `apiPrefix()` abstract to force version subclasses to specify their URL prefix
3. Move duplicated assertions from version test classes into the shared base

**Detection Checklist**:
- [ ] All version test classes extend a shared base class
- [ ] Error shape assertions exist only in the shared base
- [ ] Pagination shape assertions exist only in the shared base

**Related Rules**: Share Common Assertions Via Base Test Class
**Related Skills**: Test API Version Behavior

---

## Anti-Pattern 3: No Deprecation Header Tests

**Category**: Testing completeness

**Description**: Testing deprecated API versions' response bodies and status codes without verifying deprecation signaling headers.

**Warning Signs**:
- Deprecated version tests assert `assertOk()` but never `assertHeader('Deprecation', 'true')`
- `Sunset` header is never tested for presence or correct date format
- Clients report they didn't know a version was deprecated

**Why It's Harmful**: Without deprecation headers, clients have no programmatic way to know a version is deprecated. They continue using the deprecated version until it's removed, causing breaking production changes when the version is finally retired.

**Real-World Consequence**: A team deprecates v1 with a 6-month sunset period but forgets to add `Deprecation` and `Sunset` headers. No client notices. On the sunset date, v1 is removed. All v1 clients break simultaneously. A major incident ensues.

**Preferred Alternative**: Assert `Deprecation: true` and `Sunset` headers on every endpoint of deprecated versions. Assert these headers are absent on active versions.

**Refactoring Strategy**:
1. Identify all deprecated versions
2. Add `->assertHeader('Deprecation', 'true')` and `->assertHeader('Sunset', '...')` to each endpoint test
3. Add `->assertHeaderMissing('Deprecation')` to active version tests

**Detection Checklist**:
- [ ] Deprecated versions return `Deprecation: true` header
- [ ] Deprecated versions return `Sunset` header with valid date
- [ ] Active versions have no deprecation headers

**Related Rules**: Test Deprecation Headers On Deprecated Versions
**Related Skills**: Test API Version Behavior
**Related Decision Trees**: Tree 2 — Deprecation Header Testing

---

## Anti-Pattern 4: No Unsupported Version Test

**Category**: Testing completeness

**Description**: Never testing that requests to unsupported API versions return 404 or an appropriate error.

**Warning Signs**:
- No test accesses `/api/v99/posts` or similar invalid version prefix
- The versioning middleware/route group is assumed correct without verification
- An unsupported version might fall through to the default version handler

**Why It's Harmful**: An unsupported version prefix may accidentally match an unrelated route, return a 500 error, or worse — silently return data from the default version without the client knowing. The client thinks it's using the requested version but gets different data.

**Real-World Consequence**: A client mistakenly calls `/api/v3/posts` (v3 doesn't exist). The route falls through to a catch-all that returns v1 data. The client processes the data as v3 format, misinterprets fields, and corrupts its database.

**Preferred Alternative**: Test that unsupported versions return 404 (for URL-prefix) or appropriate error (for header-based versioning).

**Refactoring Strategy**:
1. Add a test: `$this->getJson('/api/v99/posts')->assertNotFound()`
2. If using header-based versioning, test with an unsupported version value in the header
3. Verify the response body contains a clear error message

**Detection Checklist**:
- [ ] At least one unsupported version is tested
- [ ] Unsupported version returns 404 or documented error
- [ ] Response body clearly indicates the version is not supported

**Related Rules**: Test Unsupported Version Returns 404
**Related Skills**: Test API Version Behavior

---

## Anti-Pattern 5: Hardcoded Version URL Prefixes in Every Test

**Category**: Maintainability

**Description**: Repeating `/api/v1/` or `/api/v2/` in every test method instead of using a variable or `beforeEach` setup.

**Warning Signs**:
- Every test method contains hardcoded strings like `/api/v1/posts`, `/api/v1/users`
- Changing the version prefix requires find-and-replace across dozens of test files
- Copy-paste errors cause v2 tests to accidentally hit v1 routes

**Why It's Harmful**: Hardcoded prefixes create maintenance burden when the URL structure changes. They increase the chance of version-mixing bugs — a v2 test with a hardcoded `/api/v1/posts` silently tests the wrong version.

**Real-World Consequence**: A developer copies a v1 test, changes the body assertions for v2, but forgets to change `/api/v1/` to `/api/v2/`. The test passes because v1 and v2 have similar responses for this endpoint. The v2-specific feature is never actually tested.

**Preferred Alternative**: Use PestPHP `describe()` with `beforeEach` or a base class with `apiPrefix()` to set the version URL once.

**Refactoring Strategy**:
1. Create a base class with `protected string $apiPrefix = '/api/v1'` or use `beforeEach(fn () => $this->prefix = '/api/v1')`
2. Replace all hardcoded `/api/v1/` with `{$this->prefix}/`
3. Verify no hardcoded version prefixes remain in test methods

**Detection Checklist**:
- [ ] Version URL prefix is set in one place (base class or `beforeEach`)
- [ ] No hardcoded `/api/v1/` or `/api/v2/` in test methods
- [ ] Changing the prefix in one place updates all tests

**Related Rules**: Use PestPHP Describe With Version Prefix
**Related Skills**: Test API Version Behavior

---

## Anti-Pattern 6: Version-Specific Shapes Not Independently Tested

**Category**: Testing completeness

**Description**: Using the same shape assertion for both v1 and v2, or testing only the latest version's response shape.

**Warning Signs**:
- A single shape assertion is shared between v1 and v2 test suites
- Only v2 shape tests exist; v1 shape tests are missing
- Version-specific fields (like `author_name` in v1, nested `author` in v2) are not independently asserted

**Why It's Harmful**: V1 and v2 may return different response shapes for the same endpoint. A single shape assertion that matches both is too loose — it doesn't validate either version's exact contract. Missing version-specific shape tests mean contract breaks for that version go undetected.

**Real-World Consequence**: V2 renames `author_name` to `author.name`. The shared shape test asserts `['author']` — both pass. V1 accidentally inherits the v2 change and returns `author.name` instead of `author_name`. No test catches this. V1 clients break.

**Preferred Alternative**: Write separate shape assertions for each version, independently verifying their documented contracts.

**Refactoring Strategy**:
1. For each endpoint, identify version-specific response shape differences
2. Add version-specific shape assertions in the correct version's test suite
3. Remove shared shape assertions that are too loose to catch contract breaks

**Detection Checklist**:
- [ ] Each version has its own shape assertions for divergent fields
- [ ] No shared shape assertion masks version-specific contract breaks
- [ ] Shape tests would fail if v1 accidentally changed to v2 format

**Related Rules**: Version Per-Endpoint Response Shape Separately
**Related Skills**: Test API Version Behavior

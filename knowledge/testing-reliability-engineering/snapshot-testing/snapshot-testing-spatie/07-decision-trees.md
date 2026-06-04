# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Snapshot Testing
## Knowledge Unit: Snapshot Testing with Spatie

---

### Tree 1: Snapshot vs Explicit Assertions — Which to Use

```mermaid
flowchart TD
    A[Choose assertion strategy] --> B{Is the output large<br>and structured?}
    B -->|Yes — API response, rendered view, serialized data| C[Use snapshot for broad coverage]
    B -->|No — single value, simple boolean| D[Use explicit assertion]
    C --> E{Are there critical fields<br>that must never change?}
    E -->|Yes| F[Snapshot + explicit assertion for critical fields]
    E -->|No| G[Snapshot alone is sufficient]
    A --> H{Does output contain<br>dynamic data?}
    H -->|Yes — timestamps, UUIDs, random values| I[Normalize via custom driver or ignoreKeys — then use snapshot]
    H -->|No — fully static| J[Snapshot works directly]
    A --> K{How frequently does<br>output change?}
    K -->|Rarely — stable contract| L[Snapshot ideal — change = regression]
    K -->|Often — iterative development| M[Avoid snapshot — too much maintenance]
```

**Key decision points:**
- **Large/structured vs simple**: Snapshots for broad, multi-field output. Explicit assertions for individual values.
- **Critical fields**: Always pair snapshots with explicit assertions for values that must never change without review.
- **Stability**: Snapshots work best for stable outputs. Frequently changing outputs create maintenance burden.

---

### Tree 2: Which Snapshot Driver to Use

```mermaid
flowchart TD
    A[Choose snapshot driver] --> B{What is the output<br>format?}
    B -->|JSON / array| C[Use assertMatchesJsonSnapshot]
    B -->|HTML| D[Use assertMatchesHtmlSnapshot]
    B -->|Plain text| E[Use assertMatchesSnapshot]
    B -->|Binary file| F[Use assertMatchesFileSnapshot]
    B -->|XML / YAML| G[Use custom driver or dedicated snapshot type]
    C --> H[Handles key ordering, whitespace normalization]
    D --> I[Handles attribute ordering, whitespace]
    E --> J[Exact text comparison — sensitive to whitespace]
    F --> K[Binary comparison — use for generated files]
    A --> L{Dynamic data inside<br>the output?}
    L -->|Yes| M[Create custom driver to normalize timestamps/UUIDs to placeholders]
    L -->|No| N[Default driver is sufficient]
```

**Key decision points:**
- **Match driver to format**: JSON for JSON/arrays, HTML for views, text for plain strings, file for binaries.
- **Wrong driver = false failures**: Using text driver for JSON causes ordering/whitespace failures.
- **Dynamic data**: Create custom drivers to normalize dynamic values to stable placeholders.

---

### Tree 3: Snapshot Creation Workflow

```mermaid
flowchart TD
    A[Create or update snapshot] --> B{Snapshot exists?}
    B -->|No — new test| C[Create locally: run test with CREATE_SNAPSHOTS=true]
    B -->|Yes — needs update| D{Change intentional?}
    D -->|Yes — feature change| E[Update locally: run with CREATE_SNAPSHOTS=true]
    D -->|No — regression| F[Fix the code — don't update snapshot]
    C --> G[Review the generated snapshot file — verify it's correct]
    E --> G
    G --> H[Commit the snapshot file with the code change]
    H --> I[CI: CREATE_SNAPSHOTS=false — compares only, never creates]
    A --> J{Running in CI?}
    J -->|Yes| K[CREATE_SNAPSHOTS=false — fail if no snapshot exists]
    J -->|No — local| L[CREATE_SNAPSHOTS=true — create/update allowed]
```

**Key decision points:**
- **Local creation only**: Snapshots are always created locally, never in CI.
- **Review before commit**: Always inspect the generated snapshot file before committing.
- **CI behavior**: `CREATE_SNAPSHOTS=false` — CI fails if snapshot is missing, never creates one.

---

### Tree 4: Handling Dynamic Data in Snapshots

```mermaid
flowchart TD
    A[Handle dynamic data in snapshots] --> B{What type of<br>dynamic data?}
    B -->|Timestamps| C[Normalize to {TIMESTAMP} placeholder in custom driver]
    B -->|UUIDs| D[Normalize to {UUID} placeholder]
    B -->|Random values| E[Normalize to {RANDOM} or mock at source]
    B -->|Sequential IDs| F[Normalize to {ID} — IDs change per test run]
    A --> G{Custom driver or<br>ignoreKeys?}
    G -->|Simple exclusions (few keys)| H[Use ignoreKeys — built-in, less code]
    G -->|Complex transforms (many keys)| I[Create custom driver — reusable across tests]
    A --> J{Will dynamic data ever<br>be asserted?}
    J -->|Yes — format verification| K[Keep one dynamic value; add explicit assertion for format]
    J -->|No — always ignore| L[Always normalize — no value in asserting dynamic content]
```

**Key decision points:**
- **Type of dynamic data**: Timestamps, UUIDs, random values, and IDs each need normalization.
- **`ignoreKeys` vs custom driver**: Use `ignoreKeys` for simple exclusions. Create custom drivers for complex/reusable transforms.
- **Format verification**: If dynamic data format matters (e.g., ISO 8601), keep one example with explicit assertion + normalize others.

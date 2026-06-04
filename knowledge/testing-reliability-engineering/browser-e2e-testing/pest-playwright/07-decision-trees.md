# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Browser & E2E Testing
## Knowledge Unit: Pest Playwright Browser Testing

---

### Tree 1: Auto-Waiting vs Manual Waits — When to Trust Playwright

```mermaid
flowchart TD
    A[Determine waiting approach] --> B{Is the element being<br>clicked/typed into?}
    B -->|Yes — action interaction| C[Trust auto-waiting — Playwright waits for actionability]
    B -->|No — assertion only| D{Is the assertion about<br>URL or navigation?}
    D -->|Yes| E[Use waitForURL or waitForLocation]
    D -->|No — text visibility| F[Trust auto-waiting + assertSee]
    C --> G[Playwright waits: visible, enabled, stable, not obscured]
    G --> H{Dusk habit of manual<br>waitFor?}
    H -->|Yes| I[Remove — Playwright handles this automatically]
    H -->|No| J[Keep current code]
    A --> K{Is this a custom JS<br>condition?}
    K -->|Yes| L[Use waitForFunction for custom JS conditions]
    K -->|No| M[Auto-waiting covers all standard cases]
```

**Key decision points:**
- **Actions vs assertions**: Playwright auto-waits for actionability on clicks/types. Assertions also auto-wait for element visibility.
- **Dusk migration habit**: If coming from Dusk, remove `waitFor()` calls — Playwright auto-waits by default.
- **Custom conditions**: Only use `waitForFunction()` for JS-specific conditions not covered by auto-waiting.

---

### Tree 2: Network Interception — Full Mock vs Real API

```mermaid
flowchart TD
    A[Choose API strategy in browser test] --> B{What is being<br>tested?}
    B -->|UI rendering of API data| C[Mock API with $browser->intercept]
    B -->|Full-stack integration| D[Use real API via Laravel]
    B -->|Error handling UI| E[Mock specific error responses]
    C --> F[Don't mock ALL APIs — mock only what the test needs]
    F --> G[Leave real: static assets, auth endpoints for real behavior]
    D --> H[Ensure database is seeded with test data]
    E --> I[Mock: 500, 404, 429, timeout, empty response]
    A --> J{Third-party API<br>involved?}
    J -->|Yes| K[Mock third-party APIs always]
    J -->|No — internal API| L[Mock only when frontend-isolated testing]
```

**Key decision points:**
- **UI vs integration**: Mock APIs for frontend testing. Use real APIs for full-stack tests.
- **Error simulation**: Mocking is necessary for error paths that are hard to reproduce with real APIs.
- **Third-party vs internal**: Always mock third-party APIs. Internal APIs can be real or mocked depending on test scope.

---

### Tree 3: Cross-Browser Testing — PR vs Main Branch Strategy

```mermaid
flowchart TD
    A[Decide cross-browser scope] --> B{How frequently is<br>this run?}
    B -->|Every commit/PR| C[Run Chromium only — fastest feedback]
    B -->|Merge to main| D[Run all browsers: Chromium + Firefox + WebKit]
    B -->|Nightly| E[Run full matrix + visual regression]
    C --> F[Set PEST_BROWSER=chromium]
    D --> G[Matrix: chromium, firefox, webkit]
    E --> H[Add assertScreenshot for visual comparison]
    A --> I{Known browser-specific<br>issues?}
    I -->|Yes — WebKit differences| J[Run WebKit on PRs for that feature area only]
    I -->|Not currently| K[Standard strategy is sufficient]
```

**Key decision points:**
- **Frequency**: Every commit = Chromium only. Merge to main = full matrix. Nightly = full matrix + screenshots.
- **Known issues**: If specific browser has known differences, add that browser to targeted PR tests.
- **CI cost**: Full matrix is ~3x CI time. Only run on merge to main unless cross-browser issues are frequent.

---

### Tree 4: Trace Capture — On Failure vs Always

```mermaid
flowchart TD
    A[Configure trace capture] --> B{What's the test<br>purpose?}
    B -->|CI test suite| C[Capture traces only on failure]
    B -->|Debugging session| D[Capture traces on all attempts temporarily]
    C --> E[Config: trace: 'retain-on-failure']
    E --> F[Saves 30-50% test time vs always-on]
    D --> G[Config: trace: 'on' — disable after debugging]
    A --> H{Video recording<br>needed?}
    H -->|Yes — for visual debugging| I[Video on failure only — adds 30-50% time]
    H -->|No| J[Disable video — save CI artifacts space]
```

**Key decision points:**
- **CI vs debugging**: CI uses `retain-on-failure` for performance. Debugging sessions use `on` temporarily.
- **Video recording**: Adds significant overhead. Enable only when visual playback is needed for debugging.
- **Artifact storage**: Traces and videos consume CI artifact space. Set retention policies.

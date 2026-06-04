# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Test Data Management
## Knowledge Unit: Test Data Factories (States & Sequences)

---

### Tree 1: State vs Inline Attributes

```mermaid
flowchart TD
    A[Choose between state and inline attributes] --> B{Reusability?}
    B -->|Used in 3+ tests across files| C[State method — defined once in factory, used everywhere]
    B -->|Used in 1-2 tests| D[Inline attributes — simpler, no factory modification needed]
    A --> E{Domain meaning?}
    E -->|Clear domain concept — "published", "draft"| F[State method — encodes domain vocabulary into named method]
    E -->|Specific test scenario — "email starts with 'a'"| G[Inline attributes — too specific for a reusable state]
    A --> H{State complexity?}
    H -->|1-2 attributes| I[State or inline — either works, state adds clarity]
    H -->|3+ attributes (with relationships)| J[State method — groups related attributes under one name]
    A --> K{Example?}
    K -->|Reusable state — published post| L[Post::factory()->published()->create() — state method]
    K -->|One-off — specific title for one test| M[Post::factory()->create(['title' => 'My Test Title']) — inline]
```

**Key decision points:**
- **3+ uses → state method**: Reusable domain concepts belong in the factory.
- **1-2 uses → inline**: One-off scenarios don't need a permanent state.
- **Domain vocabulary → state**: If the concept has a name in the domain (published, draft), make it a state.

---

### Tree 2: Sequence Format — Explicit Array vs Callback

```mermaid
flowchart TD
    A[Choose sequence format] --> B{Variation type?}
    B -->|Static — specific values per item| C[Explicit array — sequence(['role' => 'admin'], ['role' => 'member'])]
    B -->|Dynamic — values derived from index| D[Callback — sequence(fn ($seq) => ['email' => "user{$seq->index}@example.com"])]
    A --> E{Sequence length?}
    E -->|Few items (2-5)| F[Explicit or callback — both are clear]
    E -->|Many items (5-100)| G[Callback — explicit arrays become verbose and error-prone]
    A --> H{Index usage?}
    H -->|Values depend on position| I[Callback with $seq->index — 0-based, predictable]
    H -->|Values are independent of position| J[Explicit array — each item has unique values defined directly]
    A --> K{Readability?}
    K -->|Explicit values are clearer| L[Explicit array — seeing all values at the call site]
    K -->|Pattern is cleaner than listing| M[Callback — pattern is obvious, avoid repeated values]
```

**Key decision points:**
- **Explicit array for static, few items**: `sequence(['role' => 'admin'], ['role' => 'member'])`.
- **Callback for dynamic, many items**: `sequence(fn ($seq) => ['email' => "user{$seq->index}@example.com"])`.
- **Index is 0-based**: `$seq->index` starts at 0. Use `$seq->index + 1` for 1-based values.

---

### Tree 3: Relationship Creation — `->has()` vs `afterCreating`

```mermaid
flowchart TD
    A[Choose relationship creation approach] --> B{Always required?}
    B -->|Yes — model is invalid without relationship| C[afterCreating — set up once, always present]
    B -->|No — test-specific relationship| D[->has() — explicit at call site, only when needed]
    A --> E{Visibility?}
    E -->|Should be visible in test| F[->has() — test reader sees the relationship is being created]
    E -->|Should be invisible (always present)| G[afterCreating — relationship is an implementation detail]
    A --> H{Performance?}
    H -->|Relationship always needed| I[afterCreating — same performance as ->has(), but centralized]
    H -->|Relationship rarely needed| J[->has() — avoids unnecessary creation when not needed]
    A --> K{Example?}
    K -->|Profile always required for user| L[UserFactory: afterCreating creates profile — every user has one]
    K -->|Comments only needed in specific tests| M[Test: Post::factory()->has(Comment::factory(3))->create()]
```

**Key decision points:**
- **`afterCreating` for always-required**: Profile for user. Centralized, invisible at call site.
- **`->has()` for test-specific**: Comments on a post. Explicit, visible only when needed.
- **Performance**: `afterCreating` always runs. `->has()` runs only when called.

---

### Tree 4: Attribute Precedence — Avoiding Conflicts

```mermaid
flowchart TD
    A[Understand and manage attribute precedence] --> B{Order of<br>application?}
    B -->|Base factory definition first| C[Lowest priority — foundation defaults]
    B -->|State applied to factory next| D[Medium priority — overrides base]
    B -->|Chained state (second state)| E[Higher priority — overrides first state if same attribute]
    B -->|create() attributes last| F[Highest priority — overrides all states]
    A --> G{Conflict scenario?}
    G -->|Two states set same attribute| H[Last state wins — chained order matters]
    G -->|State + create() same attribute| I[create() wins — overrides state]
    G -->|User mistake| J[Document precedence — prevent "obvious" errors]
    A --> K{Prevention?}
    K -->|Document in factory| L[Add comment: // create() > last state > first state > base]
    K -->|Review in PR| M[Flag conflicting states during code review]
    K -->|Avoid overlapping states| N[Design states to be complementary, not conflicting]
```

**Key decision points:**
- **Precedence order**: `create()` attributes > last applied state > first applied state > base definition.
- **Last state wins**: When chaining states, the last one overrides on conflicting attributes.
- **Prevention through documentation**: Document the precedence in factory files to prevent surprises.

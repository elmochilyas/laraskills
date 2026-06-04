# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Synonym and Typology Management
**Knowledge Unit:** Typesense Synonym Management
**Generated:** 2026-06-03

---

# Decision Inventory

1. Synonym Management Strategy
2. Typo Tolerance Configuration
3. Did You Mean? Suggestions Strategy

---

# Architecture-Level Decision Trees

## Synonym Management Strategy

---

### Decision Context

When implementing Typesense Synonym Management, you must decide how to define and manage synonym groups for your search engine.

### Decision Criteria

* accuracy
* maintainability

### Decision Tree

Do users search with varied terminology for the same concepts?
|
YES -> Implement synonym groups to map equivalent terms
    |
    Which synonym type is appropriate?
    One-way synonym (cheap -> inexpensive) -> For abbreviation/full-form mapping
    Two-way/Equivalent (laptop <-> notebook) -> For interchangeable terms
    |
    How are synonyms managed?
    Config/code -> Version-controlled, deployable, auditable
    Dashboard/API -> Flexible but not reproducible
NO -> Base search relevance is sufficient without synonyms
|
Do synonyms need to be updated frequently?
YES -> Use API-based management with admin interface
NO -> Static config-based synonyms are sufficient

### Rationale

Synonyms significantly improve search recall by matching queries to documents that use different but equivalent terminology. One-way synonyms are useful for abbreviations; two-way for interchangeable terms.

### Recommended Default

**Default:** Start with two-way synonyms for common term variations; version-controlled config.
**Reason:** Simplest approach that provides significant recall improvement.

### Risks Of Wrong Choice

- Overly broad synonyms: irrelevant results matching unrelated terms
- No synonym management: missed results for valid alternative terms

### Related Rules

- Manage Synonyms via Typesense API Directly
- Use multi_way for Genuine Equivalences
- Version-Control Synonym Configurations

### Related Skills

- Configure and Implement Typesense Synonym Management

---

## Typo Tolerance Configuration

---

### Decision Context

When implementing Typesense Synonym Management, you must decide how to configure typo tolerance to balance forgiveness with precision.

### Decision Criteria

* accuracy
* user-experience

### Decision Tree

Are user queries prone to typos (mobile users, long/complex terms)?
|
YES -> Enable typo tolerance with appropriate settings
    |
    Which typo tolerance strategy?
    Meilisearch -> Use built-in typo tolerance (auto-configured, 1 typo per 5 chars)
    Typesense -> Configure typo_tokens_threshold settings
    |
    Is typo tolerance needed for short queries (<4 chars)?
    YES -> Reduce min word size for typo tolerance (may increase irrelevant results)
    NO -> Default typo tolerance settings are sufficient
NO -> Disable or minimize typo tolerance for exact-match domains (codes, SKUs)

### Rationale

Typo tolerance improves user experience by forgiving common typing errors. However, for domains where precision is critical (product codes, SKUs, usernames), typo tolerance can cause incorrect matches.

### Recommended Default

**Default:** Enable typo tolerance with default engine settings.
**Reason:** The default settings handle the majority of typo scenarios well.

### Risks Of Wrong Choice

- No typo tolerance: user frustration from failed searches due to minor typos
- Excessive typo tolerance: irrelevant results for short or exact-match queries

### Related Rules

- Manage Synonyms via Typesense API Directly
- Use multi_way for Genuine Equivalences
- Version-Control Synonym Configurations

### Related Skills

- Configure and Implement Typesense Synonym Management

---

## Did You Mean? Suggestions Strategy

---

### Decision Context

When implementing Typesense Synonym Management, you must decide whether to implement query suggestions for zero-result or low-result searches.

### Decision Criteria

* user-experience
* maintainability

### Decision Tree

Do searches frequently return zero or very few results?
|
YES -> Implement Did you mean? suggestions
    |
    Which suggestion source?
    Engine-native -> Meilisearch/Typesense built-in suggestions
    External API -> Google Suggest, Bing, or custom spell-check service
    |
    Are suggestions based on existing index data?
    YES -> Engine-based suggestions are accurate and relevant
    NO -> External API may provide better coverage
NO -> Suggestions may not be necessary for your use case

### Rationale

Did you mean? suggestions rescue failed searches by offering corrected or alternative queries. Engine-native suggestions are simpler and contextually relevant to your data.

### Recommended Default

**Default:** Implement engine-native suggestions for zero-result queries.
**Reason:** Improves search completion rate with minimal implementation effort.

### Risks Of Wrong Choice

- No suggestions: users abandon search after failed queries
- Irrelevant suggestions: user confusion and distrust of search

### Related Rules

- Manage Synonyms via Typesense API Directly
- Use multi_way for Genuine Equivalences
- Version-Control Synonym Configurations

### Related Skills

- Configure and Implement Typesense Synonym Management


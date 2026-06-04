# Decision Trees — API Version Behavior Testing

## Tree 1: Version Test Structure

**Decision Context**: How to organize version-specific tests — mirrored directories, shared base classes, or conditional tests with version parameter.

**Decision Criteria**:
- Number of active versions
- Response shape differences between versions
- Test maintenance effort

**Decision Tree**:
```
Do all active versions share >80% of response shapes and behavior?
├── YES → Single test class with version parameter: describe('posts', fn() => it('returns posts for :version', ...)->with('versions'))
└── NO → Do versions have significantly different response shapes?
    ├── YES → Mirrored test directories: tests/Feature/Api/V1/, tests/Feature/Api/V2/ with shared base class
    └── NO → Single test class with version-specific describe() blocks; beforeEach sets $this->apiPrefix
```

**Rationale**: Mirrored directories are the clearest when versions diverge significantly. Parameterized tests reduce duplication when versions are similar.

**Recommended Default**: Shared base class (`ApiTestCase`) with version-specific subclasses or `describe()` blocks.

**Risks**: Parameterized tests become complex with diverging versions. Mirrored directories cause significant duplication without shared base classes.

---

## Tree 2: Deprecation Header Testing

**Decision Context**: Whether to test deprecation headers (Deprecation, Sunset) on deprecated API versions.

**Decision Criteria**:
- Active deprecation schedule
- Sunset policy enforcement
- Consumer notification requirements

**Decision Tree**:
```
Is the API version currently in its deprecation window (yellow/red stage)?
├── YES → Test that every endpoint in the deprecated version returns:
│   - Deprecation: true header
│   - Sunset header with the cutoff date (RFC 8594 format)
│   - Link header pointing to migration guide for the newer version
└── NO → Is the version active (green stage)?
    ├── YES → Assert Deprecation and Sunset headers are absent (not yet deprecated)
    └── NO → Is the version retired?
        ├── YES → Assert 410 Gone with Link header to migration guide (not in version behavior test — in retirement test)
        └── NO → No deprecation header testing needed
```

**Rationale**: Deprecation headers must be tested per-version to ensure consumers receive timely migration signals.

**Recommended Default**: Test `Deprecation: true` and `Sunset` headers on every endpoint of deprecated versions.

**Risks**: Missing deprecation headers leave consumers unaware of impending retirement, causing last-minute migration scrambles.

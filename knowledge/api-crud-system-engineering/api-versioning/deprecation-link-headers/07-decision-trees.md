# Decision Trees — Deprecation Link Headers

## Tree 1: Link Relation Selection

**Decision Context**: Which Link header relation types to include on deprecated responses — deprecation, sunset, alternate, latest-version.

**Decision Criteria**:
- Consumer action needed (migrate, learn about deprecation, find alternative)
- Link target availability
- Number of supported relation types

**Decision Tree**:
```
Is the version deprecated with an alternative available?
├── YES → Include ALL applicable relations:
│   rel="deprecation" → migration guide
│   rel="alternate" → same resource in the new version
│   rel="latest-version" → API root of the latest version
└── NO → Is the version deprecated but no alternative exists yet?
    ├── YES → Include only rel="deprecation" → page explaining the deprecation and timeline
    └── NO → Is the endpoint partially deprecated (some fields, not the whole endpoint)?
        ├── YES → Include rel="deprecation" → documentation of which fields are deprecated
        └── NO → No link headers needed (not deprecated)
```

**Rationale**: Each relation type serves a different consumer need. Providing all applicable relations maximizes consumer actionability.

**Recommended Default**: `rel="deprecation"` (migration guide) + `rel="alternate"` (new version equivalent).

**Risks**: Including `rel="alternate"` when the alternative doesn't exist yet leads to dead links. Excluding it leaves consumers without a clear migration target.

---

## Tree 2: Link Health Check Strategy

**Decision Context**: How to maintain link header target URLs over the deprecation period.

**Decision Criteria**:
- Deprecation window length
- Documentation URL stability
- Number of deprecated versions

**Decision Tree**:
```
Is the deprecation window longer than 6 months?
├── YES → Automated weekly link health check: verify all link targets return 200; alert on 404s
└── NO → Is the documentation team separate from the API team?
    ├── YES → One-time validation at deprecation start + manual check at each phase transition
    └── NO → Manual validation before each deprecation phase transition
```

**Rationale**: Long deprecation windows require automated health checks because documentation URLs can change independently. Short windows can use manual validation.

**Recommended Default**: Weekly automated link health check for all deprecated version Link headers.

**Risks**: Broken deprecation links are worse than no links — consumers follow a link expecting guidance and find an error page.

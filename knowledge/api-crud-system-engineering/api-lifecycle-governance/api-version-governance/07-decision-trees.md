# Decision Trees: API Version Governance

## Tree 1: When To Deprecate A Version

```
Is version usage below 5% of total API traffic?
├── YES → Is there a newer version available?
│   ├── YES → Has the newer version been available >6 months?
│   │   ├── YES → DEPRECATE: Set sunset date 6+ months out. Notify consumers.
│   │   └── NO → Wait until new version reaches 6-month availability. Re-evaluate.
│   └── NO → Do NOT deprecate. No migration target exists.
└── NO → Is the version unpatched for a critical CVE?
    ├── YES → ACCELERATE DEPRECATION: Set 30-day sunset. Notify consumers immediately.
    └── NO → Re-evaluate next quarter. Monitor usage trend.
```

## Tree 2: Breaking Change Classification

```
Does the change modify an existing response field?
├── YES → Is it removing a field?
│   ├── YES → BREAKING: Requires major version bump.
│   └── NO → Is it changing the field type?
│       ├── YES → BREAKING: Requires major version bump.
│       └── NO → Is it changing field semantics (e.g., null now means something different)?
│           ├── YES → BREAKING: Requires major version bump.
│           └── NO → NON-BREAKING: Additive change, safe within major version.
└── NO → Is the change adding a new endpoint, field, or parameter?
    ├── YES → NON-BREAKING: Safe within major version.
    └── NO → Is it changing request validation (tightening)?
        ├── YES → BREAKING: Existing valid requests may now fail.
        └── NO → Is it changing authentication/authorization requirements?
            ├── YES → BREAKING: Existing clients may lose access.
            └── NO → NON-BREAKING: Review for edge cases.
```

## Tree 3: Support Policy Selection

```
Who are the primary API consumers?
├── External (third-party developers, partners)
│   ├── Enterprise SLAs with 12+ month commitment?
│   │   ├── YES → N-2 support. 12-month minimum sunset window.
│   │   └── NO → N-2 support. 6-month minimum sunset window.
│   └── Open/public API (no SLA)?
│       ├── YES → N-2 support. 6-month notice. No guarantee of backward compatibility beyond major versions.
│       └── NO → N-2 support. 6-month sunset window.
└── Internal (same organization)
    ├── Monorepo with shared deployments?
    │   ├── YES → N-0 support (single active version). Coordinate breaking changes across teams.
    │   └── NO → N-1 support. 3-month sunset window.
    └── Multiple teams, independent deployments?
        ├── YES → N-2 support. 3-month sunset window.
        └── NO → Evaluate per consumer count.
```

## Tree 4: Governance Cadence Selection

```
How many supported versions are maintained?
├── 1 version → Annual governance review. Focus on future planning.
├── 2-3 versions → Quarterly governance review. Standard cadence.
├── 4+ versions → Monthly governance review. Need to reduce version count aggressively.
└── Transitioning (deprecations in progress) → Monthly reviews until count drops below 4.
```

## Tree 5: Consumer Notification When Deprecating

```
Do you have consumer contact information?
├── YES (registered consumers with email/webhook)
│   ├── Version used by >10% of traffic?
│   │   ├── YES → Direct email + dashboard notification + dedicated migration support.
│   │   └── NO → Email notification + changelog entry.
│   └── Version used by <1% of traffic?
│       ├── YES → Automated notification. Minimal personalized outreach.
│       └── NO → Standard notification process.
└── NO (anonymous consumers)
    ├── YES → Deprecation headers on all responses + changelog + public notice.
    └── NO → Sunset header (`Sunset: Sat, 31 Dec 2026 23:59:59 GMT`) on all responses.
```

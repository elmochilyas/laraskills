| Metadata | |
|---|---|
| KU ID | ku-09 |
| Subdomain | search-ux-and-analytics |
| Topic | Search A/B Testing |
| Source | Industry |
| Maturity | Stable |

## Overview

Search A/B testing compares search configurations to determine which produces better user engagement. Tests can compare ranking rules, engine configurations, UI layouts, or algorithm changes. Algolia provides built-in A/B testing. Custom implementations require user bucketing, statistical analysis, and metrics collection.

## Core Concepts

- **Test Types**: Ranking (algorithm), UI (layout, result display), Feature (typology, synonyms)
- **Control vs Variant**: A = current, B = proposed change
- **Metrics**: CTR, conversion rate, zero-result rate, query abandonment
- **User Bucketing**: Consistent assignment (by user ID hash or cookie)
- **Statistical Significance**: p-value < 0.05, power analysis for sample size
- **Duration**: Run until significance achieved, minimum 1 week

## When To Use

- Deploying ranking or feature changes
- Validating search improvement hypotheses
- Comparing engine configurations
- Optimizing for business metrics

## When NOT To Use

- Low-traffic applications (insufficient data)
- Trivial changes (not worth overhead)
- Exploratory changes (use offline evaluation first)

## Best Practices

1. **Run offline evaluation first**: Validate improvement before A/B test.
2. **Use Algolia built-in**: Simplest for Algolia users.
3. **Define primary metric**: One metric to determine success.
4. **Calculate sample size**: Use power analysis before starting.
5. **Run minimum 1 week**: Capture weekly usage patterns.
6. **Monitor secondary metrics**: Ensure no harmful side effects.

## Related Topics

- K022 (Algolia A/B testing)
- K011 (Search analytics)
- K013 (Relevance tuning workflow)

## AI Agent Notes

- Algolia has best built-in A/B testing
- Statistical significance is commonly misunderstood
- Custom A/B testing requires careful implementation to be reliable
- For agents: use Algolia built-in if available; implement carefully for other engines

## Verification

- [ ] Primary metric defined
- [ ] Sample size calculated
- [ ] User bucketing implemented
- [ ] Statistical significance testing set up
- [ ] Test duration determined (min 1 week)
- [ ] Secondary metrics monitored
- [ ] Rollback plan for variant
- [ ] Algolia built-in used if applicable

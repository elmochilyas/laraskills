| Metadata | |
|---|---|
| KU ID | ku-12 |
| Subdomain | relevance-and-ranking |
| Topic | A/B Testing Search Rankings |
| Source | Industry |
| Maturity | Stable |

## Overview

A/B testing for search compares two ranking configurations (A = control, B = variant) to determine which produces better user engagement. Key metrics: CTR, conversion rate, zero-result rate, query abandonment, user satisfaction. Algolia provides built-in A/B testing. Custom implementations require user bucketing and statistical analysis.

## Core Concepts

- **Control (A)**: Current ranking configuration
- **Variant (B)**: New ranking configuration to test
- **Metrics**: CTR, position-weighted CTR, conversion rate, zero-result rate
- **Statistical Significance**: p-value, confidence intervals, minimum sample size
- **User Bucketing**: Consistent assignment of users to A or B
- **Duration**: Run until statistical significance achieved (typically 1-4 weeks)

## When To Use

- Deploying ranking changes with measurable impact
- Validating personalization or custom ranking effects
- Comparing engine configurations (different engines)
- Optimizing for specific business metrics (conversion, engagement)

## When NOT To Use

- Low-traffic applications (insufficient data for significance)
- Trivial ranking changes (not worth evaluation overhead)
- Exploratory testing (use offline evaluation first)

## Best Practices

1. **Run offline evaluation first**: Validate improvement before A/B test.
2. **Define primary metric**: CTR or conversion rate.
3. **Calculate required sample size**: Use power analysis.
4. **Run minimum 1 week**: Capture weekly usage patterns.
5. **Monitor secondary metrics**: Ensure improvement in primary doesn't harm secondary.
6. **Use Algolia built-in**: Simplest path for Algolia users.

## Related Topics

- K022 (Algolia A/B testing)
- K011 (Search analytics)
- K006 (Learning to rank)

## AI Agent Notes

- Algolia has best built-in A/B testing; self-hosted requires custom implementation
- Statistical significance is often misunderstood — consult guidelines
- For agents: recommend offline evaluation first, then A/B test significant changes

## Verification

- [ ] Primary metric defined
- [ ] Sample size calculated
- [ ] User bucketing implemented
- [ ] Test duration determined
- [ ] Statistical significance testing set up
- [ ] Rollback plan for variant
- [ ] Algolia built-in used if applicable

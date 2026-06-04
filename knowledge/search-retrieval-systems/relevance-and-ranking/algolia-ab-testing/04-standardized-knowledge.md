| Metadata | |
|---|---|
| KU ID | K022 |
| Subdomain | relevance-and-ranking |
| Topic | Algolia A/B Testing |
| Source | Algolia Docs |
| Maturity | Stable |

## Overview

Algolia's built-in A/B testing framework allows comparing two ranking strategies, index configurations, or search parameters on live traffic. Tests split traffic between a baseline (control) and variant, measuring success metrics like click-through rate, conversion rate, and average click position. Results include statistical significance analysis to determine the winning configuration.

## Core Concepts

- **Control vs Variant**: Baseline index configuration vs the experimental configuration.
- **Traffic Splitting**: Percentage of search traffic directed to each variant.
- **Success Metrics**: CTR, conversion rate, average click position, revenue.
- **Statistical Significance**: Algolia calculates confidence level that the variant outperforms control.
- **Minimum Sample Size**: Tests need sufficient traffic for statistical validity.

## When To Use

- Before deploying major ranking changes to production
- Validating new index configurations (searchableAttributes, customRanking)
- Testing personalization or query rules impact
- Comparing different relevance tuning approaches
- Data-driven search relevance optimization

## When NOT To Use

- Low-traffic search (<1000 queries/day) — insufficient data for statistical significance
- Very minor configuration changes (not worth test setup)
- When the test would negatively impact user experience
- Non-Algolia search engines (use custom A/B testing instead)

## Best Practices

1. **Define clear success metrics**: What does "better" mean for your application?
2. **Run tests long enough**: Minimum 1-2 weeks to capture weekly patterns.
3. **Test one change at a time**: Isolate variables for clear attribution.
4. **Set minimum detectable effect**: Small improvements may not justify deployment complexity.
5. **Monitor for side effects**: Variant may improve CTR but reduce conversion.

## Architecture Guidelines

- Configure A/B tests in Algolia dashboard (not via Scout or code).
- Tests are specific to an Algolia application and index.
- Results available in Algolia analytics dashboard.
- Users are tracked anonymously via `clickAnalytics: true` parameter.

## Related Topics

- K018 (Algolia driver setup)
- K019 (Algolia index settings)
- K020 (Algolia analytics)
- K066 (Faceted search implementation)

## AI Agent Notes

- Algolia A/B testing is the easiest way to validate ranking changes with real traffic.
- Need sufficient traffic (1000+ queries/day) for statistically significant results.
- For agents: test one change at a time; run tests for 1-2 weeks minimum; define success metrics before starting.

## Verification

- [ ] A/B test configured in Algolia dashboard
- [ ] Success metrics defined
- [ ] Minimum traffic requirements met
- [ ] Control and variant properly configured
- [ ] Test duration adequate (1-2 weeks minimum)
- [ ] Results analyzed for statistical significance

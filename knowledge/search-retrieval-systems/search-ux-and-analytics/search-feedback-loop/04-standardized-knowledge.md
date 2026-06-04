| Metadata | |
|---|---|
| KU ID | ku-07 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Feedback Loop |
| Source | UX Research / Industry |
| Maturity | Mature |

## Overview

Search feedback loop captures user feedback on search quality to drive continuous improvement. Mechanisms: thumbs up/down on results, "Was this helpful?" prompts, result click tracking, and search abandonment analysis. Feedback data feeds into relevance tuning and content gap analysis.

## Core Concepts

- **Explicit Feedback**: Thumbs up/down, star rating, "helpful" prompts
- **Implicit Feedback**: Click-through rate, dwell time, scroll depth
- **Search Abandonment**: Query with no clicks — potential relevance failure
- **Feedback Dashboard**: Aggregate feedback metrics for quality monitoring
- **Feedback → Action**: Low-rated queries trigger relevance review

## When To Use

- Production search quality monitoring
- Relevance tuning data collection
- User-centered search improvement
- Any search with quality improvement goals

## When NOT To Use

- Temporary/experimental search implementations
- Very low-traffic search (insufficient feedback data)

## Best Practices

1. **Collect implicit feedback always**: Track clicks and position by default.
2. **Add explicit feedback for production**: Thumbs up/down is minimal friction.
3. **Act on feedback**: Low-rated queries should trigger review.
4. **Close the loop**: Notify users when their feedback leads to improvement.
5. **Combine with analytics**: Feedback + click data = comprehensive quality picture.

## Related Topics

- K011 (Search analytics)
- K013 (Relevance tuning workflow)

## AI Agent Notes

- Feedback loop is essential for continuous search quality improvement
- Implicit feedback (clicks) is more abundant than explicit (ratings)
- For agents: implement click tracking first, add explicit feedback later

## Verification

- [ ] Click tracking implemented
- [ ] Explicit feedback mechanism (thumbs up/down)
- [ ] Feedback data stored and aggregated
- [ ] Low-rated queries trigger review
- [ ] Feedback dashboard built
- [ ] Feedback loop closed (users notified of improvements)

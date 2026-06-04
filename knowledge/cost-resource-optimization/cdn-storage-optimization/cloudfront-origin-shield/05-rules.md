# CloudFront Origin Shield Rules

## Rule 1: Enable Origin Shield for Multi-Region Deployments
- **Category**: Architecture
- **Rule**: Enable CloudFront Origin Shield when serving a global audience across multiple continents
- **Reason**: Without Shield, 10 global edge POPs each independently request uncached content from origin; with Shield, 10 edge POPs request from 1 Shield POP, reducing origin requests by 70-90%
- **Bad Example**: Users in US, EU, and Asia all hitting the same origin independently on cache misses; each region generates its own origin request for the same object
- **Good Example**: Enabling Origin Shield in us-east-1 (origin region); EU and Asia edge POPs route through Shield, which aggregates requests into a single origin fetch
- **Exceptions**: Single-region apps with users concentrated near the origin
- **Consequences Of Violation**: 3-10x more origin requests than necessary; higher origin costs and potential origin overload

## Rule 2: Co-Locate Shield Region with Origin
- **Category**: Performance
- **Rule**: Set Origin Shield region to the same AWS region as the origin server
- **Reason**: Shield POP forwards to origin; latency between Shield and origin affects cache miss response time; choosing the same region minimizes added latency
- **Bad Example**: Origin in eu-west-1 with Shield region set to us-east-1; each cache miss incurs cross-Atlantic latency twice
- **Good Example**: Origin in eu-west-1 with Shield region set to eu-west-1; minimal latency between Shield and origin
- **Exceptions**: When an origin has no regional preference (global S3 bucket), choose the shield region nearest to the majority of users
- **Consequences Of Violation**: Increased latency on cache misses; slower response times for first-time visitors

## Rule 3: Monitor Origin Request Reduction
- **Category**: Performance
- **Rule**: Track CloudFront OriginRequests metric before and after enabling Shield to validate effectiveness
- **Reason**: Validates Shield configuration is working; if origin requests don't drop >50%, Shield region may be misconfigured, or content may be uncacheable
- **Bad Example**: Enabling Shield but not monitoring; origin requests show no reduction, but no one investigates
- **Good Example**: Before Shield: 10K origin requests/day; after Shield: 1.5K origin requests/day (85% reduction); confirmed effective
- **Exceptions**: Low-traffic apps may not have statistically significant data to measure reduction
- **Consequences Of Violation**: Shield enabled but not working effectively; no visibility into wasted configuration

## Rule 4: Combine Shield with Long Cache TTLs
- **Category**: Performance
- **Rule**: Use Origin Shield with cache TTLs of 24+ hours for maximum benefit
- **Reason**: Origin Shield's benefit increases with cache persistence; longer TTL means fewer cache refreshes, and Shield ensures only one origin request occurs on refresh instead of one per edge POP
- **Bad Example**: Using 1-hour TTL with Shield; objects expire frequently, and Shield aggregates origin requests every hour
- **Good Example**: Using 1-year TTL for versioned static assets with Shield; Shield handles the rare cache miss aggregation
- **Exceptions**: Content that must be fresh with short TTLs (news, stock prices) may still benefit from Shield but less dramatically
- **Consequences Of Violation**: Shield provides less benefit than possible; origin still handles frequent refresh requests

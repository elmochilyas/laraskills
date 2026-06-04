# Decision Trees: Token Usage & Cost Monitoring

## 1. Token Tracking Granularity

Is cost attribution per feature or per user required?
├── Per feature → Track by feature name dimension
│   ├── Counter[feature=chat-assistant], Counter[feature=content-summary]
│   ├── Set per-feature daily budgets with 80% alerts
│   └── Separate prompt vs completion tracking (2-4x cost difference)
├── Per user (chargeback) → Track user_id in trace attributes, tier in metrics
│   ├── Metric label: user_tier (free/pro/enterprise) — low cardinality
│   ├── Trace attribute: user_id — high cardinality, not a metric label
│   └── Budget: per-tier, not per-user
├── Aggregate only → Track total tokens with model and system dimensions
└── None needed → Skip per-LLM-call tracking; use API billing dashboard

## 2. Counter vs Histogram for Token Metrics

What analysis is needed?
├── Total tokens over time (cumulative cost) → Counter
│   └── Counter[gen_ai.tokens.total] with model, feature, system dimensions
├── Per-request token distribution (identify outliers) → Histogram
│   └── Histogram[gen_ai.tokens.per_request] with same dimensions
├── Both → Create both instruments
│   └── Different aggregation patterns for different queries
└── Cost calculation only → Counter is sufficient

## 3. Model Version Tracking

Is the application using multiple models or model versions?
├── Multiple models (GPT-4o, GPT-4o-mini, Claude) → Include model dimension
│   ├── 20x cost range between models
│   ├── gen_ai.request.model: "gpt-4o-2024-11-20"
│   ├── gen_ai.system: "openai" or "anthropic"
│   └── Cost = tokens × model-specific pricing in dashboard
├── Single model, fixed → Model dimension optional but recommended
│   └── Future model changes will add variance
└── Don't know which model → Record model from API response; analyze later

## 4. Cost Calculation Timing

Should cost be calculated at write time or in the dashboard?
├── Dashboard layer (recommended) → Store tokens × dimensions; calculate cost in Grafana/PromQL
│   ├── Pricing changes don't require code redeployment
│   ├── External pricing config in env vars or config map
│   └── Historical cost can be recalculated with new pricing
├── Write time → Hard-code cost per model in application
│   └── Simpler querying; but pricing changes require deploy
└── Hybrid → Store token counts; calculate cost both in-app and dashboard

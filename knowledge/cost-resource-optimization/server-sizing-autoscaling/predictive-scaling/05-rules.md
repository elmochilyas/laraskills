# Predictive Scaling — Rules

## R1: Use Predictive Scaling as Primary, Step Scaling as Fallback

**Category**: Scaling Strategy

**Rule**: ALWAYS configure predictive scaling as the primary scaling method with step or target tracking scaling as the reactive fallback. NEVER use predictive scaling alone.

**Reason**: Predictive scaling proactively provisions capacity based on forecasted load — it eliminates the 2-5 minute lag between traffic arriving and capacity responding. However, no forecast is perfect. Step/target tracking scaling catches unexpected spikes that the ML model did not predict. Together, they provide complete coverage: proactive for known patterns, reactive for unknown variance.

**Bad Example**: A Laravel B2B app uses only predictive scaling. A major client sends 3x their normal traffic on an unscheduled day (no pattern in historical data). Predictive scaling has no forecast for this — capacity stays at normal levels. Users experience slowdowns. The regression is not caught until the next forecast refresh.

**Good Example**: Predictive scaling pre-provisions 15 instances for the forecasted 10 AM peak. When the client's unexpected traffic hits (3x normal), target tracking on ALB RequestCountPerTarget detects the increase within 1 minute and adds 5 more instances. Service stays responsive. After the spike, target tracking scales back in. Predictive continues handling normal patterns.

**Exceptions**: For non-production environments with no real user traffic, predictive-only scaling is acceptable. Any production workload should have both.

**Consequences Of Violation**: Unexpected traffic peaks cause capacity gaps. The predictive model cannot react to real-time deviations — only the combination of proactive + reactive provides complete coverage.

---

## R2: Start with Forecast-Only Mode for 2 Weeks

**Category**: Validation

**Rule**: ALWAYS configure predictive scaling in "ForecastOnly" mode for at least 2 weeks before switching to "ForecastAndScale." NEVER allow a new predictive scaling policy to adjust capacity without validation.

**Reason**: Forecast-only mode predicts demand but does not change capacity. This allows you to compare the forecast against actual traffic and evaluate accuracy. If the model is over-predicting (40%+ error), you need to adjust the metric selection or schedule before trusting it with production capacity. Switching directly to forecast-and-scale risks over-provisioning (wasting cost) or under-provisioning (causing errors).

**Bad Example**: A team enables "ForecastAndScale" on a new ASG. The ML model, trained on 14 days of data, over-predicts Wednesday traffic by 50% because Wednesday was an anomaly (server migration caused elevated metrics). Predictive scaling adds 5 unnecessary instances every Wednesday. Monthly waste: $300. The team doesn't notice because "capacity is always ready."

**Good Example**: Forecast-only for 2 weeks. The team reviews the forecast accuracy graph: Wednesday predictions are consistently 50% above actual. They identify the training data anomaly and exclude that week's data. After cleanup, accuracy improves to 92%. They switch to ForecastAndScale. No over-provisioning.

**Exceptions**: For apps with extremely stable traffic (24/7 constant load with <5% variance), reduce forecast-only to 1 week. For highly cyclical apps (10x day/night variance), use the full 2 weeks.

**Consequences Of Violation**: Inaccurate forecasts drive unnecessary capacity changes. Over-provisioning wastes money for weeks before the model self-corrects. Under-provisioning causes performance issues.

---

## R3: Provide Clean Training Data (Remove Anomalous Periods)

**Category**: Data Quality

**Rule**: ALWAYS ensure predictive scaling training data excludes anomalous periods (deployment failures, DDoS attacks, holiday traffic, one-time events). NEVER let the model train on atypical traffic patterns.

**Reason**: The ML model uses the most recent 14 days of data to build its forecast. If those 14 days include a DDoS attack (10x normal traffic), the model will predict future attacks that don't exist and scale unnecessarily. If they include a holiday (10% normal traffic), the model will under-predict future capacity. Cleaning anomalies from training data is essential for accurate forecasting.

**Bad Example**: A Laravel app experiences a DDoS attack that generates 10x normal traffic for 6 hours. The 14-day training window includes this period. The model predicts future traffic should be high and pre-provisions 3x normal capacity for the next week. Cost: $1,000/month extra until the DDoS data leaves the 14-day window.

**Good Example**: After the DDoS attack, the team adjusts the training window to exclude the 6-hour anomaly period. Alternatively, they provide explicit schedule overrides for the next week. The model trains on clean data and predicts normal patterns. No over-provisioning.

**Exceptions**: For apps that genuinely have irregular traffic (news sites, event ticketing), the "anomaly" may be the actual pattern. In these cases, predictive scaling may not be the right tool — use step scaling instead.

**Consequences Of Violation**: The model learns and predicts anomalous patterns as normal. Over-provisioning or under-provisioning persists until the anomaly data exits the 14-day training window.

---

## R4: Set Max Capacity Bounds (2x Expected Peak)

**Category**: Cost Control

**Rule**: ALWAYS set a maximum capacity limit on the ASG (2x expected peak) when using predictive scaling. NEVER allow predictive scaling to set capacity without a cost cap.

**Reason**: Predictive scaling can increase capacity up to the ASG's maximum. If the model makes an error (over-prediction due to anomaly), it could scale to very high capacity. The maximum cap prevents runaway costs. A 2x expected peak cap provides safety while still allowing significant headroom for traffic growth.

**Bad Example**: ASG max = 100 (set based on "we might need it someday"). Predictive scaling error (model trained on anomalous data) causes scale-out to 80 instances. Normal peak is 20. Cost at 80 instances: $240/day vs $60/day normal. The team didn't notice for 3 days. Waste: $540.

**Good Example**: ASG max = 40 (2x normal peak of 20). Same model error causes scale-out to 40 instances (hits the cap). Cost: $120/day. The team receives a budget alert, investigates, and corrects the model within 1 day. Waste: $60 vs $540.

**Exceptions**: For mission-critical services requiring instant capacity for any possible traffic (life-critical systems), set max to 3-4x expected peak. There must always be a finite maximum.

**Consequences Of Violation**: A model error combined with no maximum cap causes cost overruns that could exceed the monthly infrastructure budget in a single day.

---

## R5: Monitor Forecast Accuracy (<80% = Retrain or Disable)

**Category**: Accuracy Governance

**Rule**: ALWAYS monitor predictive scaling's `ForecastAcc` CloudWatch metric. Retrain or disable predictive scaling if accuracy drops below 80% for 7+ consecutive days.

**Reason**: Traffic patterns change over time — new features, user behavior shifts, seasonal transitions. Predictive scaling's accuracy degrades as patterns shift. If accuracy drops below 80%, the model is performing worse than a simple "use last week's average" approach. Continuing to use it provides no value — you're paying (in over-provisioning or under-provisioning) for ML that doesn't work. Either retrain (clean data, different metrics) or disable and use step scaling.

**Bad Example**: A Laravel SaaS app's traffic pattern shifted over 6 months (changed from weekday-heavy to weekend-heavy). Predictive scaling accuracy dropped to 65%. The model over-provisions weekdays and under-provisions weekends. Monthly waste: $500/month. The team doesn't monitor ForecastAcc and assumes predictive scaling "just works."

**Good Example**: CloudWatch alarm fires: ForecastAcc below 80% for 7 days. The team investigates, discovers the traffic pattern shift, and retrains the model with the new 14-day data. ForecastAcc returns to 93%. No over-provisioning. The team also sets a quarterly review to catch pattern shifts before accuracy degrades.

**Exceptions**: For apps with seasonal patterns (holiday traffic), accuracy may temporarily drop during transition periods. Allow 14 days after a known pattern shift for the model to retrain before disabling.

**Consequences Of Violation**: Predictive scaling provides negative value — it scales for the wrong patterns, wasting cost or degrading performance. The organization pays for ML that is worse than doing nothing.

# Predictive Autoscaling — Rules

## R1: Enable Predictive Scaling After 2+ Weeks of Traffic Data

**Category**: Data Readiness

**Rule**: ALWAYS wait until the Auto Scaling group has 14+ days of historical traffic data before enabling predictive scaling. NEVER enable predictive scaling on a new ASG with less than 24 hours of data.

**Reason**: Predictive scaling uses ML-based analysis of historical traffic patterns to forecast future demand. With fewer than 2 weeks of data, the model cannot identify weekly cycles (Monday vs Friday traffic differences) or daily patterns. Early predictions are essentially random — they may cause over-provisioning or under-provisioning. AWS recommends 14 days of lookback data for the most reliable forecasts.

**Bad Example**: A team launches a new ASG for a B2B Laravel app and enables predictive scaling on day 3. Traffic is 100 req/s on day 1-2 (launch traffic) and drops to 30 req/s on day 3. The model learns the "pattern" as 30-100 req/s and predicts 65 req/s for day 4. Actual: 35 req/s. Predictive scaling over-provisions by 85%. Waste: $40/day.

**Good Example**: The team uses target tracking dynamic scaling for the first 14 days. After accumulating 2 weeks of historical data (showing clear weekday peaks and weekend troughs), they enable predictive scaling with forecast-only mode for 1 week. Validated predictions: within 10% of actual. They enable forecast-and-scale. Cost-efficient from day 1.

**Exceptions**: For migrated workloads with existing CloudWatch metrics in the same ASG (e.g., migrating from launch template v1 to v2), data may carry over. Verify the data is available before enabling.

**Consequences Of Violation**: Inaccurate predictions cause over-provisioning (wasted cost) or under-provisioning (degraded performance). The ML model has insufficient data to learn meaningful patterns.

---

## R2: Use Forecast-Only Mode for 1 Week Before Enabling Scaling Actions

**Category**: Validation Period

**Rule**: ALWAYS run predictive scaling in "forecast-only" mode for at least 1 week before switching to "forecast-and-scale." NEVER enable predictive scaling actions without validation.

**Reason**: Forecast-only mode shows predicted capacity vs actual capacity without taking any scaling action. This allows you to evaluate forecast accuracy for your specific traffic pattern before trusting the model to adjust production capacity. Bad predictions (over 20% error) mean the model needs adjustment — different metric selection or custom schedules. Without validation, a poor forecast could trigger unnecessary scale-out events that waste capacity.

**Bad Example**: A team enables "forecast-and-scale" on day 1. The ML model, trained on only 14 days of data (including a holiday week), overestimates Monday traffic by 40%. Predictive scaling adds 4 unnecessary instances on Monday morning. Cost: $50 wasted. The team didn't notice because capacity was "ready."

**Good Example**: Forecast-only mode for 1 week. The team reviews `PredictedCapacity` vs `ActualCapacity` in CloudWatch. They notice the model overshoots Monday by 40%. They identify that the training data included a holiday (low traffic Monday) followed by a busy Monday — the model conflated the pattern. They remove the holiday week from training or add a schedule override. After correction, they enable forecast-and-scale. Accuracy: 95%.

**Exceptions**: For apps with extremely stable, well-understood traffic patterns (e.g., 100 req/s 24/7), forecast-only validation can be reduced to 2-3 days.

**Consequences Of Violation**: A poorly calibrated model makes incorrect scaling decisions. Over-provisioning wastes money; under-provisioning degrades performance. Both erode trust in the predictive scaling feature.

---

## R3: Always Combine Predictive + Dynamic Scaling — Never Predictive Alone

**Category**: Fallback Strategy

**Rule**: ALWAYS combine predictive scaling with target tracking dynamic scaling as a safety net. NEVER use predictive scaling as the sole scaling mechanism.

**Reason**: Predictive scaling handles known patterns (normal daily/weekly cycles). Dynamic scaling handles unexpected variance (traffic surges from marketing campaigns, viral content, or partner traffic). Predictive alone cannot react to traffic exceeding the forecast — it only provides capacity for predicted load. Dynamic scaling catches the difference between predicted and actual, ensuring full coverage.

**Bad Example**: Predictive-only scaling on a B2B SaaS app. The ML model predicts 10 instances for Thursday at 2 PM. A customer's marketing campaign drives unexpected traffic requiring 16 instances. Predictive scaling does not react — it already set capacity for the forecast. Capacity stays at 10. Users experience degraded performance.

**Good Example**: Predictive scaling pre-provisions 10 instances for the forecasted 2 PM peak. Target tracking dynamic scaling monitors real-time request count. When traffic exceeds the forecast (16 instances needed), dynamic scaling adds 4 more instances within 2 minutes. Users see consistent performance. Cost savings: no over-provisioning on normal days.

**Exceptions**: For non-production environments where occasional under-performance is acceptable, predictive-only scaling may be sufficient. For production, always add the dynamic safety net.

**Consequences Of Violation**: Unexpected traffic peaks cause capacity shortfalls. The forecast model cannot adapt to real-time changes — predictive-only scaling leaves the application vulnerable to forecast errors and unplanned traffic surges.

---

## R4: Set Max Capacity Cap (1.5-2x Expected Peak)

**Category**: Cost Protection

**Rule**: ALWAYS configure a maximum capacity cap on the ASG (1.5x to 2x the expected peak). NEVER leave max capacity unbounded when using predictive scaling.

**Reason**: Predictive scaling can push capacity to the ASG's maximum if the forecast model predictively determines more instances are needed. If the model over-estimates (due to anomalous training data, holiday effects, or pattern shift), it could scale to unnecessarily high capacity. The maximum cap acts as a financial circuit breaker — it limits the maximum potential cost regardless of model behavior.

**Bad Example**: ASG min=2, max=unbounded. Predictive scaling model, after a week of anomalous high traffic (DDOS attack), predicts 100 instances needed. The ASG scales to 100 instances at $0.10/hour each = $10/hour. The team's normal peak is 20 instances. Cost: 5x normal until the model corrects (6+ hours). Temporary cost: $300+.

**Good Example**: ASG min=2, max=40 (2x expected peak of 20). Same anomalous prediction. Predictive scaling scales to 40 instances (max cap). Cost: 2x normal ($40/hour). The cap limits the financial impact. After 6 hours, the model corrects, and capacity drops. The cap saved $260.

**Exceptions**: For auto scaling groups handling mission-critical traffic where any capacity shortfall is unacceptable (e.g., emergency services), set max cap to 3x expected peak. There must always be a cap.

**Consequences Of Violation**: Unbounded maximum capacity exposes the organization to unpredictable costs from model errors. A single model anomaly could double or triple the monthly compute bill.

---

## R5: Monitor Forecast Accuracy — Retrain Model if <80% Accurate

**Category**: Accuracy Tracking

**Rule**: ALWAYS monitor predictive scaling forecast accuracy using CloudWatch metrics (`PredictedCapacity` vs `ActualCapacity`). Investigate and retrain the model if accuracy falls below 80%.

**Reason**: Predictive scaling's ML model degrades over time as traffic patterns shift. New features, user behavior changes, and seasonal shifts all reduce forecast accuracy. Accuracy below 80% means the model is doing worse than a simple "scale to average" approach — you're paying for ML that provides no benefit. Monitoring accuracy triggers retraining (which happens automatically daily) but the training data may need cleanup (removing anomalous periods) for better results.

**Bad Example**: A Laravel e-commerce site's predictive scaling model was trained last year. The site now has different traffic patterns (shifted to mobile traffic, different peak hours). Forecast accuracy: 65%. Predictive scaling consistently over-provisions by 20-40%. Monthly waste: $300/month. The team never checks accuracy because "it's ML, it should be smart."

**Good Example**: CloudWatch dashboard shows predictive scaling forecast accuracy for the past 30 days: 72% (below 80% threshold). The team investigates: new marketing campaigns changed Tuesday peak patterns. They add custom schedules for campaign days and clean the training data. Next month accuracy: 92%. Model retrained. Savings: $200/month.

**Exceptions**: For apps with inherently volatile traffic (gaming, flash sales), 70% accuracy may be the best achievable. In this case, consider whether predictive scaling is the right tool at all.

**Consequences Of Violation**: Persistent forecast inaccuracy defeats the purpose of predictive scaling. The organization pays for ML-powered scaling that performs worse than simple target tracking. The cost of the inaccuracy (over-provisioning) is invisible.

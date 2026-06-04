# ECC Anti-Patterns — Search Feedback Loop
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Feedback Loop | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Feedback Collection Mechanism
2. Collecting Feedback Without Acting on It
3. Relying Only on Explicit Feedback
4. Not Closing the Feedback Loop with Users
5. Feedback Data Siloed from Analytics
---
## Repository-Wide Anti-Patterns
- Treating feedback as a feature rather than a continuous process
- Not weighting feedback by user trust or expertise
- Ignoring implicit feedback (clicks, dwell time) entirely
---
## Anti-Pattern 1: No Feedback Collection Mechanism
### Category
User Experience | Process
### Description
Not providing any way for users to rate search result quality, losing valuable signal about search performance from the people who use it most.
### Why It Happens
Teams focus on technical search metrics and forget the user perspective. Feedback mechanisms feel like extra work.
### Warning Signs
- No "Was this helpful?" prompt on search results
- No thumbs up/down on individual results
- No way for users to report missing content
- Team unaware of user satisfaction with search
### Why Harmful
Without direct feedback, you rely entirely on implicit signals (clicks) which may not indicate satisfaction. Users may click a result out of desperation. You lack the user's direct assessment of quality.
### Consequences
- Search quality measured without user input
- Click-based metrics may not reflect satisfaction
- Missing content unreported
- Team blind to user sentiment about search
### Alternative
Add lightweight explicit feedback (thumbs up/down) to search results.
### Refactoring Strategy
1. Add "Was this helpful?" prompt below search results
2. Add thumbs up/down per result item
3. Store feedback with query context
4. Build feedback dashboard
5. Review feedback regularly
### Detection Checklist
- [ ] Feedback mechanism on search results
- [ ] Thumbs up/down per result
- [ ] Feedback stored with query context
- [ ] Feedback dashboard built
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Collecting Feedback Without Acting on It
### Category
Process | User Experience
### Description
Gathering user feedback on search quality but not having a process to review and act on it, creating a broken feedback loop.
### Why It Happens
Feedback collection is easier to implement than the organizational process to act on it.
### Warning Signs
- Feedback data collected but never reviewed
- Low-rated queries unchanged for months
- Users report same issues repeatedly
- No team owns feedback review
### Why Harmful
Collecting feedback without action is worse than no feedback. Users who provide feedback expect improvement. When nothing changes, they feel ignored and lose trust.
### Consequences
- User trust eroded from ignored feedback
- Same search issues persist despite user reporting
- Team unaware of feedback data existence
- Feedback collection seen as performative
### Alternative
Establish a feedback review process with assigned ownership and action tracking.
### Refactoring Strategy
1. Assign feedback review ownership to a team member
2. Weekly review of low-rated queries
3. Categorize feedback: synonym needed, content gap, ranking issue
4. Create action items for each category
5. Track feedback-to-action closure rate
### Detection Checklist
- [ ] Feedback review process active
- [ ] Owner assigned for feedback
- [ ] Low-rated queries create action items
- [ ] Feedback-to-action rate tracked
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Relying Only on Explicit Feedback
### Category
Data Quality | Accuracy
### Description
Depending solely on explicit user ratings (thumbs up/down) while ignoring the much more abundant implicit signals from click behavior.
### Why It Happens
Explicit feedback is direct and easy to understand. Implicit feedback requires more sophisticated analysis.
### Warning Signs
- All decisions based on thumbs up/down data
- Click data not used for relevance analysis
- Low volume of explicit feedback limits analysis
- Implicit signals (dwell time, scroll) not tracked
### Why Harmful
Explicit feedback is rare (1-5% of users) and suffers from selection bias (extremely happy or unhappy users are more likely to rate). Implicit feedback from 100% of users is more representative.
### Consequences
- Feedback data from vocal minority only
- Insufficient volume for statistical analysis
- Missed signals from passive users
- Feedback biased toward extremes
### Alternative
Combine explicit feedback with implicit signals (clicks, dwell time, repeat searches) for comprehensive quality measurement.
### Refactoring Strategy
1. Implement click tracking for implicit feedback
2. Track dwell time on clicked results (time on page before returning)
3. Track search abandonment (query with no clicks)
4. Correlate implicit signals with explicit ratings
5. Weight explicit feedback higher but use implicit for coverage
### Detection Checklist
- [ ] Implicit feedback (clicks) tracked alongside explicit
- [ ] Dwell time measured
- [ ] Abandonment tracked
- [ ] Implicit and explicit combined in analysis
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: Not Closing the Feedback Loop with Users
### Category
User Experience | Trust
### Description
Not communicating back to users when their feedback leads to search improvements, missing an opportunity to build trust and engagement.
### Why It Happens
Teams fix issues but don't have a mechanism to inform users. The feedback loop is one-directional.
### Warning Signs
- Users who gave negative feedback months ago
- No "Thanks to your feedback, we improved X" communication
- Users don't know if their feedback matters
- Repeat feedback on issues that were already fixed
### Why Harmful
Users who provide feedback and see no response assume their input is ignored. They stop giving feedback and may disengage from the product entirely.
### Consequences
- Reduced feedback engagement over time
- Lost opportunity to showcase improvement
- User trust in the feedback system erodes
- Negative brand perception
### Alternative
Notify users when their feedback leads to improvements: "Thanks to your feedback, we improved search for [query]."
### Refactoring Strategy
1. Implement notification mechanism for feedback submitters
2. When a feedback-driven change is made, notify affected users
3. Show "We fixed X based on user feedback" in search UI
4. Publish search quality changelog for transparency
5. Track user re-engagement after feedback acknowledgment
### Detection Checklist
- [ ] Feedback loop closed with users
- [ ] Users notified when feedback leads to change
- [ ] Search quality changelog available
- [ ] User engagement with feedback tracked
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Feedback Data Siloed from Analytics
### Category
Data Quality | Architecture
### Description
Storing feedback data in a separate system from search analytics, making it difficult to correlate feedback with query behavior and metrics.
### Why It Happens
Feedback is implemented as a separate feature by a different team or at a different time.
### Warning Signs
- Feedback data in separate database/table with no link to search logs
- Cannot answer "what was the CTR for low-rated queries?"
- Feedback analysis requires manual joins of unrelated datasets
- No unified search quality dashboard
### Why Harmful
Without integrated data, you cannot understand the context behind feedback. A low rating could be due to ranking, content gap, or UI issue. Without search log correlation, you're guessing.
### Consequences
- Incomplete understanding of feedback causes
- Manual data correlation effort required
- Missed insights from combining datasets
- Inefficient feedback analysis process
### Alternative
Store feedback linked to the search query log record via session ID or query ID.
### Refactoring Strategy
1. Add session_id or query_id to feedback data model
2. Integrate feedback storage with search logging
3. Build unified dashboard showing feedback + analytics
4. Enable queries: "show CTR for queries rated poorly"
5. Correlate feedback with query, filters, and result positions
### Detection Checklist
- [ ] Feedback linked to search query data
- [ ] Unified feedback + analytics dashboard exists
- [ ] Cross-dataset analysis possible
- [ ] Feedback context (query, filters, position) captured
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

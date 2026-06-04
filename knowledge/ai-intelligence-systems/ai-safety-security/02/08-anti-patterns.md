# Anti-Patterns: Content Moderation & Safety Filtering

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-02 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Type** | Safety |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Input-Only Moderation](#1-input-only-moderation)
2. [Binary Block-or-Allow Moderation](#2-binary-block-or-allow-moderation)
3. [One-Size-Fits-All Policy](#3-one-size-fits-all-policy)
4. [Silent Blocking Without Feedback](#4-silent-blocking-without-feedback)
5. [Context-Ignorant Keyword Filtering](#5-context-ignorant-keyword-filtering)

---

## 1. Input-Only Moderation

### Category
Incomplete Coverage

### Description
Applying content moderation only to user input before it reaches the LLM, but not to LLM output before it reaches the user. This protects the model from processing harmful requests but does not prevent the model from generating harmful responses, regurgitating toxic training data, or producing unsafe content.

### Why It Happens
- Assumption that if the input is clean, the output will be clean
- Performance concerns about adding latency to the response path
- Simplicity: implementing one moderation direction is easier than two
- Overconfidence in model alignment and safety training

### Warning Signs
- Moderation middleware exists only on the request pipeline, not the response pipeline
- No output-specific validation or content checks after LLM response
- Security testing only covers input injection, never output safety
- Content safety checks are absent in the streaming response path

### Why Harmful
- The LLM can still generate harmful content even from benign inputs
- Training data regurgitation can leak PII, copyrighted text, or offensive material
- Users can see harmful content before moderation, damaging trust and violating policies

### Real-World Consequences
- LLM generates hate speech or violent content from innocent prompts
- PII from training data leaks through model output
- Regulatory fines for exposing users to harmful content
- Brand damage from publicly visible unsafe outputs

### Preferred Alternative
Implement symmetric moderation: input moderation before the LLM call and output moderation after. Use the same detection pipeline for both directions, but tune thresholds independently (output can be stricter than input).

### Refactoring Strategy
1. Identify the LLM response code path and inject a moderation check after receiving the response
2. Use the same rule-based + ML classifier pipeline as input moderation
3. For streaming, implement per-chunk or buffer-then-check moderation
4. Add response blocking that returns a sanitized fallback when output fails moderation
5. Monitor both input and output moderation metrics independently

### Detection Checklist
- [ ] Output moderation exists alongside input moderation
- [ ] Streaming responses include per-chunk or buffered moderation
- [ ] Blocked outputs return safe fallback content, not errors
- [ ] Output moderation has its own thresholds (stricter than input)

### Related Rules/Skills/Trees
- Skill: Implement Content Moderation and Safety Filtering
- Decision Tree: Security Configuration

---

## 2. Binary Block-or-Allow Moderation

### Category
Oversimplified Response Strategy

### Description
Using only two actions for moderation: block or allow. This treats all violations with equal severity and provides no graduated response. Medium-confidence detections that could be false positives are blocked, and borderline content that should be flagged for review passes through as allowed.

### Why It Happens
- Simplicity: boolean allow/deny is the easiest model to implement
- Risk aversion: blocking everything suspicious seems safer
- Lack of a review workflow for flagged content
- No clear definitions of harm category severity levels

### Warning Signs
- Moderation returns only `true` (blocked) or `false` (allowed)
- No flag-for-review or warn-then-allow actions exist
- Users receive the same error for hate speech and mild profanity
- No mechanism for moderators to review flagged content

### Why Harmful
- High false positive rate: legitimate content is blocked unnecessarily
- Users lose trust when benign content triggers blocks
- No way to handle edge cases where human judgment is needed
- Cannot differentiate between severities (violence vs. violent joke)

### Real-World Consequences
- Legitimate medical discussions (e.g., "self-harm prevention") are blocked
- Users abandon the platform due to over-moderation
- Support tickets spike from users whose content was falsely blocked
- Inconsistent user experience: some borderline content passes, some blocks

### Preferred Alternative
Implement graduated responses: block (high confidence harmful), flag for review (medium confidence), warn with logging (low confidence), allow. Map each harm category to its appropriate action.

```php
$policy = new ModerationPolicy([
    HarmCategory::Hate => Action::Block,
    HarmCategory::Violence => Action::Flag,  // context-dependent
    HarmCategory::Profanity => Action::Warn,
]);
```

### Refactoring Strategy
1. Define action levels: Block, Flag, Warn, Allow
2. Map each harm category to an action level
3. Implement confidence thresholds for each level: high → block, medium → flag, low → warn
4. Create a review dashboard for flagged content
5. Log all actions for audit and tune thresholds based on false positive analysis

### Detection Checklist
- [ ] More than two moderation actions exist (block + flag + warn + allow)
- [ ] Actions are configurable per harm category
- [ ] Confidence thresholds map to graduated actions
- [ ] Flagged content has a review workflow

### Related Rules/Skills/Trees
- Skill: Implement Content Moderation and Safety Filtering

---

## 3. One-Size-Fits-All Policy

### Category
Inflexible Policy Architecture

### Description
Applying the same moderation rules and thresholds to all users, features, and contexts regardless of their specific requirements. Children's content receives the same moderation as adult educational content; public chat uses the same rules as private messages; different regions with different cultural norms get identical treatment.

### Why It Happens
- Simplicity: one policy is easier to define, deploy, and maintain
- Regulatory ignorance: not considering different compliance requirements per region
- Technical debt: the moderation system was designed without policy scoping
- Risk management: defaulting to the strictest policy to "be safe"

### Warning Signs
- A single `ModerationPolicy` class or config with no scoping mechanism
- No concept of policy contexts (feature, user segment, region)
- The same harm categories and thresholds apply to all endpoints
- No mechanism for per-tenant policy overrides in multi-tenant SaaS

### Why Harmful
- Over-moderation in some contexts degrades user experience
- Under-moderation in sensitive contexts (children's features) creates liability
- Cultural insensitivity: what's acceptable in one region is blocked in another
- Cannot offer differentiated moderation tiers for different user plans

### Real-World Consequences
- Educational content about human anatomy blocked while kids' chat is under-moderation
- EU users get inappropriate content because moderation follows US norms
- Enterprise customers cannot customize moderation for their specific policies
- Regulatory fines for inadequate moderation in protected contexts

### Preferred Alternative
Design a scoped policy system: features, user segments, and regions each have their own policy configuration. Policies inherit from a base (strictest) policy and relax or tighten specific categories.

### Refactoring Strategy
1. Define policy scopes: feature endpoint, user role/age, geographic region
2. Create a policy hierarchy: global → region → feature → user segment
3. Implement policy resolution logic that merges applicable policies
4. Add per-scope configuration UI or config files
5. Test each scope combination with relevant test cases

### Detection Checklist
- [ ] Moderation policies are scoped (not global)
- [ ] Different features can have different policies
- [ ] User segments map to different moderation tiers
- [ ] Regional policies exist for culturally sensitive categories

### Related Rules/Skills/Trees
- Skill: Implement Content Moderation and Safety Filtering

---

## 4. Silent Blocking Without Feedback

### Category
Poor User Experience

### Description
Blocking content or responses due to moderation filters without providing meaningful feedback to the user about why their action was blocked. The user sees a generic error message or blank response and has no way to understand what was wrong, how to fix it, or how to appeal the decision.

### Why It Happens
- Security-through-obscurity mindset: not wanting to reveal moderation logic
- Engineering shortcuts: generic error handling without moderation-specific messages
- No product design input on error states
- Fear that specific feedback helps attackers evade moderation

### Warning Signs
- Moderation blocks result in the same error as system errors
- Users cannot tell if their content was blocked or a bug occurred
- No "why was this blocked" explanation in the UI
- No appeal or review mechanism for blocked content
- Customer support receives frequent "why was my content blocked?" queries

### Why Harmful
- Users don't know what behavior to correct, so they repeat it
- Frustrated users abandon the platform rather than engaging with support
- False positives are never reported because users don't know they occurred
- Legitimate users feel punished rather than guided

### Real-World Consequences
- User churn from confusing moderation experiences
- Support team overloaded with "why was I blocked?" tickets
- Content quality suffers because users don't learn the rules
- Regulatory concerns: some jurisdictions require transparency in content moderation

### Preferred Alternative
Provide specific, actionable feedback when content is blocked. Explain which policy category was violated (without revealing detection details), and offer an appeal mechanism.

### Refactoring Strategy
1. Map each harm category and action to a user-facing message
2. Include the policy category in block responses (not the detection method)
3. Provide an appeal flow where users can request human review
4. Log appeal outcomes to tune moderation accuracy
5. A/B test message clarity to reduce support tickets

### Detection Checklist
- [ ] Blocked content returns a specific moderation message (not generic error)
- [ ] Users can appeal moderation decisions
- [ ] Appeal outcomes are tracked and used to improve moderation
- [ ] False positive analysis uses appeal data

### Related Rules/Skills/Trees
- Skill: Implement Content Moderation and Safety Filtering

---

## 5. Context-Ignorant Keyword Filtering

### Category
Detection Methodology Failure

### Description
Using simple keyword or regex filtering without context awareness, blocking words that are acceptable in one context but harmful in another. "Kill" in a video game chat, "bomb" in a chemistry lesson, or "self-harm" in a mental health resource are all blocked equally, destroying legitimate use cases while sophisticated harmful content slips through.

### Why It Happens
- Quick implementation: keyword matching is easy to implement
- False sense of security: seeing the filter catch obvious patterns
- Lack of NLP/ML resources for context-aware detection
- Compliance checkbox mentality: "we have a content filter"

### Warning Signs
- Moderation relies primarily on keyword lists
- False positive complaints cluster around specific context-dependent words
- Harmful content that uses synonyms or circumlocution passes through
- No ML classifier exists for nuanced detection
- Security testers can easily trigger false positives with benign sentences

### Why Harmful
- Legitimate content is blocked based on word presence, not meaning
- Attackers easily bypass keyword filters with synonyms, encoding, or paraphrasing
- False positives erode user trust and create support burden
- Cannot differentiate between educational discussion and actual harm

### Real-World Consequences
- Medical support forums cannot discuss self-harm prevention
- Gaming communities cannot communicate during gameplay
- Educational platforms block legitimate curriculum content
- Sophisticated harmful content passes because it doesn't use "blocked words"

### Preferred Alternative
Use a two-tier approach: fast keyword filter for obvious patterns, followed by an ML classifier for nuanced context-aware detection. The keyword filter should use a broad net, but the ML classifier makes the final context-aware decision.

### Refactoring Strategy
1. Downgrade keyword filter from blocking to pre-filtering (raises flags, doesn't block alone)
2. Implement or integrate an ML-based classifier for context-aware detection
3. Train or tune the classifier on application-specific content and edge cases
4. Add context signals to the classifier: conversation history, feature type, user intent
5. Continuously evaluate false positive and false negative rates

### Detection Checklist
- [ ] Keyword filtering is not the final moderation decision (ML classifier overrides)
- [ ] Context-aware detection exists for ambiguous terms
- [ ] False positive rates are measured and below threshold
- [ ] Application-specific edge cases are tested

### Related Rules/Skills/Trees
- Skill: Implement Content Moderation and Safety Filtering
- Decision Tree: Implementation Approach

# Skills

## Skill 1: Design effective few-shot examples and chain-of-thought prompts

### Purpose
Improve LLM output quality and accuracy on complex tasks by providing few-shot examples that match the target format and difficulty, and implementing chain-of-thought reasoning with explicit answer extraction to separate reasoning from the final response.

### When To Use
- Use for complex tasks requiring multi-step reasoning (math, logic, data extraction)
- Use when the model produces incorrect or inconsistent output formats
- Use when you need auditable reasoning traces from AI decision-making
- Use when accuracy improvement of 10-30% is needed for critical tasks
- Use with ReAct pattern agents in Laravel AI SDK

### When NOT To Use
- Do NOT use for simple, zero-shot tasks where the model already performs well
- Do NOT use when few-shot examples are misaligned with the target output format
- Do NOT use chain-of-thought without extracting the final answer from reasoning
- Do NOT use when token cost of chain-of-thought reasoning outweighs the quality benefit

### Prerequisites
- Clear understanding of the task input-output structure
- 2-5 high-quality example pairs showing expected behavior
- Understanding of ReAct pattern (Thought-Action-Observation) if using tool calling
- Awareness of token cost of chain-of-thought (reasoning tokens are billable)
- Ability to extract final answer from reasoning (separator mechanism)

### Inputs
- Task description and output format specification
- 2-5 few-shot example pairs (input -> expected output)
- Chain-of-thought instructions (optional)
- Tools available to the agent (if ReAct pattern)

### Workflow
1. Select 2-5 few-shot examples that cover edge cases, not just typical cases
2. Ensure examples match the target output structure exactly (same fields, types, nesting)
3. Include examples at the right difficulty level — too easy and model produces simplistic outputs
4. For chain-of-thought, add instruction: "Think step by step before answering"
5. Implement structured CoT for tool-calling agents (ReAct pattern):
   - "Thought: ... Action: ... Observation: ..."
6. Add explicit answer extraction mechanism:
   - "Provide your reasoning, then wrap the final answer in <answer>...</answer> tags"
   - Or output reasoning separately from the final response
7. Never present raw reasoning as the final output — extract the definitive answer
8. Test few-shot effectiveness: run with and without examples, compare quality scores
9. Monitor token cost of chain-of-thought reasoning against quality improvement

### Validation Checklist
- [ ] Few-shot examples match the target output format exactly
- [ ] Examples cover edge cases, not just typical cases
- [ ] 2-5 examples are provided (not 0, not 50+)
- [ ] Chain-of-thought reasoning is separated from the final answer
- [ ] ReAct pattern is implemented correctly if using tool calling
- [ ] Final answer is clean, definitive, and user-ready
- [ ] Token cost of CoT is measured and evaluated against quality gain
- [ ] Examples are versioned as part of prompt management
- [ ] Few-shot performance is tested with and without examples

### Common Failures
- **Mismatched examples**: Examples don't match output format — model produces wrong structure
- **Too simple examples**: Model learns to produce simplistic outputs — include complex cases
- **Raw reasoning as output**: Final response includes "I think... maybe... but..." — undermines user confidence
- **CoT without answer extraction**: Reasoning is presented as the answer — confusing to users
- **Example overload**: 10+ examples waste tokens with diminishing returns — 2-5 is optimal
- **No edge case coverage**: Model fails on boundary conditions not shown in examples

### Decision Points
- **Example selection strategy**: Random selection vs. targeted edge case coverage — always choose targeted
- **CoT level**: Brief ("think step by step") vs. structured (ReAct format with Thought-Action-Observation)
- **Answer separation**: Tags (`<answer>...</answer>`) vs. structured field (`reasoning` and `answer` fields)
- **Few-shot vs. zero-shot**: When quality without examples is >90%, skip few-shot

### Performance Considerations
- Few-shot examples consume prompt tokens — balance quality improvement with token cost
- Chain-of-thought generates 2-5x more completion tokens than direct answers
- CoT improves accuracy by 10-30% on complex tasks but increases latency and cost proportionally
- For simple tasks, CoT overhead outweighs benefit — only use where reasoning is needed
- Cache few-shot examples as part of system prompt for reuse

### Security Considerations
- Few-shot examples may leak data patterns if not carefully selected
- Chain-of-thought reasoning may expose internal decision logic to users
- Ensure examples don't contain PII or secrets
- CoT can increase vulnerability to jailbreaking (explicit reasoning gives attackers more surface)

### Related Rules
- R1: Always align few-shot examples with the expected output format and difficulty
- R2: Never use chain-of-thought reasoning without extracting the final answer from the reasoning

### Related Skills
- Design system prompts with persona and guardrails
- Design structured output schemas for agent responses
- Implement prompt versioning with version-controlled prompt files
- Implement A/B testing for prompt variants

### Success Criteria
- Few-shot examples improve output accuracy by 10-30% on the target task
- Model consistently produces outputs matching the example format
- Chain-of-thought reasoning is cleanly separated from definitive final answers
- Token cost of CoT is justified by quality improvement
- Examples cover edge cases, reducing failure rates on boundary conditions
- Few-shot examples are maintained as part of the prompt versioning system

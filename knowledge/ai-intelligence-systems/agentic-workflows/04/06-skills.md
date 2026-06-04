# Skills

## Skill 1: Implement agent planning and reasoning strategies for complex multi-step tasks

### Purpose
Configure agents with explicit reasoning strategies (ReAct, Plan-Ahead, Reflection, Tree-of-Thoughts) that decompose complex goals into structured subtasks, improving reliability by 10-30% on multi-step tasks and making agent decision-making transparent and debuggable.

### When To Use
- Use for complex, multi-step tasks requiring structured reasoning beyond ad-hoc tool picking
- Use when agent decision-making needs to be transparent and auditable
- Use when you need plan generation, execution, and dynamic replanning
- Use when the ReAct pattern (Reasoning + Acting) improves output quality
- Use when reflection and iterative improvement is needed for writing, code generation, or analysis

### When NOT To Use
- Do NOT use for simple single-step tasks where ad-hoc tool calling suffices
- Do NOT use without a defined reasoning strategy — raw tool calling degrades for complex tasks
- Do NOT use Tree-of-Thoughts for latency-sensitive applications (high cost, high latency)

### Prerequisites
- Agent classes in Laravel AI SDK with tool-calling support
- Understanding of chain-of-thought, ReAct, and Plan-Ahead patterns
- Token budget allocated for reasoning tokens (CoT tokens are billable)
- Monitoring for reasoning quality and completion rates

### Inputs
- Task description requiring multi-step reasoning
- Available tools and their capabilities
- Reasoning strategy configuration (ReAct, Plan-Ahead, Reflection)
- Success criteria for plan completion

### Workflow
1. Choose a reasoning strategy based on task complexity:
   - ReAct: interleave reasoning traces with tool calls (default for most agents)
   - Plan-Ahead: generate complete multi-step plan upfront, then execute
   - Reflection: critique own output and iteratively improve
   - Tree-of-Thoughts: explore multiple reasoning paths in parallel, select best
2. Configure the agent with the chosen strategy in the system prompt or agent config
3. For Plan-Ahead: the agent generates a plan first, then executes step-by-step
4. Implement dynamic replanning: the agent can revise its plan mid-execution when tool results contradict assumptions
5. Add chain-of-thought instructions in system prompt: "Think step by step before taking action"
6. Implement reflection for writing/code tasks: generate → critique → revise
7. Set max iterations to prevent infinite reasoning loops
8. Monitor reasoning steps, tool calls, and completion rate

### Validation Checklist
- [ ] Reasoning strategy is explicitly configured (not raw ad-hoc tool calling)
- [ ] ReAct pattern produces reasoning traces before tool calls
- [ ] Plan-Ahead generates multi-step plans and executes them
- [ ] Dynamic replanning works when tool results contradict assumptions
- [ ] Reflection produces iteratively improved output
- [ ] Max iteration limit prevents infinite loops
- [ ] Reasoning steps are logged for debugging
- [ ] Token cost of reasoning is measured and acceptable
- [ ] Completion rate improves vs. raw tool calling (measured target: 10-30%)

### Common Failures
- **No reasoning strategy**: LLM picks tools ad-hoc — degrades for multi-step tasks
- **No iteration limit**: Agent loops indefinitely on complex tasks — set max steps
- **No dynamic replanning**: Plan fails when first tool contradicts assumptions — agent can't adapt
- **Over-reasoning**: Agent spends 90% of tokens on reasoning, 10% on action — balance needed
- **Reflection without improvement**: Agent critiques output but doesn't change it — enforce revision

### Decision Points
- **Reasoning strategy**: ReAct (balanced) vs. Plan-Ahead (structured) vs. Reflection (quality) vs. ToT (maximum quality)
- **Max iterations**: 5-10 for most tasks, up to 20 for complex analysis
- **Replanning threshold**: When confidence drops below threshold or tool results contradict
- **Reasoning token budget**: 20-30% of total tokens for reasoning, rest for action

### Performance Considerations
- Chain-of-thought adds 2-5x completion tokens — budget accordingly
- Plan-Ahead adds upfront latency (plan generation before any action)
- Reflection doubles or triples LLM calls (generate → critique → revise)
- Tree-of-Thoughts is 3-10x more expensive than single-path reasoning
- Reasoning improves accuracy 10-30% but increases cost proportionally

### Security Considerations
- Reasoning traces may reveal internal decision logic — don't expose to users
- Tool call plans should respect access control — agent should not plan unauthorized actions
- Dynamic replanning should not override safety constraints
- Monitor reasoning for signs of manipulation or jailbreak attempts
- Log reasoning steps for audit but exclude sensitive data

### Related Rules
- R1: Use a Defined Reasoning Strategy — configure explicit reasoning instead of raw tool calling

### Related Skills
- Design multi-agent systems with strict tool boundaries
- Implement agent communication protocols with standardized envelopes
- Build agent orchestration frameworks with async execution
- Design few-shot examples and chain-of-thought prompts

### Success Criteria
- Agent produces transparent, debuggable reasoning traces for each action
- Complex tasks complete with 10-30% higher success rate vs. raw tool calling
- Plan-Ahead generates correct multi-step plans that execute without revision
- Dynamic replanning catches and corrects plan failures mid-execution
- Reflection produces measurably improved output quality
- Reasoning token cost is within budget and justified by quality improvement

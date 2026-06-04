# Skill: Implement Tool Calling Across Providers

## Purpose
Normalize provider-specific tool/function calling formats into a unified interface, enabling provider-agnostic agent behavior with consistent tool schemas, choices, and result handling.

## When To Use
- Any multi-provider system that uses tool calling for agentic behavior
- Applications migrating between providers needing consistent tool semantics
- Building agent architectures that are provider-agnostic

## When NOT To Use
- Single-provider applications using only that provider's native format
- Applications that don't use tool calling

## Prerequisites
- Provider abstraction interface with tool calling capability
- Tool schema translator for provider-specific formats
- Understanding of each provider's tool calling mechanics

## Inputs
- Tool definitions in provider-agnostic format (name, description, JSON schema)
- Tool choice semantics (auto, required, none)
- Provider-specific tool schema format mappings

## Workflow
1. Define tools using a provider-agnostic schema format
2. Translate to provider-specific formats in adapter/translator layers
3. Map tool choice semantics to each provider's equivalent values
4. Accumulate tool call deltas from streaming responses (don't process partial arguments)
5. Cache translated tool schemas per provider
6. Validate and limit tool result size before returning to LLM
7. Return tool calls as a uniform array of `ToolCall` objects regardless of provider format
8. Implement tool call ID tracking for correlating results to calls

## Validation Checklist
- [ ] Tool schemas defined in provider-agnostic format, translated per provider
- [ ] Tool choice semantics mapped per provider (auto, required, none)
- [ ] Streaming tool call deltas accumulated before processing
- [ ] Translated tool schemas cached per provider
- [ ] Tool results bounded (limited rows, specific columns)
- [ ] Tool calls returned as uniform `ToolCall` array

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Provider lock-in from tool schemas | Written in native format | Define in agnostic format, translate per provider |
| Wrong tool behavior on switch | Different tool choice semantics | Map per provider |
| Corrupted tool arguments in stream | Processing incomplete deltas | Accumulate deltas, parse when complete |
| Slow requests from translation | Re-translating every time | Cache translated schemas per provider |
| Context-window overflow | Unbounded tool results | Limit tool result size |
| Different tool call formats | No normalization | Return uniform `ToolCall` array |

## Decision Points
- **Schema format:** Provider-agnostic DTO (portable) vs native format (simpler single-provider)
- **Translation timing:** Runtime (flexible) vs cached (faster)
- **Tool choice mapping:** Adapter-layer (transparent) vs config-layer (explicit)
- **Streaming accumulation:** In-memory vs chunked to temporary storage

## Performance/Security Considerations
- Cache translated tool schemas to avoid per-request reprocessing
- Validate and limit tool result size before returning to LLM (context-window protection)
- Accumulate streaming tool call deltas completely before execution
- Tool definitions should not contain sensitive information (they're sent to the provider)

## Related Rules
- ku-06/05-rules.md (all rules)

## Related Skills
- Design the Provider Abstraction Layer
- Implement Provider Adapters
- Handle Provider-Specific Features
- Implement Tool Calling with Agents

## Success Criteria
- Tool schemas defined once, translated to any provider's format
- Tool choice semantics work correctly across all supported providers
- Streaming tool calls accumulate correctly without partial argument errors
- Translated schemas are cached, not re-translated per request
- Tool results are bounded to prevent context-window overflow

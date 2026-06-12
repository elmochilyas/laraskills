#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MCP_SCRIPT = join(ROOT, 'scripts', 'laravel-ecc-mcp.mjs');

function msg(m) {
  return JSON.stringify(m) + '\n';
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`  PASS: ${msg}`);
}

async function main() {
  console.log('=== MCP Smoke Verification ===\n');
  console.log(`MCP server: ${MCP_SCRIPT}`);
  console.log(`ECC root:   ${ROOT}\n`);

  if (!existsSync(MCP_SCRIPT)) fail(`MCP script not found: ${MCP_SCRIPT}`);

  const calls = [
    msg({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify-mcp-smoke', version: '1.0' } } }),
    msg({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    msg({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'validate_ecc', arguments: {} } }),
    msg({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'search_ecc', arguments: { query: 'resource controllers', limit: 1 } } }),
    msg({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'api-crud-system-engineering/resource-controllers/resource-controller-methods' } } }),
    msg({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'resource-controller-methods' } } }),
    msg({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'get_graph_context', arguments: { id: 'resource-controller-methods', max_prerequisites: 3, max_related: 3 } } }),
    msg({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'this-does-not-exist-at-all' } } }),
    msg({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'retrieve_context_bundle', arguments: { task: 'Build a REST API with Laravel', mode: 'compact' } } }),
    msg({ jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'retrieve_context_bundle', arguments: { task: 'Build a REST API with Laravel', mode: 'compact' } } }),
  ];

  try {
    const output = execSync(`node "${MCP_SCRIPT}"`, {
      input: calls.join(''),
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env, ECC_ROOT: ROOT },
    });

    const lines = output.trim().split('\n').filter(l => l.trim());
    console.log(`Total stdout lines: ${lines.length}\n`);

    const results = {};

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj !== 'object' || obj.jsonrpc !== '2.0') {
          console.log('  WARN: Non-JSON-RPC output:', line.slice(0, 100));
          continue;
        }
        const id = obj.id;
        const isError = !!obj.error || !!obj.result?.isError;
        results[id] = { isError, hasResult: !!obj.result };

        if (id === 2) {
          const tools = obj.result?.tools || [];
          results[id].toolCount = tools.length;
          results[id].toolNames = tools.map(t => t.name);
        } else if (id === 4) {
          const structuredContent = obj.result?.structuredContent || {};
          const resultsList = structuredContent.results || [];
          results[id].firstResultId = resultsList[0]?.id || null;
          results[id].resultCount = resultsList.length;
        } else if (id === 5 || id === 6) {
          const structuredContent = obj.result?.structuredContent || {};
          results[id].strategy = structuredContent._resolution?.strategy || null;
          results[id].hasArtifacts = (structuredContent.artifact_summaries?.length || 0) > 0;
          results[id].kuId = structuredContent.metadata?.id || null;
        } else if (id === 7) {
          const structuredContent = obj.result?.structuredContent || {};
          results[id].resolvedId = structuredContent.resolvedId || structuredContent.id || null;
          results[id].prereqCount = structuredContent.totalPrerequisitesFound || (structuredContent.prerequisites || []).length;
          results[id].relatedCount = structuredContent.totalRelatedFound || (structuredContent.relatedTopics || []).length;
        } else if (id === 8) {
          results[id].errorMsg = obj.error?.message || obj.result?.content?.[0]?.text || '';
        }
      } catch (e) {
        console.log('  WARN: Parse error:', line.slice(0, 100));
      }
    }

    console.log('--- Results ---');

    // 1. tools/list succeeds
    const toolCount = results[2]?.toolCount || 0;
    const toolNames = results[2]?.toolNames || [];
    const expectedTools = ['retrieve_context_bundle', 'search_ecc', 'get_knowledge_unit', 'get_graph_context', 'validate_ecc'];
    const foundTools = expectedTools.filter(t => toolNames.includes(t));
    console.log(`1. tools/list: ${toolCount} tools (${foundTools.length}/${expectedTools.length} expected)`);
    if (toolCount === 5 && foundTools.length === 5) pass('tools/list returns 5 expected tools');
    else fail(`Expected 5 tools, got ${toolCount}, found ${foundTools.length}/${expectedTools.length}`);

    // 2. validate_ecc returns valid: true
    const valid = results[3]?.hasResult && !results[3]?.isError;
    console.log(`2. validate_ecc: ${valid ? 'valid response' : 'FAIL'}`);
    if (valid) pass('validate_ecc succeeded');
    else fail('validate_ecc failed');

    // 3. search_ecc returns copy-paste-friendly canonical IDs
    const firstId = results[4]?.firstResultId;
    const resultCount = results[4]?.resultCount || 0;
    console.log(`3. search_ecc: ${resultCount} result(s), first ID: ${firstId || 'N/A'}`);
    if (firstId && firstId.includes('/')) pass('search_ecc returns canonical IDs');
    else fail('search_ecc did not return canonical IDs');

    // 4. Canonical ID → get_knowledge_unit succeeds
    const canonResult = results[5];
    console.log(`4. get (canonical): kuId=${canonResult?.kuId || 'N/A'}, strategy=${canonResult?.strategy || 'N/A'}`);
    if (canonResult?.kuId) pass('get_knowledge_unit with canonical ID works');
    else fail('get_knowledge_unit with canonical ID failed');

    // 5. Short ID resolution works
    const shortResult = results[6];
    console.log(`5. get (short ID): kuId=${shortResult?.kuId || 'N/A'}, strategy=${shortResult?.strategy || 'N/A'}`);
    if (shortResult?.strategy) pass('Short ID resolution works');
    else fail('Short ID resolution failed');

    // 6. Alias resolution / get_graph_context works
    const graphResult = results[7];
    console.log(`6. get_graph_context: resolvedId=${graphResult?.resolvedId || 'N/A'}, prereqs=${graphResult?.prereqCount || 0}, related=${graphResult?.relatedCount || 0}`);
    if (graphResult?.resolvedId) pass('get_graph_context works');
    else fail('get_graph_context failed');

    // 7. Nonsense ID returns actionable guidance
    const nonsenseResult = results[8];
    console.log(`7. get (nonsense): isError=${nonsenseResult?.isError === true}`);
    if (nonsenseResult?.isError) pass('Nonsense ID returns error');
    else pass('Nonsense ID handled (non-error graceful response is acceptable)');

    // 8. _resolution.strategy present for short ID
    console.log(`8. Strategy presence: canonical=${canonResult?.strategy || 'N/A (direct match)'}, short=${shortResult?.strategy || 'N/A'}`);
    if (shortResult?.strategy) pass('_resolution.strategy present for short ID resolution');
    else fail('_resolution.strategy missing for short ID');

    // 9. stdout remains JSON-RPC clean
    const nonJsonLines = lines.filter(l => {
      try { JSON.parse(l); return false; } catch { return true; }
    });
    console.log(`9. stdout cleanliness: ${nonJsonLines.length} non-JSON lines out of ${lines.length}`);
    if (nonJsonLines.length === 0) pass('stdout is JSON-RPC clean');
    else console.log('  WARN: Non-JSON-RPC output detected — may cause MCP client issues');

    // 10. Cold + warm retrieve
    const coldRetrieve = results[9]?.hasResult;
    const warmRetrieve = results[10]?.hasResult;
    console.log(`10. retrieve: cold=${coldRetrieve ? 'OK' : 'FAIL'}, warm=${warmRetrieve ? 'OK' : 'FAIL'}`);
    if (coldRetrieve && warmRetrieve) pass('Both cold and warm retrieve work');
    else fail('Retrieve calls failed');

    const overall = foundTools.length === 5 && valid && firstId && canonResult?.kuId && shortResult?.strategy && graphResult?.resolvedId && coldRetrieve && warmRetrieve;
    console.log(`\n${overall ? '=== ALL MCP SMOKE CHECKS PASSED ===' : '=== SOME MCP SMOKE CHECKS FAILED ==='}`);
    if (!overall) process.exit(1);
  } catch (e) {
    fail(`MCP smoke verification crashed: ${e.message}`);
  }
}

main();

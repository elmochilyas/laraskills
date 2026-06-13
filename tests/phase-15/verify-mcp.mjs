import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const MCP_SCRIPT = join(ROOT, 'scripts', 'laraskills-mcp.mjs');

function msg(m) {
  return JSON.stringify(m) + '\n';
}

const calls = [
  msg({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify', version: '1.0' } } }),
  msg({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  msg({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'search_ecc', arguments: { query: 'tenant-aware-middleware', limit: 1 } } }),
  msg({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'data-storage-systems/multi-tenancy/tenant-aware-middleware' } } }),
  msg({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'tenant-aware-middleware' } } }),
  msg({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'get_graph_context', arguments: { id: 'tenant-aware-middleware', max_prerequisites: 3, max_related: 3 } } }),
  msg({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'get_knowledge_unit', arguments: { id: 'this-does-not-exist-at-all' } } }),
  msg({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'validate_ecc', arguments: {} } }),
  msg({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'retrieve_context_bundle', arguments: { task: 'Build tenant CRUD', mode: 'compact' } } }),
  msg({ jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'retrieve_context_bundle', arguments: { task: 'Build tenant CRUD', mode: 'compact' } } }),
];

try {
  const output = execSync(`node "${MCP_SCRIPT}"`, {
    input: calls.join(''),
    encoding: 'utf-8',
    timeout: 60000,
    env: { ...process.env, LARASKILLS_ROOT: ROOT },
  });

  const lines = output.trim().split('\n').filter(l => l.trim());
  console.log('Total stdout lines:', lines.length);

  const results = {};

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (typeof obj !== 'object' || obj.jsonrpc !== '2.0') {
        console.log('NON-JSON-RPC:', line.slice(0, 100));
        continue;
      }
      const id = obj.id;
      const isError = !!obj.error || !!obj.result?.isError;
      results[id] = { isError, hasResult: !!obj.result };

      if (id === 2) {
        const tools = obj.result?.tools || [];
        results[id].toolCount = tools.length;
        results[id].toolNames = tools.map(t => t.name);
      } else if (id === 3) {
        const sc = obj.result?.structuredContent || {};
        const resultsList = sc.results || [];
        const first = resultsList[0] || {};
        results[id].firstResultId = first.id || 'N/A';
        results[id].resultCount = resultsList.length;
        results[id].query = sc.query;
      } else if (id === 4) {
        const sc = obj.result?.structuredContent || {};
        results[id].strategy = sc._resolution?.strategy || 'N/A';
        results[id].hasContent = !!sc.content || (sc.artifact_summaries?.length || 0) > 0;
        results[id].kuId = sc.metadata?.id || 'N/A';
      } else if (id === 5) {
        const sc = obj.result?.structuredContent || {};
        results[id].strategy = sc._resolution?.strategy || 'N/A';
        results[id].hasContent = !!sc.content || (sc.artifact_summaries?.length || 0) > 0;
        results[id].kuId = sc.metadata?.id || 'N/A';
      } else if (id === 6) {
        const sc = obj.result?.structuredContent || {};
        results[id].prereqCount = sc.totalPrerequisitesFound || (sc.prerequisites || []).length;
        results[id].relatedCount = sc.totalRelatedFound || (sc.relatedTopics || []).length;
        results[id].resolvedId = sc.resolvedId || sc.id;
      }
    } catch (e) {
      console.log('PARSE ERROR:', line.slice(0, 100));
    }
  }

  console.log('');
  console.log('=== MCP Verification Results ===');
  console.log('1. JSON-RPC protocol:', results[1]?.hasResult ? 'OK' : 'FAIL');

  const toolCount = results[2]?.toolCount || 0;
  console.log(`2. tools/list: ${toolCount} tools ${toolCount === 5 ? '(OK)' : '(FAIL)'}`);
  if (results[2]?.toolNames) {
    for (const name of results[2].toolNames) {
      console.log(`   - ${name}`);
    }
  }

  console.log(`3. search_ecc: found ${results[3]?.resultCount || 0} results, first: ${results[3]?.firstResultId || 'N/A'}`);
  console.log(`4. get (canonical): content=${!!results[4]?.hasContent}, strategy=${results[4]?.strategy}`);
  console.log(`5. get (short ID): content=${!!results[5]?.hasContent}, strategy=${results[5]?.strategy}`);
  console.log(`6. get_graph_context: ${results[6]?.prereqCount || 0} prereqs, ${results[6]?.relatedCount || 0} related`);
  console.log(`7. get (nonsense): isError=${results[7]?.isError === true} ${results[7]?.isError ? '(OK)' : '(needs isError)'}`);
  console.log(`8. validate_ecc: ${results[8]?.hasResult ? 'OK' : 'FAIL'}`);
  console.log(`9. retrieve #1 (cold): ${results[9]?.hasResult ? 'OK' : 'FAIL'}`);
  console.log(`10. retrieve #2 (warm): ${results[10]?.hasResult ? 'OK' : 'FAIL'}`);

  const nonsenseIsError = results[7]?.isError === true;
  const graphHasResults = (results[6]?.prereqCount || 0) > 0 || (results[6]?.relatedCount || 0) > 0;
  const allOk = results[1]?.hasResult && toolCount === 5 && results[3]?.firstResultId && results[4]?.hasContent && results[5]?.hasContent && graphHasResults && nonsenseIsError && results[8]?.hasResult;
  console.log('');
  console.log(allOk ? '=== ALL MCP CHECKS PASSED ===' : '=== SOME MCP CHECKS FAILED ===');

} catch (e) {
  console.error('MCP verification failed:', e.message);
  process.exit(1);
}

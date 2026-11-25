#!/usr/bin/env node
/*
 * Simple Code connector — lets AI coding agents (Claude Code, Codex, OpenCode, OpenClaw, Cursor, Gemini CLI,
 * VS Code, Windsurf, Claude Desktop …) use the Simple Code studio through MCP (Model Context Protocol).
 *
 *   node simplecode-mcp.js           start the connector (agents use http://127.0.0.1:7357/mcp)
 *   node simplecode-mcp.js --stdio   speak MCP over stdin/stdout (for apps that only run commands)
 *
 * The studio page (website or desktop app) connects to this connector and does the actual work, so you see
 * everything the AI does: code appears in your editor and programs run in your console.
 * No packages needed — just Node.js 18 or newer. Only listens on 127.0.0.1 (your own computer).
 */
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.SIMPLECODE_PORT || 7357);
const VERSION = '1.0.0';
const ALLOWED_ORIGINS = [/^https:\/\/simplecodecpp\.github\.io$/, /^app:\/\/simplecode$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

const TOOLS = [
  { name: 'get_code', description: 'Read the program that is open in the Simple Code editor: its language, file name and code.', inputSchema: { type: 'object', properties: {} } },
  { name: 'set_code', description: 'Replace the code in the Simple Code editor (the person sees it appear). Optionally switch language first. Use list_languages for language keys.', inputSchema: { type: 'object', properties: { code: { type: 'string', description: 'The full program' }, language: { type: 'string', description: 'Language key, e.g. "py", "cpp", "js", "simple"' }, file_name: { type: 'string' } }, required: ['code'] } },
  { name: 'run_program', description: 'Run the program in the editor and return what the console printed, including Simple Code\'s friendly error explanations. If the program asks for typed input, pass the answers in "inputs" (one string per question).', inputSchema: { type: 'object', properties: { inputs: { type: 'array', items: { type: 'string' }, description: 'Answers for each time the program asks for input' }, explain: { type: 'boolean', description: 'Turn explain mode on (true) or off (false) for this run' } } } },
  { name: 'get_output', description: 'Read what is in the console right now (the last run).', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_languages', description: 'List the 46 Simple Code languages with their keys and file extensions.', inputSchema: { type: 'object', properties: {} } },
  { name: 'set_language', description: 'Switch the editor to another language (loads that language\'s starter code).', inputSchema: { type: 'object', properties: { language: { type: 'string' } }, required: ['language'] } },
  { name: 'convert_code', description: 'Convert the program in the editor into another language with Simple Code\'s converter. Returns the converted code and notes; does not change the editor.', inputSchema: { type: 'object', properties: { to_language: { type: 'string' } }, required: ['to_language'] } },
  { name: 'get_cheat_sheet', description: 'Get the cheat sheet (rules and syntax) for the current language as plain text, so you write code the way Simple Code expects.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_challenges', description: 'List the coding challenges and which ones are solved in the current language.', inputSchema: { type: 'object', properties: {} } },
  { name: 'check_challenge', description: 'Run the editor\'s program against a challenge and say whether it passes.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
];

/* ---------------------------------------------------------------- the bridge (HTTP on 127.0.0.1) */
function startBridge({ port = PORT, log = (...a) => console.error(...a) } = {}) {
  const pending = new Map();      // command id → {resolve, timer}
  const queue = [];               // commands waiting for their page
  const waiters = [];             // pages long-polling for a command: {page, fn}
  const agents = new Map();       // agent name → last seen
  const pages = new Map();        // studio page id → {last, focus, focusAt}
  let sticky = null;              // the page the AI is working with (so one program isn't split over two tabs)

  const alive = (id) => { const p = pages.get(id); return p && Date.now() - p.last < 40000; };
  const pageConnected = () => [...pages.keys()].some(alive);
  function pickPage() {
    const live = [...pages].filter(([id]) => alive(id));
    if (!live.length) return null;
    const focused = live.filter(([, p]) => p.focus).sort((a, b) => b[1].focusAt - a[1].focusAt)[0];
    if (focused) return (sticky = focused[0]);
    if (sticky && alive(sticky)) return sticky;
    return (sticky = live.sort((a, b) => b[1].last - a[1].last)[0][0]);
  }
  const agentList = () => [...agents].filter(([, t]) => Date.now() - t < 30 * 60000).map(([n]) => n);
  const seen = (name) => { if (name) agents.set(name, Date.now()); };

  function dispatch(tool, args, agent) {
    return new Promise((resolve) => {
      if (!pageConnected() && !waiters.length) return resolve({ error: 'Simple Code isn\'t connected. Open the studio (https://simplecodecpp.github.io/app.html or the desktop app) and turn on 🔌 Connect AI.' });
      const id = crypto.randomUUID();
      const timer = setTimeout(() => { pending.delete(id); resolve({ error: 'Simple Code didn\'t answer in time (is the studio tab still open?).' }); }, 120000);
      pending.set(id, { resolve, timer });
      const target = pickPage();
      const cmd = { id, tool, args: args || {}, agent: agent || 'An AI', target };
      const wi = waiters.findIndex(w => w.page === target);
      if (wi >= 0) waiters.splice(wi, 1)[0].fn(cmd); else queue.push(cmd);
    });
  }

  async function callTool(name, args, agent) {
    if (!TOOLS.some(t => t.name === name)) return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    const r = await dispatch(name, args, agent);
    if (r.error) return { content: [{ type: 'text', text: r.error }], isError: true };
    return { content: [{ type: 'text', text: typeof r.text === 'string' ? r.text : JSON.stringify(r, null, 2) }], isError: !!r.isError };
  }

  async function handleRpc(msg, agentHint) {
    const { id, method, params = {} } = msg;
    const ok = (result) => ({ jsonrpc: '2.0', id, result });
    if (id === undefined || id === null) return null; // notification
    switch (method) {
      case 'initialize':
        seen(params.clientInfo && (params.clientInfo.title || params.clientInfo.name));
        return ok({ protocolVersion: params.protocolVersion || '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'simplecode', title: 'Simple Code', version: VERSION },
          instructions: 'Simple Code is a beginner coding studio with 46 friendly languages. The person is watching the studio: code you set appears in their editor and runs in their console. Prefer small, clear programs and explain what you did. Call get_cheat_sheet to learn the current language\'s Simple rules.' });
      case 'ping': return ok({});
      case 'tools/list': return ok({ tools: TOOLS });
      case 'tools/call': seen(agentHint); return ok(await callTool(params.name, params.arguments, agentHint));
      case 'resources/list': return ok({ resources: [] });
      case 'prompts/list': return ok({ prompts: [] });
      default: return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    }
  }

  const sessions = new Map(); // MCP session id → agent name
  const originOk = (o) => !o || ALLOWED_ORIGINS.some(r => r.test(o));
  const hostOk = (h) => /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(h || '');

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = origin && originOk(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Allow-Headers': 'content-type, mcp-session-id, mcp-protocol-version', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Expose-Headers': 'mcp-session-id', Vary: 'Origin' } : {};
    const send = (code, body, extra = {}) => { res.writeHead(code, { ...cors, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra }); res.end(body !== undefined ? JSON.stringify(body) : undefined); };
    if (!hostOk(req.headers.host) || !originOk(origin)) return send(403, { error: 'forbidden' });
    if (req.method === 'OPTIONS') return send(204);
    const url = new URL(req.url, 'http://127.0.0.1');
    const body = () => new Promise((ok, bad) => { let d = ''; req.on('data', c => { d += c; if (d.length > 5e6) req.destroy(); }); req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { bad(e); } }); });

    try {
      // ---- the studio page
      if (url.pathname === '/poll' && req.method === 'GET') {
        if (!origin) return send(403, { error: 'pages only' });
        const page = url.searchParams.get('page') || 'page';
        const prev = pages.get(page) || { focus: false, focusAt: 0 };
        const focus = url.searchParams.get('focus') === '1';
        pages.set(page, { last: Date.now(), focus, focusAt: focus && !prev.focus ? Date.now() : prev.focusAt });
        const reply = (cmd) => send(200, { cmd, agents: agentList() });
        const qi = queue.findIndex(c => !c.target || c.target === page || !alive(c.target));
        if (qi >= 0) return reply(queue.splice(qi, 1)[0]);
        let done = false;
        const entry = { page, fn: (c) => { if (done) { queue.unshift(c); return; } done = true; clearTimeout(t); reply(c); } };
        const drop = () => { const i = waiters.indexOf(entry); if (i >= 0) waiters.splice(i, 1); };
        const t = setTimeout(() => { done = true; drop(); reply(null); }, 20000);
        waiters.push(entry);
        req.on('close', () => { if (!done) { done = true; clearTimeout(t); drop(); } });
        return;
      }
      if (url.pathname === '/result' && req.method === 'POST') {
        if (!origin) return send(403, { error: 'pages only' });
        const { id, result } = await body(); const p = pending.get(id);
        if (p) { clearTimeout(p.timer); pending.delete(id); p.resolve(result || {}); }
        return send(200, { ok: true });
      }
      if (url.pathname === '/focus' && req.method === 'POST') {
        if (!origin) return send(403, { error: 'pages only' });
        const { page, focus } = await body(); const p = pages.get(page);
        if (p) { if (focus && !p.focus) p.focusAt = Date.now(); p.focus = !!focus; p.last = Date.now(); }
        return send(200, { ok: true });
      }
      if (url.pathname === '/status') return send(200, { name: 'simplecode', version: VERSION, page: pageConnected(), agents: agentList() });

      // ---- stdio connectors forward tool calls here
      if (url.pathname === '/call' && req.method === 'POST') {
        if (origin) return send(403, { error: 'agents only' });
        const { name, arguments: args, agent } = await body(); seen(agent);
        return send(200, await callTool(name, args, agent));
      }
      if (url.pathname === '/hello' && req.method === 'POST') { if (origin) return send(403, {}); const { agent } = await body(); seen(agent); return send(200, { ok: true }); }

      // ---- MCP over Streamable HTTP (JSON responses)
      if (url.pathname === '/mcp') {
        if (origin) return send(403, { error: 'agents only' });
        if (req.method === 'GET') return send(405, undefined, { Allow: 'POST, DELETE' });
        if (req.method === 'DELETE') { sessions.delete(req.headers['mcp-session-id']); return send(200, {}); }
        if (req.method !== 'POST') return send(405, undefined, { Allow: 'POST, DELETE' });
        const msg = await body(); let sid = req.headers['mcp-session-id'];
        const isInit = !Array.isArray(msg) && msg.method === 'initialize';
        if (isInit) { sid = crypto.randomUUID(); sessions.set(sid, (msg.params && msg.params.clientInfo && (msg.params.clientInfo.title || msg.params.clientInfo.name)) || 'An AI'); }
        const agent = sessions.get(sid) || 'An AI';
        const out = Array.isArray(msg) ? (await Promise.all(msg.map(m => handleRpc(m, agent)))).filter(Boolean) : await handleRpc(msg, agent);
        const extra = isInit ? { 'Mcp-Session-Id': sid } : {};
        if (out === null || (Array.isArray(out) && !out.length)) return send(202, undefined, extra);
        return send(200, out, extra);
      }
      send(404, { error: 'not found' });
    } catch (e) { send(400, { error: String(e.message || e) }); }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { log(`🔌 Simple Code connector is on: http://127.0.0.1:${port}/mcp`); resolve({ server, handleRpc, callTool }); });
  });
}

/* ---------------------------------------------------------------- MCP over stdio */
async function runStdio() {
  const log = (...a) => process.stderr.write(a.join(' ') + '\n');
  let local = null; let agent = 'An AI';
  try { local = await startBridge({ log }); } catch (e) { if (e.code !== 'EADDRINUSE') throw e; log('🔌 Using the Simple Code connector that is already running (desktop app or another agent).'); }
  const forward = async (name, args) => {
    if (local) return local.callTool(name, args, agent);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/call`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args, agent }) });
      return await r.json();
    } catch (e) { return { content: [{ type: 'text', text: 'The Simple Code connector stopped. Restart your AI app or the Simple Code desktop app.' }], isError: true }; }
  };
  const handle = async (msg) => {
    const { id, method, params = {} } = msg;
    if (id === undefined || id === null) return null;
    if (method === 'initialize') {
      agent = (params.clientInfo && (params.clientInfo.title || params.clientInfo.name)) || agent;
      if (!local) fetch(`http://127.0.0.1:${PORT}/hello`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agent }) }).catch(() => {});
    }
    if (method === 'tools/call') return { jsonrpc: '2.0', id, result: await forward(params.name, params.arguments) };
    if (local) return local.handleRpc(msg, agent);
    // no local bridge: answer the simple methods ourselves
    if (method === 'initialize') return { jsonrpc: '2.0', id, result: { protocolVersion: params.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'simplecode', title: 'Simple Code', version: VERSION } } };
    if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  };
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buf += chunk; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
      const out = Array.isArray(msg) ? (await Promise.all(msg.map(handle))).filter(Boolean) : await handle(msg);
      if (out && (!Array.isArray(out) || out.length)) process.stdout.write(JSON.stringify(out) + '\n');
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

module.exports = { startBridge, TOOLS, PORT };

if (require.main === module) {
  if (process.argv.includes('--stdio')) runStdio();
  else startBridge().then(() => {
    console.error('   Keep this window open. In Simple Code, press 🔌 Connect AI and turn it on.');
    console.error('   Then add it to your AI app, for example:  claude mcp add --transport http simplecode http://127.0.0.1:' + PORT + '/mcp');
  }).catch(e => {
    if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is busy — the Simple Code desktop app (or another connector) is already running, so you're all set.`);
    else console.error(e); process.exit(1);
  });
}

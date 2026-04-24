/**
 * Codex Router — 主代理服务器
 * 接收 Codex CLI 的 Responses API 请求，转换为 Chat Completions API 转发给上游，再将响应转回 Responses 格式
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { config } from './config.js';
import { log } from './logger.js';
import { convertRequest } from './request-converter.js';
import { convertResponse } from './response-converter.js';
import { createStreamConverter } from './stream-converter.js';

// ─── 工具函数 ───

/**
 * 从请求中提取 API Key
 * 优先级：Authorization header → 环境变量
 */
function extractApiKey(req) {
  const auth = req.headers['authorization'];
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1];
  }
  return config.apiKey;
}

/**
 * 安全地解析 JSON 请求体
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw.trim()) {
        reject(new Error('Empty request body'));
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error(`Invalid JSON: ${e.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 向上游 API 发送请求
 * 返回 { response, bodyStream } 用于流式处理
 */
function forwardRequest(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const upstreamUrl = new URL(path, config.upstreamBaseUrl);
    const transport = upstreamUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
      path: upstreamUrl.pathname + upstreamUrl.search,
      method,
      headers: {
        ...headers,
        host: upstreamUrl.host,
      },
    };

    const upstreamReq = transport.request(options, (upstreamRes) => {
      resolve(upstreamRes);
    });

    upstreamReq.on('error', (e) => {
      reject(new Error(`Upstream request failed: ${e.message}`));
    });

    if (body) {
      upstreamReq.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    upstreamReq.end();
  });
}

/**
 * 发送 JSON 响应
 */
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

/**
 * 发送错误响应
 */
function sendError(res, statusCode, message) {
  log.error(`Error ${statusCode}: ${message}`);
  sendJson(res, statusCode, {
    error: {
      message,
      type: 'proxy_error',
      code: statusCode,
    },
  });
}

// ─── 路由处理 ───

/**
 * POST /v1/responses — 核心：Responses API 代理
 */
async function handleResponses(req, res) {
  let requestBody;
  try {
    requestBody = await parseBody(req);
  } catch (e) {
    sendError(res, 400, e.message);
    return;
  }

  const originalModel = requestBody.model || config.defaultModel;
  const isStream = requestBody.stream ?? false;
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    sendError(res, 401, 'No API key provided. Set API_KEY env var or pass Authorization header.');
    return;
  }

  log.info(`Request: model=${originalModel}, stream=${isStream}, input_items=${Array.isArray(requestBody.input) ? requestBody.input.length : 1}, reasoning=${!!requestBody.reasoning}, text.format=${requestBody.text?.format?.type || 'none'}`);

  // 转换请求
  let chatBody;
  try {
    chatBody = convertRequest(requestBody);
  } catch (e) {
    log.error('Request conversion failed:', e);
    sendError(res, 500, `Request conversion error: ${e.message}`);
    return;
  }

  log.info(`Forwarding to upstream: model=${chatBody.model}, messages=${chatBody.messages?.length}, stream=${chatBody.stream}`);

  // 发送到上游
  const upstreamHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  let upstreamRes;
  try {
    upstreamRes = await forwardRequest('/chat/completions', 'POST', upstreamHeaders, chatBody);
  } catch (e) {
    sendError(res, 502, `Upstream connection failed: ${e.message}`);
    return;
  }

  // 检查上游响应状态
  if (upstreamRes.statusCode !== 200) {
    let errorBody = '';
    for await (const chunk of upstreamRes) {
      errorBody += chunk.toString();
    }
    log.error(`Upstream error ${upstreamRes.statusCode}: ${errorBody.slice(0, 500)}`);

    if (isStream) {
      // 流式请求的上游错误：必须以 SSE 格式返回
      // 否则 Codex CLI 收到纯 JSON 会认为流断开
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // 构造一个带错误的 response
      const respId = `resp_${Date.now().toString(36)}`;
      const errorResp = {
        id: respId,
        object: 'response',
        created_at: Math.floor(Date.now() / 1000),
        status: 'failed',
        model: originalModel,
        output: [],
        error: {
          message: `Upstream error ${upstreamRes.statusCode}: ${errorBody.slice(0, 200)}`,
          type: 'upstream_error',
          code: upstreamRes.statusCode,
        },
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      };

      res.write(`event: response.created\ndata: ${JSON.stringify(errorResp)}\n\n`);
      res.write(`event: response.completed\ndata: ${JSON.stringify(errorResp)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // 非流式：透传上游错误
      res.writeHead(upstreamRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(errorBody);
    }
    return;
  }

  if (isStream) {
    // ─── 流式响应处理 ───
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });

    const converter = createStreamConverter(originalModel);
    let buffer = '';
    let streamEnded = false; // 防止双重 res.end()

    function endStream(source = 'unknown') {
      if (streamEnded) {
        log.warn(`endStream called again from ${source}, ignoring`);
        return;
      }
      streamEnded = true;
      log.info(`endStream called from: ${source}`);

      // finalize() 已经在 finish_reason 出现时被调用了
      // 这里只需要发送 [DONE] 并关闭连接

      try {
        res.write('data: [DONE]\n\n');
        log.info('Stream: [DONE] written, waiting for client to close connection');

        // 关键：不主动关闭连接！
        // OpenAI Node.js SDK 在收到 [DONE] 后会自己关闭连接
        // 如果服务器先关闭 → SDK 认为流异常中断 → "stream disconnected"
        // 设置一个安全超时，防止连接永远挂起
        setTimeout(() => {
          try {
            log.warn('Stream: client did not close connection after 1000ms, force closing');
            res.end();
          } catch (e) {
            log.error('Error in force close:', e);
          }
        }, 1000);
      } catch (e) {
        log.error('Error writing [DONE]:', e);
      }
    }

    // 追踪是否已经发送了 response.completed
    let responseCompletedSent = false;

    upstreamRes.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留不完整的行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          // 流结束 — 如果还没发送 response.completed，现在发送
          if (!responseCompletedSent) {
            log.info('[DONE] received but response.completed not sent yet, finalizing now');
            try {
              const finalEvents = converter.finalize();
              if (finalEvents) {
                res.write(finalEvents);
                log.info(`Stream: finalize events sent (${finalEvents.length} bytes)`);
              }
              responseCompletedSent = true;
            } catch (e) {
              log.error('Finalize error on [DONE]:', e);
            }
          }
          endStream('data:[DONE]');
          return;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const chunk = JSON.parse(jsonStr);
            const events = converter.processChunk(chunk);
            if (events) res.write(events);

            // 关键：如果 chunk 有 finish_reason，说明这是最后一个有数据的 chunk
            // 必须立即 finalize() 发送 response.completed
            // 不能等到收到 [DONE] 才发送
            if (chunk.choices?.[0]?.finish_reason && !responseCompletedSent) {
              log.info(`Stream: finish_reason=${chunk.choices[0].finish_reason} detected, sending response.completed now`);
              try {
                const finalEvents = converter.finalize();
                if (finalEvents) {
                  res.write(finalEvents);
                  log.info(`Stream: finalize events sent (${finalEvents.length} bytes)`);
                }
                responseCompletedSent = true;
              } catch (e) {
                log.error('Finalize error after finish_reason:', e);
              }
            }
          } catch (e) {
            log.debug('Failed to parse SSE chunk:', jsonStr.slice(0, 100));
          }
        }
      }
    });

    upstreamRes.on('end', () => {
      log.info('Upstream stream ended');
      // 处理 buffer 中剩余数据
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const chunk = JSON.parse(trimmed.slice(6));
            const events = converter.processChunk(chunk);
            if (events) res.write(events);

            // 如果 chunk 有 finish_reason，立即 finalize
            if (chunk.choices?.[0]?.finish_reason && !responseCompletedSent) {
              log.info('Stream: finish_reason detected in end handler, sending response.completed now');
              try {
                const finalEvents = converter.finalize();
                if (finalEvents) {
                  res.write(finalEvents);
                  log.info(`Stream: finalize events sent (${finalEvents.length} bytes)`);
                }
                responseCompletedSent = true;
              } catch (e) {
                log.error('Finalize error in end handler:', e);
              }
            }
          } catch (e) { /* ignore */ }
        }
      }

      // 如果还没发送 response.completed（罕见情况），现在发送
      if (!responseCompletedSent) {
        log.warn('Stream: response.completed not sent before end, finalizing now');
        try {
          const finalEvents = converter.finalize();
          if (finalEvents) res.write(finalEvents);
        } catch (e) {
          log.error('Finalize error on end:', e);
        }
      }

      endStream('upstream.end');
    });

    upstreamRes.on('error', (e) => {
      log.error('Upstream stream error:', e);
      endStream('upstream.error');
    });

    // 客户端断开时清理
    req.on('close', () => {
      if (!streamEnded) {
        log.info('Client disconnected prematurely');
        streamEnded = true;
      }
    });

  } else {
    // ─── 非流式响应处理 ───
    let body = '';
    for await (const chunk of upstreamRes) {
      body += chunk.toString();
    }

    try {
      const chatResponse = JSON.parse(body);
      const responsesResult = convertResponse(chatResponse, originalModel);
      sendJson(res, 200, responsesResult);
      log.info(`Response sent: ${responsesResult.output?.length || 0} output items, ${responsesResult.usage?.total_tokens || 0} tokens`);
    } catch (e) {
      log.error('Response conversion failed:', e, 'Raw body:', body.slice(0, 300));
      sendError(res, 502, `Response conversion error: ${e.message}`);
    }
  }
}

/**
 * GET /v1/models — 代理模型列表
 */
async function handleModels(req, res) {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    sendError(res, 401, 'No API key provided');
    return;
  }

  try {
    const upstreamRes = await forwardRequest('/models', 'GET', {
      'Authorization': `Bearer ${apiKey}`,
    }, null);

    let body = '';
    for await (const chunk of upstreamRes) {
      body += chunk.toString();
    }

    res.writeHead(upstreamRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
  } catch (e) {
    sendError(res, 502, `Failed to fetch models: ${e.message}`);
  }
}

/**
 * GET /health — 健康检查
 */
function handleHealth(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    upstream: config.upstreamBaseUrl,
    model: config.defaultModel,
    timestamp: new Date().toISOString(),
  });
}

// ─── 服务器主入口 ───

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // CORS 预检
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // 去掉 query string 做路由匹配
  const path = url.split('?')[0];

  log.info(`${method} ${url}`);

  try {
    // 路由匹配（同时支持 /v1/xxx 和 /xxx 两种路径，兼容不同的 api_base_url 配置）
    if (method === 'POST' && (path === '/v1/responses' || path === '/responses')) {
      await handleResponses(req, res);
    } else if (method === 'POST' && (path === '/v1/chat/completions' || path === '/chat/completions')) {
      // 透传 Chat Completions 请求（直接转发，不转换）
      await handlePassthrough(req, res);
    } else if (method === 'GET' && (path === '/v1/models' || path === '/models')) {
      await handleModels(req, res);
    } else if (method === 'GET' && path === '/health') {
      handleHealth(req, res);
    } else {
      sendError(res, 404, `Not found: ${method} ${url}`);
    }
  } catch (e) {
    log.error('Unhandled error:', e);
    sendError(res, 500, `Internal server error: ${e.message}`);
  }
});

/**
 * 透传 Chat Completions 请求（不转换，直接转发）
 */
async function handlePassthrough(req, res) {
  const apiKey = extractApiKey(req);
  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    sendError(res, 400, e.message);
    return;
  }

  const isStream = body.stream ?? false;

  try {
    const upstreamRes = await forwardRequest('/chat/completions', 'POST', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }, body);

    if (isStream) {
      res.writeHead(upstreamRes.statusCode, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      upstreamRes.pipe(res);
    } else {
      let responseBody = '';
      for await (const chunk of upstreamRes) {
        responseBody += chunk.toString();
      }
      res.writeHead(upstreamRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(responseBody);
    }
  } catch (e) {
    sendError(res, 502, `Upstream error: ${e.message}`);
  }
}

// 启动服务器
server.listen(config.port, '127.0.0.1', () => {
  log.info(`
╔══════════════════════════════════════════════════════╗
║          Codex Router — Responses API Proxy          ║
╠══════════════════════════════════════════════════════╣
║  Listening:     http://127.0.0.1:${config.port}               ║
║  Upstream:      ${config.upstreamBaseUrl}     ║
║  Default Model: ${config.defaultModel}         ║
╠══════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║    POST /v1/responses       → Responses API proxy    ║
║    POST /v1/chat/completions → Direct passthrough    ║
║    GET  /v1/models          → Model list proxy       ║
║    GET  /health             → Health check           ║
╚══════════════════════════════════════════════════════╝
  `);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    log.error(`Port ${config.port} is already in use. Set PORT env var to use a different port.`);
  } else {
    log.error('Server error:', e);
  }
  process.exit(1);
});

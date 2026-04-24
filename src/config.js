/**
 * Codex Router — 配置管理
 * 从 .env 文件和环境变量加载所有配置项
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── 加载 .env 文件 ───
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (process.env[key] === undefined) {
        process.env[key] = value.trim().replace(/^["']|["']$/g, '');
      }
    }
  }
} catch (e) {
  if (e.code !== 'ENOENT') console.warn('Warning: Failed to load .env:', e.message);
}

export const config = {
  /** 上游 API Base URL */
  upstreamBaseUrl: process.env.UPSTREAM_BASE_URL || 'https://api.deepseek.com/v1',

  /** 转发给上游的 API Key（可被请求头覆盖） */
  apiKey: process.env.API_KEY || process.env.DEEPSEEK_API_KEY || '',

  /** 服务监听端口 */
  port: parseInt(process.env.PORT || '4446', 10),

  /** 默认模型名称 */
  defaultModel: process.env.DEFAULT_MODEL || 'deepseek-v4-flash',

  /** 模型名称映射 */
  modelMap: parseModelMap(process.env.MODEL_MAP || ''),

  /** 日志级别: debug | info | warn | error */
  logLevel: process.env.LOG_LEVEL || 'info',
};

function parseModelMap(json) {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * 将 Codex 请求中的模型名映射到后端实际模型名
 */
export function resolveModel(model) {
  if (!model) return config.defaultModel;
  return config.modelMap[model] || model;
}

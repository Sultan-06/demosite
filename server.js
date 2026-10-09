import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
async function loadEnvFile() {
  try {
    const contents = await readFile(resolve(root, '.env'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await loadEnvFile();

const apiBase = 'https://api.watchmode.com/v1';
function integerSetting(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

const port = integerSetting('PORT', 4173, 1, 65535);
const apiKey = process.env.WATCHMODE_API_KEY?.trim();
const cacheTtl = integerSetting('WATCHMODE_CACHE_TTL_MS', 30 * 60 * 1000, 0, 24 * 60 * 60 * 1000);
const minRequestInterval = integerSetting('WATCHMODE_MIN_REQUEST_INTERVAL_MS', 1000, 100, 60_000);
const maxSyncPages = integerSetting('WATCHMODE_SYNC_MAX_PAGES', 4, 1, 20);
const syncRegions = process.env.WATCHMODE_SYNC_REGIONS || 'US';
if (!/^[A-Z]{2}(?:,[A-Z]{2})*$/.test(syncRegions)) {
  throw new Error('WATCHMODE_SYNC_REGIONS must be a comma-separated list of uppercase two-letter country codes.');
}
const cache = new Map();
const syncPath = resolve(root, 'data', 'watchmode-sync.json');
const clientRequestLog = new Map();
let requestQueue = Promise.resolve();
let lastRequestAt = 0;
let upstreamBlockedUntil = 0;
let syncState = { lastSyncedAt: null, episodeChanges: [], sourceChanges: [], status: 'not-synced' };

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(value));
}

function enqueueRequest(task) {
  const run = requestQueue.then(async () => {
    const wait = Math.max(
      0,
      minRequestInterval - (Date.now() - lastRequestAt),
      upstreamBlockedUntil - Date.now()
    );
    if (wait) await new Promise(resolveDelay => setTimeout(resolveDelay, wait));
    lastRequestAt = Date.now();
    return task();
  });
  requestQueue = run.catch(() => {});
  return run;
}

async function watchmode(path, params = {}, { bypassCache = false } = {}) {
  if (!apiKey) {
    const error = new Error('Watchmode is not configured. Set WATCHMODE_API_KEY in your local .env file.');
    error.status = 503;
    throw error;
  }

  const url = new URL(`${apiBase}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const cacheKey = url.pathname + url.search;
  const cached = cache.get(cacheKey);
  if (!bypassCache && cached && cached.expiresAt > Date.now()) return cached.data;

  const data = await enqueueRequest(async () => {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set('apiKey', apiKey);
    const upstream = await fetch(requestUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000)
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const error = new Error(body?.statusMessage || body?.message || `Watchmode returned HTTP ${upstream.status}.`);
      error.status = upstream.status;
      error.retryAfter = upstream.headers.get('retry-after');
      if (upstream.status === 429) {
        const retryAfterSeconds = error.retryAfter ? Number(error.retryAfter) : Number.NaN;
        const retryAfterDate = Date.parse(error.retryAfter || '');
        const delay = Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds * 1000
          : Number.isFinite(retryAfterDate) ? retryAfterDate - Date.now() : 60_000;
        upstreamBlockedUntil = Date.now() + Math.max(1000, delay);
      }
      throw error;
    }
    return body;
  });

  if (!bypassCache && cacheTtl > 0) cache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtl });
  return data;
}

function positiveInteger(value, fallback, max) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function queryParams(url, allowed) {
  const params = {};
  for (const key of allowed) {
    const value = url.searchParams.get(key);
    if (value) params[key] = value;
  }
  return params;
}

async function loadSyncState() {
  try {
    syncState = JSON.parse(await readFile(syncPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function saveSyncState() {
  await mkdir(resolve(root, 'data'), { recursive: true });
  await writeFile(syncPath, JSON.stringify(syncState, null, 2), 'utf8');
}

function dateNumber(date) {
  return Number(date.toISOString().slice(0, 10).replaceAll('-', ''));
}

async function fetchChangeFeed(endpoint, startDate, endDate) {
  const changedIds = new Set();
  for (let page = 1; page <= maxSyncPages; page += 1) {
    const result = await watchmode(`/changes/${endpoint}/`, {
      start_date: startDate,
      end_date: endDate,
      regions: endpoint === 'titles_sources_changed' ? syncRegions : undefined,
      page,
      limit: 250
    }, { bypassCache: true });
    const ids = Array.isArray(result.titles) ? result.titles : [];
    ids.forEach(id => {
      const titleId = Number(id);
      if (Number.isInteger(titleId) && titleId > 0) changedIds.add(titleId);
    });
    if (!result.total_pages || page >= Number(result.total_pages)) break;
  }
  return [...changedIds];
}

async function runDailySync() {
  const end = new Date();
  const prior = syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt) : new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const startDate = dateNumber(prior);
  const endDate = dateNumber(end);
  try {
    syncState.status = 'running';
    syncState.lastAttemptAt = end.toISOString();
    delete syncState.error;
    await saveSyncState();
    const [newTitles, detailChanges, episodeChanges, sourceChanges] = await Promise.all([
      fetchChangeFeed('new_titles', startDate, endDate),
      fetchChangeFeed('titles_details_changed', startDate, endDate),
      fetchChangeFeed('titles_episodes_changed', startDate, endDate),
      fetchChangeFeed('titles_sources_changed', startDate, endDate)
    ]);
    const changed = new Set([...newTitles, ...detailChanges, ...episodeChanges, ...sourceChanges]);
    for (const key of cache.keys()) {
      const titleId = key.match(/^\/title\/(\d+)\//)?.[1];
      if (titleId && changed.has(Number(titleId))) cache.delete(key);
    }
    syncState = {
      lastSyncedAt: end.toISOString(),
      newTitles,
      detailChanges,
      episodeChanges,
      sourceChanges,
      status: 'complete'
    };
    await saveSyncState();
    console.info(`Watchmode daily sync completed: ${newTitles.length} new titles, ${detailChanges.length} metadata changes, ${episodeChanges.length} episode changes, ${sourceChanges.length} source changes.`);
  } catch (error) {
    syncState.status = 'error';
    syncState.error = error.message;
    await saveSyncState();
    console.error(`Watchmode daily sync failed: ${error.message}`);
  }
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

async function serveStatic(pathname, response) {
  const relativePath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = resolve(root, `.${relativePath}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    json(response, 403, { error: 'Forbidden path.' });
    return;
  }
  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      json(response, 404, { error: 'File not found.' });
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      json(response, 404, { error: 'File not found.' });
      return;
    }
    throw error;
  }
}

function allowApiRequest(request, response) {
  const now = Date.now();
  const client = request.socket.remoteAddress || 'unknown';
  const previous = clientRequestLog.get(client) || { startedAt: now, count: 0 };
  if (now - previous.startedAt >= 60_000) {
    previous.startedAt = now;
    previous.count = 0;
  }
  previous.count += 1;
  clientRequestLog.set(client, previous);
  if (clientRequestLog.size > 1000) {
    for (const [address, entry] of clientRequestLog) {
      if (now - entry.startedAt >= 60_000) clientRequestLog.delete(address);
    }
  }
  if (previous.count <= 120) return true;
  response.setHeader('Retry-After', '60');
  json(response, 429, { error: 'Too many requests. Please wait a minute before trying again.' });
  return false;
}

async function handleApi(requestUrl, response) {
  const path = requestUrl.pathname;
  const query = requestUrl.searchParams;
  try {
    if (path === '/api/search') {
      const field = query.get('search_field') || 'name';
      const allowedFields = ['name', 'imdb_id', 'tmdb_movie_id', 'tmdb_tv_id', 'tvdb_id'];
      const value = query.get('search_value')?.trim();
      if (!allowedFields.includes(field) || !value || value.length > 100) {
        json(response, 400, { error: 'Provide a search value (up to 100 characters) and a supported search field.' });
        return;
      }
      const result = await watchmode('/search/', {
        search_field: field,
        search_value: value,
        types: query.get('types') || undefined
      });
      json(response, 200, result);
      return;
    }

    if (path === '/api/discover') {
      const result = await watchmode('/list-titles/', {
        ...queryParams(requestUrl, ['types', 'source_ids', 'genres', 'network_ids', 'regions']),
        page: positiveInteger(query.get('page'), 1, 1000),
        limit: positiveInteger(query.get('limit'), 50, 250)
      });
      json(response, 200, result);
      return;
    }

    if (path === '/api/autocomplete') {
      const value = query.get('search_value')?.trim();
      if (!value || value.length < 2 || value.length > 100) {
        json(response, 400, { error: 'Enter between 2 and 100 characters to get suggestions.' });
        return;
      }
      json(response, 200, await watchmode('/autocomplete-search/', {
        search_value: value,
        search_type: positiveInteger(query.get('search_type'), 2, 5)
      }));
      return;
    }

    const referencePaths = {
      '/api/genres': '/genres/',
      '/api/networks': '/networks/',
      '/api/regions': '/regions/',
      '/api/sources': '/sources/'
    };
    if (referencePaths[path]) {
      json(response, 200, await watchmode(referencePaths[path], queryParams(requestUrl, ['regions'])));
      return;
    }

    if (path === '/api/title-release-dates') {
      const titleId = query.get('title_id');
      if (!titleId || !/^\d+$/.test(titleId)) {
        json(response, 400, { error: 'A numeric title_id is required.' });
        return;
      }
      json(response, 200, await watchmode('/title-release-dates/', {
        title_id: titleId,
        ...queryParams(requestUrl, ['regions', 'start_date', 'end_date'])
      }));
      return;
    }

    if (path === '/api/account/status') {
      json(response, 200, await watchmode('/status/'));
      return;
    }

    if (path.startsWith('/api/changes/')) {
      const feed = path.slice('/api/changes/'.length);
      const feeds = ['new_titles', 'new_people', 'titles_sources_changed', 'titles_details_changed', 'titles_episodes_changed'];
      if (!feeds.includes(feed)) {
        json(response, 404, { error: 'Unknown changes feed.' });
        return;
      }
      json(response, 200, await watchmode(`/changes/${feed}/`, {
        ...queryParams(requestUrl, ['start_date', 'end_date', 'types', 'regions']),
        page: positiveInteger(query.get('page'), 1, 1000),
        limit: positiveInteger(query.get('limit'), 250, 250)
      }));
      return;
    }

    const personMatch = path.match(/^\/api\/person\/(\d+)$/);
    if (personMatch) {
      json(response, 200, await watchmode(`/person/${personMatch[1]}/`));
      return;
    }

    const titleMatch = path.match(/^\/api\/title\/(\d+)\/(details|sources|cast-crew|episodes|seasons)$/);
    if (titleMatch) {
      const [, id, section] = titleMatch;
      const upstreamPath = `/title/${id}/${section}/`;
      const allowed = section === 'sources' || section === 'episodes' ? ['regions'] : ['append_to_response'];
      json(response, 200, await watchmode(upstreamPath, queryParams(requestUrl, allowed)));
      return;
    }

    if (path === '/api/releases') {
      json(response, 200, await watchmode('/releases/', {
        ...queryParams(requestUrl, ['source_id', 'types', 'start_date', 'end_date']),
        limit: positiveInteger(query.get('limit'), 250, 250)
      }));
      return;
    }

    if (path === '/api/sync/status') {
      json(response, 200, syncState);
      return;
    }

    json(response, 404, { error: 'Unknown API endpoint.' });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    if (status === 429 && error.retryAfter) response.setHeader('Retry-After', error.retryAfter);
    json(response, status, { error: error.message });
  }
}

await loadSyncState();

if (process.argv.includes('--sync-once')) {
  await runDailySync();
  process.exitCode = syncState.status === 'complete' ? 0 : 1;
} else {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method !== 'GET') {
      json(response, 405, { error: 'Only GET requests are supported.' });
      return;
    }
    if (requestUrl.pathname.startsWith('/api/')) {
      if (!allowApiRequest(request, response)) return;
      await handleApi(requestUrl, response);
      return;
    }
    try {
      await serveStatic(requestUrl.pathname, response);
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      json(response, 500, { error: 'The server could not complete this request.' });
    }
  });
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.info(`Frame is listening on http://${host}:${port}`));

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const scheduleDailySync = () => {
    setTimeout(async () => {
      await runDailySync();
      scheduleDailySync();
    }, millisecondsPerDay).unref();
  };
  if (apiKey) {
    const priorAttempt = syncState.lastAttemptAt || syncState.lastSyncedAt;
    const delay = priorAttempt
      ? Math.max(0, millisecondsPerDay - (Date.now() - new Date(priorAttempt).getTime()))
      : 0;
    setTimeout(async () => {
      await runDailySync();
      scheduleDailySync();
    }, delay).unref();
  }
}

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

export const LOCAL_PLANNER_API = '/__paper-roadmap/data';
const DATA_DIR = 'data';
const DATA_FILE = 'planner-data.json';

const readRequestBody = (request: IncomingMessage) => new Promise<string>((resolve, reject) => {
  let body = '';
  request.setEncoding('utf8');
  request.on('data', chunk => { body += chunk; });
  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const send = (response: ServerResponse, statusCode: number, body = '') => {
  response.statusCode = statusCode;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(body);
};

/**
 * Development-only persistence for Paper Roadmap.
 *
 * The browser talks to this tiny Vite middleware endpoint while `npm run dev`
 * is running. Writes use temp-file + rename so a half-written JSON document is
 * never left behind if the process is interrupted mid-save.
 */
export function localPlannerPersistence(): Plugin {
  return {
    name: 'paper-roadmap-local-persistence',
    apply: 'serve',
    configureServer(server) {
      const dataDirectory = path.resolve(server.config.root, DATA_DIR);
      const dataPath = path.join(dataDirectory, DATA_FILE);

      server.middlewares.use(LOCAL_PLANNER_API, async (request, response) => {
        try {
          if (request.method === 'GET') {
            try {
              const contents = await readFile(dataPath, 'utf8');
              send(response, 200, contents);
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                send(response, 404, JSON.stringify({ error: 'No local planner file yet.' }));
                return;
              }
              throw error;
            }
            return;
          }

          if (request.method === 'PUT') {
            const body = await readRequestBody(request);
            JSON.parse(body); // Reject incomplete / malformed writes before touching disk.
            await mkdir(dataDirectory, { recursive: true });
            const tempPath = path.join(dataDirectory, `.planner-data.${process.pid}.${Date.now()}.tmp`);
            await writeFile(tempPath, `${body.trimEnd()}\n`, 'utf8');
            await rename(tempPath, dataPath);
            send(response, 200, JSON.stringify({ ok: true }));
            return;
          }

          response.setHeader('Allow', 'GET, PUT');
          send(response, 405, JSON.stringify({ error: 'Method not allowed.' }));
        } catch (error) {
          console.error('[paper-roadmap] Could not persist local planner data:', error);
          send(response, 500, JSON.stringify({ error: 'Could not persist planner data.' }));
        }
      });
    },
  };
}

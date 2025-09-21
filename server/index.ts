import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const DEFAULT_PORT = 6200;
const PORT = Number(process.env.PORT ?? DEFAULT_PORT);

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

type LightsClient = {
  charliesRoomLights: (value: boolean | number) => void;
  allLights: (value: boolean) => void;
};

type LightsFactoryModule = LightsClient | { default?: () => LightsClient } | (() => LightsClient);

const lights: { client: LightsClient | null } = { client: null };

const loadLightsClient = (): LightsClient => {
  if (lights.client) {
    return lights.client;
  }

  const candidate = require('../index.js') as LightsFactoryModule;
  const factory =
    typeof candidate === 'function'
      ? candidate
      : typeof candidate === 'object' && candidate !== null && typeof candidate.default === 'function'
        ? candidate.default
        : null;

  if (!factory) {
    throw new Error('Unable to resolve lights controller factory from parent project.');
  }

  lights.client = factory();
  return lights.client;
};

const todos = new Map<number, Todo>();
let nextTodoId = 1;

const json = (data: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });

const notFound = (): Response =>
  json(
    {
      error: 'Not Found',
      message: 'The requested resource does not exist.',
    },
    { status: 404 },
  );

const normalizeBooleanState = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'on') {
      return true;
    }
    if (normalized === 'off') {
      return false;
    }
  }
  return null;
};

const server = Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (pathname === '/') {
      return json({
        status: 'ok',
        message: 'Welcome to the Bun API server. Core routes: /api/health, /api/todos, /api/lights/room, /api/lights/apartment.',
      });
    }

    if (pathname === '/api/health') {
      return json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/api/time') {
      return json({ now: new Date().toISOString() });
    }

    if (pathname === '/api/todos') {
      if (method === 'GET') {
        return json({ todos: Array.from(todos.values()) });
      }

      if (method === 'POST') {
        const body = (await request.json().catch(() => null)) as { title?: string } | null;
        if (!body?.title) {
          return json({ error: 'Title is required' }, { status: 400 });
        }

        const todo: Todo = {
          id: nextTodoId++,
          title: body.title.trim(),
          completed: false,
        };
        todos.set(todo.id, todo);
        return json(todo, { status: 201 });
      }

      return json(
        { error: 'Method Not Allowed', allowedMethods: ['GET', 'POST'] },
        { status: 405 },
      );
    }

    if (pathname.startsWith('/api/todos/')) {
      const idSegment = pathname.replace('/api/todos/', '');
      const id = Number(idSegment);
      if (!Number.isFinite(id)) {
        return json({ error: 'Invalid todo id' }, { status: 400 });
      }

      const existing = todos.get(id);
      if (!existing) {
        return notFound();
      }

      if (method === 'GET') {
        return json(existing);
      }

      if (method === 'PATCH') {
        const body = (await request.json().catch(() => null)) as Partial<Todo> | null;
        if (!body) {
          return json({ error: 'Body is required' }, { status: 400 });
        }

        const updated: Todo = {
          ...existing,
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.completed !== undefined ? { completed: body.completed } : {}),
        };
        todos.set(id, updated);
        return json(updated);
      }

      if (method === 'DELETE') {
        todos.delete(id);
        return new Response(null, { status: 204 });
      }

      return json(
        { error: 'Method Not Allowed', allowedMethods: ['GET', 'PATCH', 'DELETE'] },
        { status: 405 },
      );
    }

    if (pathname === '/api/lights/room') {
      if (method !== 'POST') {
        return json({ error: 'Method Not Allowed', allowedMethods: ['POST'] }, { status: 405 });
      }

      const body = (await request.json().catch(() => null)) as {
        state?: string | boolean;
        level?: number;
      } | null;

      if (!body) {
        return json({ error: 'JSON body required' }, { status: 400 });
      }

      try {
        const client = loadLightsClient();

        if (typeof body.level === 'number') {
          if (Number.isNaN(body.level) || body.level < 0 || body.level > 100) {
            return json({ error: 'level must be between 0 and 100' }, { status: 400 });
          }
          client.charliesRoomLights(body.level);
          return json({ status: 'ok', target: 'room', level: body.level });
        }

        const nextState = normalizeBooleanState(body.state);
        if (nextState === null) {
          return json({ error: "state must be 'on' or 'off'" }, { status: 400 });
        }

        client.charliesRoomLights(nextState);
        return json({ status: 'ok', target: 'room', state: nextState ? 'on' : 'off' });
      } catch (error) {
        console.error('Failed to toggle room lights', error);
        return json({ error: 'Failed to toggle room lights' }, { status: 500 });
      }
    }

    if (pathname === '/api/lights/apartment') {
      if (method !== 'POST') {
        return json({ error: 'Method Not Allowed', allowedMethods: ['POST'] }, { status: 405 });
      }

      const body = (await request.json().catch(() => null)) as {
        state?: string | boolean;
      } | null;

      if (!body) {
        return json({ error: 'JSON body required' }, { status: 400 });
      }

      const nextState = normalizeBooleanState(body.state);
      if (nextState === null) {
        return json({ error: "state must be 'on' or 'off'" }, { status: 400 });
      }

      try {
        const client = loadLightsClient();
        client.allLights(nextState);
        return json({ status: 'ok', target: 'apartment', state: nextState ? 'on' : 'off' });
      } catch (error) {
        console.error('Failed to toggle apartment lights', error);
        return json({ error: 'Failed to toggle apartment lights' }, { status: 500 });
      }
    }

    return notFound();
  },
  error(error) {
    console.error('Unhandled server error', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  },
});

console.log(`🚀 API server listening on http://localhost:${server.port}`);

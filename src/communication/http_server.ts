import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import debug from 'debug';
import { createServer } from 'http';
import cors from '@koa/cors';

const l = debug(`soundsync:httpserver`);

export interface SoundSyncHttpServer {
  app: Koa<Koa.DefaultState, Koa.DefaultContext>;
  router: Router<any, {}>;
  port: number;
}

export const createHttpServer = async (port: number): Promise<SoundSyncHttpServer> => {
  l(`Creating new http server`);
  const app = new Koa();
  const router = new Router();

  app.use(cors({
    // TODO limit CORS access here
  }));
  app.use(bodyParser());
  app.use(router.routes());

  const server = createServer(app.callback());
  await new Promise((resolve, reject) => {
    server.on('error', (e) => {
      reject(e);
    });
    server.listen(port);
    server.on('listening', resolve);
  });
  l(`Listening on ${port}`);

  return {
    app,
    router,
    port,
  };
};

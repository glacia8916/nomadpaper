import handler from 'vinext/server/fetch-handler';

import { backupD1 } from './lib/d1-backup';

const DAILY_SYNC_CRON = '35 16 * * *';
const WEEKLY_BACKUP_CRON = '0 18 * * 6';

async function runDailySync(
  env: Cloudflare.Env,
  ctx: ExecutionContext,
) {
  if (!env.SYNC_SECRET) throw new Error('SYNC_SECRET 未配置。');

  const response = await handler.fetch(
    new Request('https://nomadpaper.cn/api/sync/daily', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SYNC_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lookbackDays: 7,
        minimumScore: 55,
        limitPerSource: 10,
        perQuery: 35,
      }),
    }),
    env,
    ctx,
  );
  const result = (await response.json()) as { status?: string };
  if (!response.ok || result.status !== 'completed') {
    throw new Error(`每日同步未完全成功：${JSON.stringify(result)}`);
  }
}

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: Cloudflare.Env,
    ctx: ExecutionContext,
  ) {
    if (controller.cron === DAILY_SYNC_CRON) {
      ctx.waitUntil(
        runDailySync(env, ctx).catch((error) => {
          console.error('NomadPaper daily sync failed', error);
          throw error;
        }),
      );
      return;
    }

    if (controller.cron === WEEKLY_BACKUP_CRON) {
      ctx.waitUntil(
        backupD1(env.DB, env.BACKUP_DB).catch((error) => {
          console.error('NomadPaper weekly backup failed', error);
          throw error;
        }),
      );
    }
  },
};

export default worker;

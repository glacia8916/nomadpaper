import { env } from 'cloudflare:workers';

import { backupD1 } from '@/lib/d1-backup';

export async function POST(request: Request) {
  if (!env.SYNC_SECRET) {
    return Response.json({ error: 'SYNC_SECRET 未配置。' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${env.SYNC_SECRET}`) {
    return Response.json({ error: '无权执行备份。' }, { status: 401 });
  }

  try {
    const result = await backupD1(env.DB, env.BACKUP_DB);
    return Response.json({ status: 'completed', ...result });
  } catch (error) {
    return Response.json(
      {
        status: 'failed',
        error: error instanceof Error ? error.message : 'D1 备份失败。',
      },
      { status: 500 },
    );
  }
}

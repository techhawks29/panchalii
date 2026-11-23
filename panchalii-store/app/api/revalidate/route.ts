import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

// Called by the API after admin catalogue changes so ISR pages don't serve stale products.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get('x-revalidate-secret') ?? '';
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const paths: string[] = Array.isArray(body.paths) ? body.paths.filter((p: unknown) => typeof p === 'string' && p.startsWith('/')) : ['/'];
  for (const path of paths.length ? paths : ['/']) revalidatePath(path);

  return Response.json({ ok: true, revalidated: paths });
}

import { getDailyQuizHistory } from '@/server/history/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return Response.json({ history: getDailyQuizHistory() });
}

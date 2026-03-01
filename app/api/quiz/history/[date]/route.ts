import { getDailyQuizByDate } from '@/server/history/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    date: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const entry = getDailyQuizByDate(params.date);

  if (!entry) {
    return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
  }

  return Response.json({ entry });
}

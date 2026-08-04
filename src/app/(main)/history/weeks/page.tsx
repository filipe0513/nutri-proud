import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { progressService } from '@/services/progressService';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WeeklyHistoryList } from './WeeklyHistoryList';

export default async function HistoryWeeksPage() {
  const session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get('anon_user_id')?.value;
  }

  if (!userId) {
    redirect('/');
  }

  const history = await progressService.getWeeklyHistory(userId);

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      {/* App Bar */}
      <header className="sticky top-0 z-40 bg-neutral-100/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-neutral-200/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </Link>
          <h1 className="text-title-3 text-neutral-500">Histórico de Semanas</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <WeeklyHistoryList history={history} />
      </main>
    </div>
  );
}

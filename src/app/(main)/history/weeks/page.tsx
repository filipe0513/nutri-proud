import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { progressService } from '@/services/progressService';
import { getScoreGradient } from '@/utils/scoreUtils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  }).format(date).replace('.', ''); // removes dot from 'ago.' if present
}

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
        {history.length === 0 ? (
          <p className="text-body-2 text-neutral-400 text-center mt-10">Nenhum histórico encontrado.</p>
        ) : (
          history.map((week) => {
            const startDateStr = formatDate(week.startDate);
            const endDateStr = formatDate(week.endDate);
            const gradient = getScoreGradient(week.averageScore);
            
            return (
              <div 
                key={week.id} 
                className="bg-glass-light-1 backdrop-blur-sm border border-white/40 p-5 rounded-3xl shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-caption-1 text-neutral-400 font-medium">
                    {startDateStr} - {endDateStr} {week.isCurrentWeek && '(Atual)'}
                  </p>
                  <p 
                    className="text-title-2 font-bold mt-1" 
                    style={{ 
                      background: gradient, 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {week.degree}
                  </p>
                </div>
                
                <div className="flex flex-col items-end">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-15" style={{ background: gradient }} />
                    <span className="relative z-10 text-title-3 font-bold text-neutral-500">
                      {week.averageScore}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Trophy, AlertTriangle, Activity } from 'lucide-react';
import Image from 'next/image';

interface FeedPost {
  id: string;
  type: 'MILESTONE' | 'ALERT' | 'EVOLUTION' | 'SYSTEM';
  content: string;
  createdAt: Date;
  patient: {
    id: string;
    name: string | null;
    image: string | null;
  };
  team: {
    name: string;
  };
}

export function FeedTimeline({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm">
        <Bell className="h-12 w-12 text-neutral-200 mb-4" />
        <h3 className="text-title-3 font-semibold text-neutral-500">Nenhuma atualização</h3>
        <p className="text-body-2 text-neutral-400 mt-2 max-w-sm">
          Ainda não há registros ou alertas dos seus pacientes.
        </p>
      </div>
    );
  }

  const getIconConfig = (type: FeedPost['type']) => {
    switch (type) {
      case 'MILESTONE':
        return { icon: Trophy, bg: 'bg-green-100', color: 'text-green-600' };
      case 'ALERT':
        return { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' };
      case 'EVOLUTION':
        return { icon: Activity, bg: 'bg-blue-100', color: 'text-blue-600' };
      default:
        return { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const { icon: Icon, bg, color } = getIconConfig(post.type);
        const patientName = post.patient.name || 'Paciente anônimo';
        
        return (
          <div key={post.id} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm flex items-start gap-4">
            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {post.patient.image ? (
                  <Image src={post.patient.image} alt={patientName} width={20} height={20} className="rounded-full object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-brand-500">{patientName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="text-body-2 font-medium text-neutral-600 truncate">{patientName}</span>
                <span className="text-caption-1 text-neutral-400 shrink-0">
                  • {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              
              <p className="text-body-1 text-neutral-500">{post.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

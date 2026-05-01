import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LimitWarningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
}

export function LimitWarningDrawer({ isOpen, onClose, onContinueAnyway }: LimitWarningDrawerProps) {
  const router = useRouter();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-8">
        <DrawerHeader className="px-0 flex flex-col items-center text-center space-y-4 pt-6">
          <div className="h-16 w-16 rounded-full bg-notify-warning/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-notify-warning" />
          </div>
          <DrawerTitle className="text-title-2 text-neutral-600">Limite de Visitante Atingido</DrawerTitle>
          <DrawerDescription className="text-body-1 text-neutral-500/80">
            Você atingiu o limite de registros do modo visitante (11 registros ou 7 dias). 
            Crie uma conta gratuita agora para salvar seus dados e continuar sua jornada!
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="px-0 pt-6 space-y-3">
          <Button 
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-md transition-all"
            onClick={() => {
              onClose();
              router.push('/welcome?forceLogin=true');
            }}
          >
            Criar agora
          </Button>
          <Button 
            variant="ghost"
            className="w-full h-14 rounded-2xl text-neutral-500 hover:bg-neutral-100 font-medium text-button-1"
            onClick={() => {
              onClose();
              onContinueAnyway();
            }}
          >
            Criar depois
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

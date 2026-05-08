import { BottomNav } from '@/components/shared/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="min-h-screen pb-24 bg-mesh-sunset">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

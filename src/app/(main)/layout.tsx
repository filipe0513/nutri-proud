import { BottomNav } from '@/components/shared/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

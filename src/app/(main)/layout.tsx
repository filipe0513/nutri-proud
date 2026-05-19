import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { userService } from '@/services/userService';
import { NavWithShare } from '@/components/shared/NavWithShare';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const hasCompletedOnboarding = await userService.checkHasCompletedOnboarding(session.user.id);

  if (!hasCompletedOnboarding) {
    redirect('/onboarding');
  }

  return (
    <>
      <main className="min-h-screen pb-24 bg-mesh-sunset">
        {children}
      </main>
      <NavWithShare />
    </>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { userService } from '@/services/userService';
import { NavWithShare } from '@/components/shared/NavWithShare';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get('anon_user_id')?.value;

  // Accept both real Auth.js sessions and anonymous cookie sessions
  const userId = session?.user?.id ?? anonUserId;

  if (!userId) {
    redirect('/welcome');
  }

  const hasCompletedOnboarding = await userService.checkHasCompletedOnboarding(userId);

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

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comece Agora",
  description:
    "Entre no Orgulho da Nutri — o diário de saúde gamificado que conecta pacientes e nutricionistas. Login com Google ou Magic Link.",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

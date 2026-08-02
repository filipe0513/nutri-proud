"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Stethoscope, Loader2, ShieldCheck } from "lucide-react";
import { promoteUserToNutritionist } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  is_anonymous: boolean;
  createdAt: Date;
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  USER: {
    label: "Paciente",
    className: "bg-blue-50 text-blue-600 border border-blue-200/60",
  },
  NUTRITIONIST: {
    label: "Nutricionista",
    className:
      "bg-notify-success-glass text-notify-success border border-notify-success/20",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-purple-50 text-purple-600 border border-purple-200/60",
  },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_BADGE[role] ?? {
    label: role,
    className: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function UsersManagementTable({
  initialData,
}: {
  initialData: ManagedUser[];
}) {
  const [data, setData] = useState<ManagedUser[]>(initialData);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const filtered = data.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    );
  });

  const handlePromote = (userId: string) => {
    setPromotingId(userId);
    startTransition(async () => {
      try {
        const { squadInviteCode } = await promoteUserToNutritionist(userId);

        setData((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: "NUTRITIONIST" } : u
          )
        );

        toast.success("Nutricionista ativada com sucesso!", {
          description: `Squad criado. Código de convite: ${squadInviteCode}`,
          duration: 8000,
          className:
            "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
        });
      } catch (err) {
        toast.error("Falha ao promover usuária.", {
          description:
            err instanceof Error ? err.message : "Erro desconhecido.",
        });
      } finally {
        setPromotingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative px-6 pt-2">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <Input
          placeholder="Buscar por email ou nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 bg-white/60 border-neutral-200/60 rounded-xl text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase bg-neutral-100/50 border-y border-neutral-200 select-none">
            <tr>
              <th scope="col" className="px-6 py-3">
                Usuário
              </th>
              <th scope="col" className="px-6 py-3">
                Nome
              </th>
              <th scope="col" className="px-6 py-3">
                Role
              </th>
              <th scope="col" className="px-6 py-3">
                Membro desde
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-neutral-400 text-sm"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const isLoading = isPending && promotingId === u.id;
              return (
                <tr
                  key={u.id}
                  className="bg-white/30 border-b border-neutral-100 last:border-0 hover:bg-white/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-neutral-700 max-w-[220px] truncate">
                    {u.email ?? "Sem e-mail"}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {u.name ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                    {format(new Date(u.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role === "USER" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            className="h-8 gap-1.5 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Stethoscope className="w-3.5 h-3.5" />
                            )}
                            Promover para Nutri
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white rounded-2xl border border-neutral-100 shadow-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-title-3 text-neutral-800 flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-green-500" />
                              Confirmar Promoção
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="text-body-2 text-neutral-500 space-y-2 pt-1">
                                <p>
                                  Você está prestes a promover{" "}
                                  <strong className="text-neutral-700">
                                    {u.name ?? u.email ?? "este usuário"}
                                  </strong>{" "}
                                  para{" "}
                                  <strong className="text-green-700">
                                    Nutricionista
                                  </strong>
                                  .
                                </p>
                                <p>Isso irá:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>
                                    Alterar a role para{" "}
                                    <strong>NUTRITIONIST</strong>
                                  </li>
                                  <li>Criar o Squad padrão da nutricionista</li>
                                  <li>Remover metas de paciente</li>
                                  <li>
                                    Redirecionar para o dashboard de gestão no
                                    próximo acesso
                                  </li>
                                </ul>
                                <p className="text-xs text-neutral-400 pt-1">
                                  Esta ação não pode ser desfeita pelo painel.
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePromote(u.id)}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                            >
                              Confirmar Promoção
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-neutral-300 italic">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

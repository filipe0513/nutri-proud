'use server';

import { auth } from '@/auth';
import { signAndUploadToCloudinary } from '@/lib/cloudinary';
import { createTeamPost } from '@/services/teamService';
import { z } from 'zod';

const publishSchema = z.object({
  teamId: z.string().uuid('Team inválido.'),
  content: z.string().max(500).optional(),
});

/**
 * Uploads a base64-encoded image to Cloudinary and creates a Post in the
 * target Team's feed.
 *
 * This Server Action is called directly from the client component, keeping the
 * Cloudinary API secret safely on the server.
 */
export async function publishCardToTeam(formData: FormData): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autorizado.' };
    }

    if (session.user.role !== 'NUTRITIONIST' && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Acesso negado. Apenas nutricionistas e administradores podem criar posts.' };
    }

    const file = formData.get('file') as File | null;
    const rawTeamId = formData.get('teamId') as string;
    const rawContent = formData.get('content') as string | null;

    if (!file) {
      return { success: false, error: 'Imagem é obrigatória.' };
    }

    const parsed = publishSchema.safeParse({ teamId: rawTeamId, content: rawContent || undefined });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
    }

    const { teamId, content } = parsed.data;

    // ── 1. Upload to Cloudinary ───────────────────────────────────────────────
    const imageUrl = await signAndUploadToCloudinary(file, 'team_posts');

    // ── 2. Create Post in DB ─────────────────────────────────────────────────
    const post = await createTeamPost(teamId, session.user.id, {
      imageUrl,
      content: content ?? undefined,
      type: 'USER_GENERATED',
    });

    return { success: true, postId: post.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[publishCardToTeam]', err);
    return { success: false, error: message };
  }
}

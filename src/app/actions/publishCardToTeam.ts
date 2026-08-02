'use server';

import { auth } from '@/auth';
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
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: 'Configuração do Cloudinary incompleta.' };
    }

    // Build the multipart form for the Cloudinary REST API (signed upload)
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'team_posts';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    // Generate SHA-1 signature using Node.js crypto
    const crypto = await import('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', String(timestamp));
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('signature', signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryFormData },
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({}));
      console.error('[publishCardToTeam] Cloudinary error:', errBody);
      return { success: false, error: 'Falha no upload da imagem. Tente novamente.' };
    }

    const uploadData = await uploadRes.json() as { secure_url: string };
    const imageUrl = uploadData.secure_url;

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

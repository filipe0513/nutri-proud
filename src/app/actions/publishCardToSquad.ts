'use server';

import { auth } from '@/auth';
import { createSquadPost } from '@/services/squadService';
import { z } from 'zod';

const publishSchema = z.object({
  imageBase64: z.string().min(1, 'Imagem é obrigatória.'),
  squadId: z.string().uuid('Squad inválido.'),
  content: z.string().max(500).optional(),
});

/**
 * Uploads a base64-encoded image to Cloudinary and creates a Post in the
 * target Squad's feed.
 *
 * This Server Action is called directly from the client component, keeping the
 * Cloudinary API secret safely on the server.
 */
export async function publishCardToSquad(input: {
  imageBase64: string;
  squadId: string;
  content?: string;
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autorizado.' };
    }

    const parsed = publishSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
    }

    const { imageBase64, squadId, content } = parsed.data;

    // ── 1. Upload to Cloudinary ───────────────────────────────────────────────
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: 'Configuração do Cloudinary incompleta.' };
    }

    // Build the multipart form for the Cloudinary REST API (signed upload)
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'squad_posts';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    // Generate HMAC-SHA1 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiSecret);
    const msgData = encoder.encode(paramsToSign);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const signature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const formData = new FormData();
    formData.append('file', imageBase64);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({}));
      console.error('[publishCardToSquad] Cloudinary error:', errBody);
      return { success: false, error: 'Falha no upload da imagem. Tente novamente.' };
    }

    const uploadData = await uploadRes.json() as { secure_url: string };
    const imageUrl = uploadData.secure_url;

    // ── 2. Create Post in DB ─────────────────────────────────────────────────
    const post = await createSquadPost(squadId, session.user.id, {
      imageUrl,
      content: content ?? undefined,
      type: 'USER_GENERATED',
    });

    return { success: true, postId: post.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[publishCardToSquad]', err);
    return { success: false, error: message };
  }
}

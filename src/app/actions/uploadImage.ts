'use server';

import { auth } from '@/auth';

/**
 * Uploads a base64-encoded image or Blob to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(formData: FormData): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autorizado.' };
    }

    const file = formData.get('file') as File | null;
    const folderName = formData.get('folder') as string || 'user_uploads';

    if (!file) {
      return { success: false, error: 'Imagem é obrigatória.' };
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: 'Configuração do Cloudinary incompleta.' };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folderName}&timestamp=${timestamp}`;

    const crypto = await import('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', String(timestamp));
    cloudinaryFormData.append('folder', folderName);
    cloudinaryFormData.append('signature', signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryFormData },
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({}));
      console.error('[uploadImage] Cloudinary error:', errBody);
      return { success: false, error: 'Falha no upload da imagem.' };
    }

    const uploadData = await uploadRes.json() as { secure_url: string };
    
    return { success: true, imageUrl: uploadData.secure_url };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[uploadImage]', err);
    return { success: false, error: message };
  }
}

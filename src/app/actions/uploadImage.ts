'use server';

import { auth } from '@/auth';
import { signAndUploadToCloudinary } from '@/lib/cloudinary';

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

    const imageUrl = await signAndUploadToCloudinary(file, folderName);
    return { success: true, imageUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[uploadImage]', err);
    return { success: false, error: message };
  }
}

/**
 * Shared Cloudinary signed upload helper.
 * Used by server actions that need to upload images to Cloudinary.
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function signAndUploadToCloudinary(file: File, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Configuração do Cloudinary incompleta.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5 MB.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  // signature_algorithm=sha256 must be included in the params string (alphabetical order)
  const paramsToSign = `folder=${folder}&signature_algorithm=sha256&timestamp=${timestamp}`;

  const crypto = await import('crypto');
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', file);
  cloudinaryFormData.append('api_key', apiKey);
  cloudinaryFormData.append('timestamp', String(timestamp));
  cloudinaryFormData.append('folder', folder);
  cloudinaryFormData.append('signature_algorithm', 'sha256');
  cloudinaryFormData.append('signature', signature);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: cloudinaryFormData },
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => ({}));
    console.error('[cloudinary] Upload error:', errBody);
    throw new Error('Falha no upload da imagem.');
  }

  const uploadData = await uploadRes.json() as { secure_url: string };
  return uploadData.secure_url;
}

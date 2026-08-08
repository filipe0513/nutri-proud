/**
 * Shared Cloudinary signed upload helper.
 * Used by server actions that need to upload images to Cloudinary.
 */
export async function signAndUploadToCloudinary(file: File, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Configuração do Cloudinary incompleta.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

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
    console.error('[cloudinary] Upload error:', errBody);
    throw new Error('Falha no upload da imagem.');
  }

  const uploadData = await uploadRes.json() as { secure_url: string };
  return uploadData.secure_url;
}

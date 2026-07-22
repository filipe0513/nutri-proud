"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const imageUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => url.includes("cloudinary.com") || url.includes("res.cloudinary.com"),
    { message: "A URL deve ser do Cloudinary." }
  );

export async function updateUserProfileImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado." };
    }

    const parsed = imageUrlSchema.safeParse(imageUrl);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "URL inválida." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: parsed.data },
    });

    return { success: true };
  } catch (error) {
    console.error("[updateUserProfileImage] Erro ao atualizar imagem:", error);
    return { success: false, error: "Falha ao salvar a imagem. Tente novamente." };
  }
}

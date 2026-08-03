"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/store";
import { updateUserProfileImage } from "@/app/actions/updateProfileImage";
import { UserAvatar } from "./UserAvatar";

interface AvatarUploadButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarUploadButton({ size = "lg", className }: AvatarUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { user_profile, updateProfile } = useAppStore();

  // Cloudinary widget result type
  type CloudinaryResult = {
    secure_url: string;
    public_id: string;
  };

  const handleUploadSuccess = async (result: { info?: CloudinaryResult | string }) => {
    if (typeof result.info !== "object" || !result.info?.secure_url) return;

    const secureUrl = result.info.secure_url;
    setIsUploading(true);

    try {
      const response = await updateUserProfileImage(secureUrl);

      if (!response.success) {
        toast.error(response.error ?? "Erro ao salvar a foto.", {
          className: "bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error",
        });
        return;
      }

      // Atualização otimista no Zustand — avatar troca na hora sem refresh
      if (user_profile) {
        await updateProfile({ ...user_profile, image: secureUrl });
      }

      toast.success("Foto de perfil atualizada!", {
        className: "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
      });
    } catch {
      toast.error("Erro inesperado. Tente novamente.", {
        className: "bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

  return (
    <CldUploadWidget
      uploadPreset={uploadPreset}
      options={{
        maxFiles: 1,
        resourceType: "image",
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        croppingShowDimensions: false,
        folder: "nutri_proud/profiles",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxFileSize: 5000000, // 5 MB
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#E4E4E7",
            tabIcon: "#F97316",
            menuIcons: "#71717A",
            textDark: "#18181B",
            textLight: "#FFFFFF",
            link: "#F97316",
            action: "#F97316",
            inactiveTabIcon: "#A1A1AA",
            error: "#EF4444",
            inProgress: "#F97316",
            complete: "#22C55E",
            sourceBg: "#F4F4F5",
          },
        },
      }}
      onSuccess={(result) => handleUploadSuccess(result as { info?: CloudinaryResult | string })}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => !isUploading && open()}
          aria-label="Alterar foto de perfil"
          className={`relative group flex-shrink-0 ${className ?? ""}`}
        >
          <UserAvatar size={size} />

          {/* Camera overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>

          {/* Persistent small camera badge */}
          {!isUploading && (
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm">
              <Camera className="h-2.5 w-2.5 text-white" />
            </span>
          )}

          {isUploading && (
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm">
              <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
            </span>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}

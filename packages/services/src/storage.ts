import { supabase } from "./supabase/client";

const BUCKET = "avatars";

export async function uploadAvatar(
  userId: string,
  file: File,
) {
  const extension =
    file.name.split(".").pop() ?? "jpg";

  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}
import { createClient } from "@/utils/supabase/server";

const BUCKET = "disclosures";

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ path: string; error: string | null }> {
  const supabase = await createClient();

  // Sanitize filename: keep extension, replace spaces/special chars
  const ext = file.name.split(".").pop() || "";
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 50);
  const uniqueName = `${crypto.randomUUID()}-${baseName}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path, error: null };
}

export async function deleteFile(
  path: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function downloadFileAsBuffer(path: string): Promise<Buffer> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Build the public URL for a plant image stored in the public bucket. */
export function publicImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/plant-images/${path}`;
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateEventPhotos } from "@/lib/actions/events";
import Image from "next/image";

export function PhotoUpload({
  eventId,
  photos: initialPhotos,
}: {
  eventId: string;
  photos: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
      const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { contentType: file.type });

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("property-photos").getPublicUrl(path);
        newPhotos.push(publicUrl);
      }
    }

    const updated = [...photos, ...newPhotos].slice(0, 10);
    setPhotos(updated);
    await updateEventPhotos(eventId, updated);
    setUploading(false);
  }

  async function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    await updateEventPhotos(eventId, updated);
  }

  return (
    <div>
      {photos.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((url, i) => (
            <div key={url} className="group relative aspect-video">
              <Image
                src={url}
                alt={`Property photo ${i + 1}`}
                fill
                className="rounded-md object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 text-xs text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < 10 && (
        <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          {uploading ? "Uploading..." : "Click to upload photos"}
        </label>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";

export function PropertyHero({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center bg-muted sm:h-80">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 bg-muted sm:h-80 md:h-96">
      <Image
        src={photos[currentIndex]!}
        alt="Property photo"
        fill
        className="object-cover"
        priority
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrentIndex((i) => (i - 1 + photos.length) % photos.length)
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-white hover:bg-black/70"
          >
            &larr;
          </button>
          <button
            onClick={() =>
              setCurrentIndex((i) => (i + 1) % photos.length)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-white hover:bg-black/70"
          >
            &rarr;
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {currentIndex + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

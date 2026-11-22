"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Image slot with a dark-green placeholder. If the file at `src` is missing,
 * the placeholder (with the filename) shows instead of a broken image.
 * Drop your photos into /public/images with the same names.
 */
export default function Photo({
  src,
  alt = "",
  className = "",
  priority = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Catch images that failed before React hydrated.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  return (
    <div className={`img ${className}`}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setFailed(true)}
        />
      )}
      {failed && <span className="ph">{src.replace(/^\//, "public/")}</span>}
    </div>
  );
}

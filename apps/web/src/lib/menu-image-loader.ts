import type { ImageLoaderProps } from "next/image";

// Unsplash CDN, tarayıcının seçtiği genişliği doğrudan üretir.
export default function menuImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}

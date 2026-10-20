"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuProduct } from "@/types/menu";

type MenuImageProps = {
  src: string | null;
  alt: string;
  illustration?: MenuProduct["illustration"];
};

function RemoteImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className="image-placeholder" aria-hidden="true">
        nest.
      </span>
    );
  // Doğrudan URL gösterimi; ileride remotePatterns ile optimizasyon eklenebilir.
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 760px) 45vw, 30vw"
      className="menu-photo"
      onError={() => setFailed(true)}
    />
  );
}

export default function MenuImage({ src, alt, illustration }: MenuImageProps) {
  const validSrc = src && (/^https?:\/\//i.test(src) || /^\/(?!\/)/.test(src));
  if (validSrc) return <RemoteImage key={src} src={src} alt={alt} />;
  if (illustration)
    return (
      <div className={`product-art art-${illustration}`} aria-hidden="true">
        <span className="art-shadow" />
        <span className="art-object" />
        <span className="art-detail" />
      </div>
    );
  return (
    <span className="image-placeholder" aria-hidden="true">
      nest.
    </span>
  );
}

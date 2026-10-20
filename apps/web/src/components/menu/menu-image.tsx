"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuProduct } from "@/types/menu";
import menuImageLoader from "@/lib/menu-image-loader";

type MenuImageProps = {
  src: string | null;
  alt: string;
  illustration?: MenuProduct["illustration"];
  variant?: "thumbnail" | "card" | "detail";
};

const imageSizes = {
  thumbnail: "30px",
  card: "(max-width: 760px) calc((90vw - 15px) / 2), (max-width: 1050px) calc((89vw - 36px) / 3), (max-width: 1600px) calc((89vw - 48px) / 3), 459px",
  detail: "(max-width: 544px) 90vw, 490px",
};

function RemoteImage({
  src,
  alt,
  variant,
}: {
  src: string;
  alt: string;
  variant: NonNullable<MenuImageProps["variant"]>;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className="image-placeholder" aria-hidden="true">
        nest.
      </span>
    );

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loader={
        src.startsWith("https://images.unsplash.com/")
          ? menuImageLoader
          : undefined
      }
      sizes={imageSizes[variant]}
      quality={variant === "thumbnail" ? 65 : 75}
      loading="lazy"
      className="menu-photo"
      onError={() => setFailed(true)}
    />
  );
}

export default function MenuImage({
  src,
  alt,
  illustration,
  variant = "card",
}: MenuImageProps) {
  let validSrc = !!src && /^\/(?!\/)/.test(src);
  if (src && !validSrc) {
    try {
      const url = new URL(src);
      validSrc =
        url.protocol === "https:" &&
        url.hostname === "images.unsplash.com" &&
        url.port === "" &&
        url.pathname.startsWith("/photo-") &&
        !url.username &&
        !url.password;
    } catch {
      validSrc = false;
    }
  }
  if (src && validSrc)
    return <RemoteImage key={src} src={src} alt={alt} variant={variant} />;
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

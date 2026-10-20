"use client";

import { useEffect, useRef } from "react";
import type { MenuProduct } from "@/types/menu";
import MenuImage from "./menu-image";
import ProductPrice from "./product-price";

type ProductDialogProps = {
  product: MenuProduct | null;
  categoryName: string;
  onClose: () => void;
};

export default function ProductDialog({
  product,
  categoryName,
  onClose,
}: ProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (product && dialog && !dialog.open) dialog.showModal();
    else if (!product && dialog?.open) dialog.close();
  }, [product]);
  return (
    <dialog
      ref={dialogRef}
      className="product-dialog"
      aria-labelledby="product-detail-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {product && (
        <>
          <button
            type="button"
            className="dialog-close"
            aria-label="Ürün detayını kapat"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
          <div className="dialog-art">
            <MenuImage
              src={product.productImage}
              alt={product.productName}
              illustration={product.illustration}
              variant="detail"
            />
          </div>
          <div className="dialog-copy">
            <p className="eyebrow">{categoryName}</p>
            <div className="product-title">
              <h2 id="product-detail-title">{product.productName}</h2>
              <ProductPrice
                price={product.productPrice}
                discount={product.productDiscount}
              />
            </div>
            {product.description && <p>{product.description}</p>}
            <span className="dialog-note">
              İçerik ve alerjen bilgisi için ekibimize danışabilirsin.
            </span>
          </div>
        </>
      )}
    </dialog>
  );
}

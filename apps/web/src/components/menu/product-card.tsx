import type { CSSProperties } from "react";
import type { MenuProduct } from "@/types/menu";
import MenuImage from "./menu-image";
import ProductPrice from "./product-price";

type ProductCardProps = {
  product: MenuProduct;
  categoryName: string;
  index: number;
  onSelect: (product: MenuProduct) => void;
};

export default function ProductCard({
  product,
  categoryName,
  index,
  onSelect,
}: ProductCardProps) {
  return (
    <button
      type="button"
      className="product-card"
      style={{ "--card-index": index } as CSSProperties}
      onClick={() => onSelect(product)}
      aria-label={`${product.productName}. Detayları gör`}
    >
      <div className="product-image">
        <MenuImage
          src={product.productImage}
          alt={product.productName}
          illustration={product.illustration}
        />
        <span className="product-number">
          / {String(index + 1).padStart(2, "0")}
        </span>
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <span className="card-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="product-content">
        <span className="product-category">{categoryName}</span>
        <div className="product-title">
          <h3>{product.productName}</h3>
          <ProductPrice
            price={product.productPrice}
            discount={product.productDiscount}
          />
        </div>
        {product.description && <p>{product.description}</p>}
      </div>
    </button>
  );
}

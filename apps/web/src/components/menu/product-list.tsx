import type { Category, MenuProduct } from "@/types/menu";
import ProductCard from "./product-card";

type ProductListProps = {
  products: MenuProduct[];
  categories: Category[];
  onSelect: (product: MenuProduct) => void;
};

export default function ProductList({
  products,
  categories,
  onSelect,
}: ProductListProps) {
  const names = new Map(
    categories.map((category) => [category.categoryId, category.categoryName]),
  );
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          categoryName={
            names.get(product.categoryId) ?? product.categoryName ?? "Menümüz"
          }
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

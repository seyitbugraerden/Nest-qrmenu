export type Category = {
  id: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categoryImage: string | null;
};

export type Product = {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  productImage: string | null;
  // PostgreSQL numeric değerleri API'den string olarak gelebilir.
  productPrice: string | number;
  productDiscount: string | number | null;
};

// Sunum alanları opsiyoneldir; mevcut ürün API'sinde bulunmaları gerekmez.
export type MenuProduct = Product & {
  categoryName?: string;
  description?: string;
  tag?: string;
  illustration?: "coffee" | "iced" | "cake" | "filter" | "lemon" | "sandwich";
};

export type MenuViewProps = {
  categorySlug?: string | null;
  categories: Category[];
  products: MenuProduct[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

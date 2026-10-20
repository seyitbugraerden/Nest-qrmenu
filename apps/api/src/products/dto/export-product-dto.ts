export class CreateProductDto {
  productName: string;
  productId: string;
  categoryId: string;
  productPrice: string;
  productDiscount?: string;
  productImage?: string | null;
}
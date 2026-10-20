import type { Category } from "@/types/menu";
import MenuImage from "./menu-image";

type CategoryCardProps = {
  category: Category;
  index: number;
  isActive: boolean;
  onSelect: (categoryId: string) => void;
};

export default function CategoryCard({
  category,
  index,
  isActive,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      className={`category ${isActive ? "active" : ""}`}
      aria-pressed={isActive}
      onClick={() => onSelect(category.categoryId)}
    >
      {category.categoryImage && (
        <span className="category-thumbnail">
          <MenuImage src={category.categoryImage} alt="" variant="thumbnail" />
        </span>
      )}
      <sup>{String(index + 1).padStart(2, "0")}</sup>
      {category.categoryName}
      <span className="category-dot" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

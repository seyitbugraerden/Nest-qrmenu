import type { Category } from "@/types/menu";
import CategoryCard from "./category-card";

type CategoryListProps = {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
};

export default function CategoryList({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryListProps) {
  return (
    <nav className="categories" aria-label="Menü kategorileri">
      <button
        type="button"
        className={`category ${selectedCategoryId === null ? "active" : ""}`}
        aria-pressed={selectedCategoryId === null}
        onClick={() => onSelect(null)}
      >
        <sup>01</sup>Tümü
        <span className="category-dot" aria-hidden="true">
          ↗
        </span>
      </button>
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          index={index + 1}
          isActive={selectedCategoryId === category.categoryId}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

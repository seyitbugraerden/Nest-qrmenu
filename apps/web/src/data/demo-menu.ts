import type { Category, MenuProduct } from "@/types/menu";

// Yalnızca tasarım ön izlemesi. Servis bağlantısında bu dizileri API verileriyle değiştirin.
export const demoCategories: Category[] = [
  {
    id: "demo-category-1",
    categoryId: "DEMO-CAT-001",
    slug: "kahveler",
    categoryName: "Kahveler",
    categoryImage: null,
  },
  {
    id: "demo-category-2",
    categoryId: "DEMO-CAT-002",
    slug: "soguk-icecekler",
    categoryName: "Soğuk içecekler",
    categoryImage: null,
  },
  {
    id: "demo-category-3",
    categoryId: "DEMO-CAT-003",
    slug: "tatlilar",
    categoryName: "Tatlılar",
    categoryImage: null,
  },
  {
    id: "demo-category-4",
    categoryId: "DEMO-CAT-004",
    slug: "atistirmaliklar",
    categoryName: "Atıştırmalıklar",
    categoryImage: null,
  },
];

const previewProducts = [
  {
    id: "1",
    name: "Flat White",
    category: "Kahveler",
    description:
      "Çift shot espresso, ipeksi süt. Küçük bir fincanda büyük bir mola.",
    price: 145,
    tag: "Çok sevilen",
    art: "coffee",
  },
  {
    id: "2",
    name: "Iced Latte",
    category: "Soğuk içecekler",
    description: "Taze espresso, soğuk süt ve bol buz. Günün en ferah eşliği.",
    price: 165,
    tag: "",
    art: "iced",
  },
  {
    id: "3",
    name: "San Sebastian",
    category: "Tatlılar",
    description: "Karamelize dışı, yumuşacık içi. Yanında çikolata sosuyla.",
    price: 240,
    tag: "Ev yapımı",
    art: "cake",
  },
  {
    id: "4",
    name: "Filtre Kahve",
    category: "Kahveler",
    description:
      "Mevsimsel çekirdeklerden, her fincanda dengeli ve temiz bir tat.",
    price: 120,
    tag: "",
    art: "filter",
  },
  {
    id: "5",
    name: "Ev Yapımı Limonata",
    category: "Soğuk içecekler",
    description:
      "Taze limon, bir dokunuş nane. Tam kararında tatlı, bolca ferah.",
    price: 135,
    tag: "",
    art: "lemon",
  },
  {
    id: "6",
    name: "Mozzarella Sandviç",
    category: "Atıştırmalıklar",
    description: "Ekşi mayalı ekmek, mozzarella, domates ve fesleğenli pesto.",
    price: 275,
    tag: "Taze hazırlanır",
    art: "sandwich",
  },
];

export const demoProducts: MenuProduct[] = previewProducts.map((item) => ({
  id: item.id,
  productId: `PREVIEW-${item.id}`,
  productName: item.name,
  categoryId: demoCategories.find(
    (category) => category.categoryName === item.category,
  )!.categoryId,
  productImage: null,
  productPrice: String(item.price),
  productDiscount: "0.00",
  description: item.description,
  tag: item.tag,
  illustration: item.art as MenuProduct["illustration"],
}));

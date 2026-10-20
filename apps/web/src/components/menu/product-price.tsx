import type { Product } from "@/types/menu";

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

export default function ProductPrice({
  price,
  discount,
}: {
  price: Product["productPrice"];
  discount: Product["productDiscount"];
}) {
  const amount = Number(price);
  const percentage = Math.min(100, Math.max(0, Number(discount) || 0));
  if (!Number.isFinite(amount) || amount < 0)
    return <span className="price">Fiyat bilgisi yok</span>;
  const finalAmount = Math.round(amount * (100 - percentage)) / 100;
  return (
    <span className="price">
      {percentage > 0 && (
        <>
          <del aria-label="İndirim öncesi fiyat">
            {formatter.format(amount)}
          </del>
          <span className="discount-label">%{percentage} indirim</span>
        </>
      )}
      <span aria-label={percentage > 0 ? "İndirimli fiyat" : "Fiyat"}>
        {formatter.format(finalAmount)}
      </span>
    </span>
  );
}

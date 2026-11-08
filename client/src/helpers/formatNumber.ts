export const formatQty = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num);
};


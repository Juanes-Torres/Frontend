// Formatea números como pesos colombianos: 1599000 → "$ 1.599.000"
export const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

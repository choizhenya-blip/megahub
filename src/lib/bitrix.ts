export interface BitrixOrderItem {
  titleRu: string;
  price: number;
  qty: number;
}

export interface BitrixOrderPayload {
  name: string;
  phone: string;
  address: string;
  items: BitrixOrderItem[];
  totalPrice: number;
}

export function buildBitrixLead(order: BitrixOrderPayload) {
  const itemLines = order.items
    .map((item) => `• ${item.titleRu} × ${item.qty} шт. — ${(item.price * item.qty).toLocaleString("ru-RU")} ₸`)
    .join("\n");

  const comments = [
    "Состав заказа:",
    itemLines,
    "",
    `Итого: ${order.totalPrice.toLocaleString("ru-RU")} ₸`,
    "Доставка не включена",
    order.address ? `Адрес доставки: ${order.address}` : "",
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n")
    .trim();

  return {
    fields: {
      TITLE: `Заказ MegaHub: ${order.name}`,
      NAME: order.name,
      PHONE: [{ VALUE: order.phone, VALUE_TYPE: "WORK" }],
      COMMENTS: comments,
      SOURCE_ID: "WEB",
      STATUS_ID: "NEW",
    },
  };
}

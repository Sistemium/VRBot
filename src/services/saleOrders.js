export function saleOrderView(saleOrder) {
  return [
    'Заказ №',
    `<b>${saleOrder.ndoc}</b>`,
    'для',
    `<b>${saleOrder.contactName}</b>`,
  ].join(' ');
}

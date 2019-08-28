const { SITE_URL = 'https://vr.sistemium.com' } = process.env;

export function saleOrderView(saleOrder) {
  return [
    `<a href="${saleOrderLink(saleOrder)}">заказ №${saleOrder.ndoc}</a>`,
    'для',
    `<b>${saleOrder.contactName}</b>`,
  ].join(' ');
}

function saleOrderLink({ id }) {
  return `${SITE_URL}/#/saleOrders/${id}`;
}

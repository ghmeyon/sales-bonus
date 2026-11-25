/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount = 0, sale_price, quantity } = purchase;
   const revenue = sale_price * quantity * (1 - (discount / 100));
   return +revenue.toFixed(2);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    let bonus;
    if (index === 0) {
        bonus = profit * 1.15;
    } 
    if (index === 1 || index === 2) {
        bonus = profit * 1.10;
    }
    if (index === total - 1) {
        bonus = profit;
    }
    else {
        bonus = profit * 0.5;
    }
    return +bonus.toFixed(2);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    console.log('Входные данные:', {
    data: data,
    data_sellers: data?.sellers,
    isArray_sellers: Array.isArray(data?.sellers),
    data_products: data?.products,
    isArray_products: Array.isArray(data?.products),
    data_receipts: data?.receipts,
    isArray_receipts: Array.isArray(data?.receipts),
    sellers_length: data?.sellers?.length
  });
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.receipts)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.receipts.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { calculateSimpleRevenue, calculateBonusByProfit } = options || {};
    if (typeof calculateSimpleRevenue !== 'function' || typeof calculateBonusByProfit !== 'function') {
        throw new Error('Некорректные функции расчета');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = new Map(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = new Map(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.receipts.forEach(record => {
        const seller = sellerIndex.get(record.seller_id);
        if (!seller) {
            return;
        }
        seller.sales_count += 1;
        seller.revenue = +(seller.revenue + record.total_amount).toFixed(2);

        record.items.forEach(item => {
            const product = productIndex.get(item.sku);
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item, product);
            const profit = revenue - cost;
            const roundedProfit = +profit.toFixed(2);
            seller.profit = +(seller.profit + roundedProfit).toFixed(2);

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller)

    seller.top_products = 
    Object.entries(seller.products_sold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, quantity]) => ({
        sku: sku,
        quantity: quantity
    }));
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: seller.revenue,
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus,
    }));
}
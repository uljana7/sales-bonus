/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
    const { discount, sale_price, quantity } = purchase;
    const discountNumeric = 1 - (discount / 100)
    return sale_price * quantity * discountNumeric;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return 0.15*profit;
    } else if ((index === 1)||(index === 2)) {
        return 0.1*profit;
    } else if ((index === total - 1)) {
        return 0*profit;
    } else {
        return 0.05*profit;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    //  Проверка входных данных
    if (!data || 
        ((!Array.isArray(data.sellers)) && (!Array.isArray(data.products)) && (!Array.isArray(data.purchase_records)))
        || ((data.sellers.length === 0) && (data.products.length === 0) && (data.purchase_records.length === 0))
    ) {
        throw new Error('Некорректные входные данные');
    } 

    // Проверка наличия опций
    if(!typeof options === "object") {
        throw new Error('Проблемы с входными данными');
    }
    const { calculateRevenue, calculateBonus } = options; 
    if(!typeof calculateRevenue === "function" || !typeof calculateBonus === "function") {
        throw new Error('Проблемы с входными данными');
    }

    //  Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`, 
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item])); // Ключом будет id, значением — запись из sellerStats
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item])); // Ключом будет sku, значением — запись из data.products
     
    //  Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить общую сумму выручки всех продаж
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            seller.sales_count ++;// Увеличить количество продаж 

            // Увеличить общую накопленную прибыль (profit) у продавца  
            const cost = product.purchase_price * item.quantity;
            const revenueCalculated = calculateRevenue(item, product);
            seller.revenue += revenueCalculated;
            seller.profit += (revenueCalculated - cost);
            
            // По артикулу товара увеличить его проданное количество у продавца
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
            
        });
    });
    

    //  Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => {
        if (a.profit < b.profit) {
            return 1;
        }
        if (a.profit > b.profit) {
            return -1;
        }
        return 0;
    }); 

    // Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);// Считаем бонус 
        seller.top_products = Object.entries(seller.products_sold).map(([sku, quantity]) => ({ sku, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0,10);//seller.products_sold.map(item => [item.id, item]);// Формируем топ-10 товаров
    }); 

    //  Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
}));
}

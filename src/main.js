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
    return sale_price * quantity * discount;
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
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Группировка массива по ключу
 * @param array исходный массив
 * @param keyFn функция получения ключа
 * @returns {*} 
 */
function groupBy(array, keyFn) {
    return array.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}

/*
 * Функция для перегруппировки данных с получением статистики по продавцу 
 * 
 */
function getSellerStatistic(array){
    
    /*
    const resultSellerStatistic = array.reduce((acc, item) => {
        const recordsBySeller = groupBy(array.purchase_records, record => record.seller_id);
        const recordsByCustomer = groupBy(array.purchase_records, record => record.customer_id);
        const recordsByProduct = groupBy(array.purchase_records.flatMap(record => record.items), item => item.sku);
        
        acc.id = recordsBySeller.seller_id;
        acc.name =  `${recordsBySeller.first_name} ${recordsBySeller.last_name}`; 
        acc.revenue = recordsBySeller.reduce((revenue, item) => revenue + item.total_amount + item.total_discount, 0);
        acc.profit = recordsBySeller.reduce((profit, item) => profit + item.total_amount, 0);
        acc.products_sold = recordsBySeller.items.reduce((acc, item) => {
        if (acc[item.sku]) {
            acc[item.sku] += item.quantity;
        } else {
            acc[item.sku] = item.quantity;
        }
        return acc;
        }, {});
        acc.sales_count = item.products_sold.reduce((acc, item) => acc + item.quantity, 0);
    }, {});

    if (console.table) console.table(resultSellerStatistic);
        else console.log(resultSellerStatistic);
    return resultSellerStatistic;*/
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
        ((!Array.isArray(data.sellers)) && (!Array.isArray(data.products))&& (!Array.isArray(data.purchase_records)))
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
            
            seller.revenue += calculateRevenue(item, product);
            seller.profit += seller.revenue - cost;
            
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

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = // Считаем бонус
        seller.top_products = // Формируем топ-10 товаров
    }); 

    // @TODO: Подготовка итоговой коллекции с нужными полями
}

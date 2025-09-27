-- Миграция: Добавление столбца city в таблицу product
-- Дата создания: 2024-12-XX
-- Описание: Добавляет поле города для товаров в каталоге

-- Добавляем столбец city в таблицу product
ALTER TABLE "product" 
ADD COLUMN "city" VARCHAR(50) DEFAULT 'Таганрог';

-- Комментарий к новому столбцу
COMMENT ON COLUMN "product"."city" IS 'Город, в котором находится товар';

-- Создаем индекс для быстрого поиска по городу
CREATE INDEX IF NOT EXISTS idx_product_city ON "product"("city");

-- Обновляем существующие записи (устанавливаем город по умолчанию)
UPDATE "product" 
SET "city" = 'Таганрог' 
WHERE "city" IS NULL;

-- Проверяем результат
SELECT 
    COUNT(*) as total_products,
    "city",
    COUNT(*) as products_in_city
FROM "product" 
GROUP BY "city"
ORDER BY products_in_city DESC;

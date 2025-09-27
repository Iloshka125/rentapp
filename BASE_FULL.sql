-- =====================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ
-- Система аренды товаров
-- =====================================================

-- Создание базы данных (раскомментировать если нужно создать новую БД)
-- CREATE DATABASE rentapp_db;

-- Подключение к базе данных
-- \c rentapp_db;

-- =====================================================
-- ТАБЛИЦА 1: USER (Пользователи)
-- =====================================================
CREATE TABLE IF NOT EXISTS "user" (
    "idUser" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "secondName" VARCHAR(255),
    "middleName" VARCHAR(255),
    "birthday" DATE NOT NULL,
    "phone" VARCHAR(20) UNIQUE,
    "email" VARCHAR(255) UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "admin" BOOLEAN DEFAULT FALSE
);

-- Комментарии к таблице user
COMMENT ON TABLE "user" IS 'Таблица пользователей системы';
COMMENT ON COLUMN "user"."idUser" IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN "user"."name" IS 'Имя пользователя';
COMMENT ON COLUMN "user"."secondName" IS 'Фамилия пользователя';
COMMENT ON COLUMN "user"."middleName" IS 'Отчество пользователя';
COMMENT ON COLUMN "user"."birthday" IS 'Дата рождения пользователя';
COMMENT ON COLUMN "user"."phone" IS 'Номер телефона (уникальный)';
COMMENT ON COLUMN "user"."email" IS 'Email адрес (уникальный)';
COMMENT ON COLUMN "user"."password" IS 'Хешированный пароль';
COMMENT ON COLUMN "user"."admin" IS 'Флаг администратора';

-- =====================================================
-- ТАБЛИЦА 2: PRODUCT (Товары/Объявления)
-- =====================================================
CREATE TABLE IF NOT EXISTS "product" (
    "idProduct" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "photo" VARCHAR(500) NOT NULL,
    "images" TEXT, -- JSON строка с массивом путей к дополнительным изображениям
    "price" DECIMAL(10,2) NOT NULL,
    "rating" DECIMAL(3,2) DEFAULT 0.00,
    "status" VARCHAR(50) DEFAULT 'available' NOT NULL,
    "city" VARCHAR(50) DEFAULT 'Таганрог' NOT NULL, -- Город товара
    "startdate" DATE, -- Дата начала доступности товара для аренды
    "enddate" DATE, -- Дата окончания доступности товара для аренды
    "city" VARCHAR(50) DEFAULT 'Таганрог' NOT NULL, -- Город товара
    FOREIGN KEY ("userId") REFERENCES "user"("idUser") ON DELETE CASCADE
);

-- Комментарии к таблице product
COMMENT ON TABLE "product" IS 'Таблица товаров/объявлений для аренды';
COMMENT ON COLUMN "product"."idProduct" IS 'Уникальный идентификатор товара';
COMMENT ON COLUMN "product"."userId" IS 'ID владельца товара (ссылка на user)';
COMMENT ON COLUMN "product"."name" IS 'Название товара';
COMMENT ON COLUMN "product"."description" IS 'Описание товара';
COMMENT ON COLUMN "product"."category" IS 'Категория товара';
COMMENT ON COLUMN "product"."photo" IS 'Путь к основному фото товара';
COMMENT ON COLUMN "product"."images" IS 'JSON массив путей к дополнительным изображениям';
COMMENT ON COLUMN "product"."price" IS 'Цена аренды за день';
COMMENT ON COLUMN "product"."rating" IS 'Средний рейтинг товара';
COMMENT ON COLUMN "product"."status" IS 'Статус товара (available, rented, deleted, unavailable)';
COMMENT ON COLUMN "product"."city" IS 'Город, в котором находится товар';
COMMENT ON COLUMN "product"."startdate" IS 'Дата начала доступности товара для аренды';
COMMENT ON COLUMN "product"."enddate" IS 'Дата окончания доступности товара для аренды';

-- =====================================================
-- ТАБЛИЦА 3: RENT (Аренда)
-- =====================================================
CREATE TABLE IF NOT EXISTS "rent" (
    "idRent" SERIAL PRIMARY KEY,
    "idUser" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "dataStart" DATE, -- Дата начала аренды
    "dataEnd" DATE, -- Дата окончания аренды
    "isreview" BOOLEAN DEFAULT TRUE, -- Флаг возможности оставить отзыв
    FOREIGN KEY ("idUser") REFERENCES "user"("idUser") ON DELETE CASCADE,
    FOREIGN KEY ("idProduct") REFERENCES "product"("idProduct") ON DELETE CASCADE
);

-- Комментарии к таблице rent
COMMENT ON TABLE "rent" IS 'Таблица аренды товаров';
COMMENT ON COLUMN "rent"."idRent" IS 'Уникальный идентификатор аренды';
COMMENT ON COLUMN "rent"."idUser" IS 'ID арендатора (ссылка на user)';
COMMENT ON COLUMN "rent"."idProduct" IS 'ID арендуемого товара (ссылка на product)';
COMMENT ON COLUMN "rent"."status" IS 'Статус аренды (pending, active, completed, cancelled, declined)';
COMMENT ON COLUMN "rent"."dataStart" IS 'Дата начала аренды';
COMMENT ON COLUMN "rent"."dataEnd" IS 'Дата окончания аренды';
COMMENT ON COLUMN "rent"."isreview" IS 'Флаг возможности оставить отзыв (true - можно, false - уже оставлен)';

-- =====================================================
-- ТАБЛИЦА 4: REVIEW (Отзывы)
-- =====================================================
CREATE TABLE IF NOT EXISTS "review" (
    "idReview" SERIAL PRIMARY KEY,
    "idUser" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "rate" DECIMAL(3,2) NOT NULL CHECK ("rate" >= 1.0 AND "rate" <= 5.0),
    "comment" TEXT,
    "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("idUser") REFERENCES "user"("idUser") ON DELETE CASCADE,
    FOREIGN KEY ("idProduct") REFERENCES "product"("idProduct") ON DELETE CASCADE
);

-- Комментарии к таблице review
COMMENT ON TABLE "review" IS 'Таблица отзывов о товарах';
COMMENT ON COLUMN "review"."idReview" IS 'Уникальный идентификатор отзыва';
COMMENT ON COLUMN "review"."idUser" IS 'ID пользователя, оставившего отзыв (ссылка на user)';
COMMENT ON COLUMN "review"."idProduct" IS 'ID товара, на который оставлен отзыв (ссылка на product)';
COMMENT ON COLUMN "review"."rate" IS 'Оценка от 1.0 до 5.0';
COMMENT ON COLUMN "review"."comment" IS 'Текстовый комментарий к отзыву';
COMMENT ON COLUMN "review"."uploadDate" IS 'Дата и время создания отзыва';

-- =====================================================
-- ТАБЛИЦА 5: FAVOURITE (Избранное)
-- =====================================================
CREATE TABLE IF NOT EXISTS "favourite" (
    "idFavourite" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "user"("idUser") ON DELETE CASCADE,
    FOREIGN KEY ("idProduct") REFERENCES "product"("idProduct") ON DELETE CASCADE,
    UNIQUE("userId", "idProduct") -- Пользователь может добавить товар в избранное только один раз
);

-- Комментарии к таблице favourite
COMMENT ON TABLE "favourite" IS 'Таблица избранных товаров пользователей';
COMMENT ON COLUMN "favourite"."idFavourite" IS 'Уникальный идентификатор записи избранного';
COMMENT ON COLUMN "favourite"."userId" IS 'ID пользователя (ссылка на user)';
COMMENT ON COLUMN "favourite"."idProduct" IS 'ID товара в избранном (ссылка на product)';

-- =====================================================
-- ТАБЛИЦА 6: NOTIFICATION (Уведомления)
-- =====================================================
CREATE TABLE IF NOT EXISTS "notification" (
    "idNotification" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    "relatedId" INTEGER NOT NULL, -- ID аренды (idRent)
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "user"("idUser") ON DELETE CASCADE
);

-- Комментарии к таблице notification
COMMENT ON TABLE "notification" IS 'Таблица уведомлений пользователей';
COMMENT ON COLUMN "notification"."idNotification" IS 'Уникальный идентификатор уведомления';
COMMENT ON COLUMN "notification"."userId" IS 'ID пользователя, которому предназначено уведомление (ссылка на user)';
COMMENT ON COLUMN "notification"."type" IS 'Тип уведомления (rent_request, rent_accepted, rent_declined)';
COMMENT ON COLUMN "notification"."title" IS 'Заголовок уведомления';
COMMENT ON COLUMN "notification"."message" IS 'Текст уведомления';
COMMENT ON COLUMN "notification"."isRead" IS 'Флаг прочтения уведомления';
COMMENT ON COLUMN "notification"."relatedId" IS 'ID связанной записи (обычно idRent)';
COMMENT ON COLUMN "notification"."createdAt" IS 'Дата и время создания уведомления';

-- =====================================================
-- ИНДЕКСЫ ДЛЯ УЛУЧШЕНИЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для таблицы user
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"("email");
CREATE INDEX IF NOT EXISTS idx_user_phone ON "user"("phone");
CREATE INDEX IF NOT EXISTS idx_user_admin ON "user"("admin");

-- Индексы для таблицы product
CREATE INDEX IF NOT EXISTS idx_product_userid ON "product"("userId");
CREATE INDEX IF NOT EXISTS idx_product_category ON "product"("category");
CREATE INDEX IF NOT EXISTS idx_product_status ON "product"("status");
CREATE INDEX IF NOT EXISTS idx_product_city ON "product"("city");
CREATE INDEX IF NOT EXISTS idx_product_price ON "product"("price");
CREATE INDEX IF NOT EXISTS idx_product_rating ON "product"("rating");
CREATE INDEX IF NOT EXISTS idx_product_dates ON "product"("startdate", "enddate");

-- Индексы для таблицы rent
CREATE INDEX IF NOT EXISTS idx_rent_userid ON "rent"("idUser");
CREATE INDEX IF NOT EXISTS idx_rent_productid ON "rent"("idProduct");
CREATE INDEX IF NOT EXISTS idx_rent_status ON "rent"("status");
CREATE INDEX IF NOT EXISTS idx_rent_dates ON "rent"("dataStart", "dataEnd");
CREATE INDEX IF NOT EXISTS idx_rent_isreview ON "rent"("isreview");

-- Индексы для таблицы review
CREATE INDEX IF NOT EXISTS idx_review_userid ON "review"("idUser");
CREATE INDEX IF NOT EXISTS idx_review_productid ON "review"("idProduct");
CREATE INDEX IF NOT EXISTS idx_review_rate ON "review"("rate");
CREATE INDEX IF NOT EXISTS idx_review_date ON "review"("uploadDate");

-- Индексы для таблицы favourite
CREATE INDEX IF NOT EXISTS idx_favourite_userid ON "favourite"("userId");
CREATE INDEX IF NOT EXISTS idx_favourite_productid ON "favourite"("idProduct");

-- Индексы для таблицы notification
CREATE INDEX IF NOT EXISTS idx_notification_userid ON "notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_type ON "notification"("type");
CREATE INDEX IF NOT EXISTS idx_notification_isread ON "notification"("isRead");
CREATE INDEX IF NOT EXISTS idx_notification_created ON "notification"("createdAt");

-- =====================================================
-- ОГРАНИЧЕНИЯ И ПРОВЕРКИ
-- =====================================================

-- Проверка цены товара (должна быть положительной)
ALTER TABLE "product" ADD CONSTRAINT chk_product_price_positive CHECK ("price" > 0);

-- Проверка рейтинга товара (от 0 до 5)
ALTER TABLE "product" ADD CONSTRAINT chk_product_rating_range CHECK ("rating" >= 0 AND "rating" <= 5);

-- Проверка статуса товара
ALTER TABLE "product" ADD CONSTRAINT chk_product_status CHECK ("status" IN ('available', 'rented', 'deleted', 'unavailable'));

-- Проверка статуса аренды
ALTER TABLE "rent" ADD CONSTRAINT chk_rent_status CHECK ("status" IN ('pending', 'active', 'completed', 'cancelled', 'declined'));

-- Проверка типа уведомления
ALTER TABLE "notification" ADD CONSTRAINT chk_notification_type CHECK ("type" IN ('rent_request', 'rent_accepted', 'rent_declined'));

-- Проверка дат аренды (конец должен быть после начала)
ALTER TABLE "rent" ADD CONSTRAINT chk_rent_dates_valid CHECK ("dataEnd" > "dataStart");

-- Проверка дат доступности товара (конец должен быть после начала)
ALTER TABLE "product" ADD CONSTRAINT chk_product_dates_valid CHECK ("enddate" > "startdate");

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================================

-- Функция для автоматического обновления рейтинга товара
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем рейтинг товара при добавлении/изменении/удалении отзыва
    UPDATE "product" 
    SET "rating" = (
        SELECT COALESCE(AVG("rate"), 0)
        FROM "review" 
        WHERE "idProduct" = COALESCE(NEW."idProduct", OLD."idProduct")
    )
    WHERE "idProduct" = COALESCE(NEW."idProduct", OLD."idProduct");
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления рейтинга товара
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON "review"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- =====================================================
-- ПРИМЕРЫ ДАННЫХ (ОПЦИОНАЛЬНО)
-- =====================================================

-- Вставка тестового администратора (пароль: admin123)
-- INSERT INTO "user" ("name", "secondName", "middleName", "birthday", "phone", "email", "password", "admin") 
-- VALUES ('Администратор', 'Системы', 'Главный', '1990-01-01', '80000000000', 'admin@rentapp.com', '$2b$10$...', true);

-- =====================================================
-- ПРАВА ДОСТУПА (НАСТРОЙТЕ ПОД ВАШИ ПОТРЕБНОСТИ)
-- =====================================================

-- Создание пользователя базы данных (раскомментировать и настроить)
-- CREATE USER rentapp_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE rentapp_db TO rentapp_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rentapp_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rentapp_user;

-- =====================================================
-- ПРОВЕРКА СОЗДАНИЯ ТАБЛИЦ
-- =====================================================

-- Проверка существования всех таблиц
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
AND table_name IN ('user', 'product', 'rent', 'review', 'favourite', 'notification')
ORDER BY table_name;

-- Проверка связей между таблицами
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- КОНЕЦ СКРИПТА
-- =====================================================

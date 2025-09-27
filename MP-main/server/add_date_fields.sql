-- SQL-скрипт для добавления полей startdate и enddate в таблицу product
-- Выполните этот скрипт в вашей базе данных PostgreSQL

-- Проверяем, существуют ли уже поля
DO $$
BEGIN
    -- Добавляем поле startdate, если его нет
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product' AND column_name = 'startdate'
    ) THEN
        ALTER TABLE product ADD COLUMN startdate DATE;
        RAISE NOTICE 'Поле startdate добавлено в таблицу product';
    ELSE
        RAISE NOTICE 'Поле startdate уже существует в таблице product';
    END IF;
    
    -- Добавляем поле enddate, если его нет
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product' AND column_name = 'enddate'
    ) THEN
        ALTER TABLE product ADD COLUMN enddate DATE;
        RAISE NOTICE 'Поле enddate добавлено в таблицу product';
    ELSE
        RAISE NOTICE 'Поле enddate уже существует в таблице product';
    END IF;
END $$;

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'product' 
ORDER BY ordinal_position;

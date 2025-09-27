import React, { useState, useEffect, useMemo } from 'react';
import './RatingModal.css';
import { ProductRatingModal } from './ProductRatingModal';
import { Pagination } from './Pagination';
import { rentService } from '../services/rentService';
import { useAuth } from '../contexts/AuthContext';

export const RatingModal = ({ onClose, animated = true }) => {
    const { user } = useAuth();
    
    // Состояние для хранения рейтинга каждого товара
    const [ratings, setRatings] = useState({});
    // Состояние для временного отображения рейтинга при наведении
    const [hoverRatings, setHoverRatings] = useState({});
    // Состояние для управления ProductRatingModal
    const [showProductRating, setShowProductRating] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Состояние для анимации закрытия
    const [isClosing, setIsClosing] = useState(false);
    
    // Состояние для загрузки данных
    const [pendingItems, setPendingItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Состояние для пагинации
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // 2 ряда по 3 товара (3 колонки в CSS)
    
    // Проверяем, есть ли ожидающие оценки товары
    const hasPendingRatings = pendingItems.length > 0;
    
    // Логика пагинации
    const totalPages = Math.ceil(pendingItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = useMemo(() => {
        const result = pendingItems.slice(startIndex, endIndex);
        console.log('🔍 RatingModal - вычисляем currentItems:', {
            pendingItemsLength: pendingItems.length,
            startIndex,
            endIndex,
            resultLength: result.length,
            result: result.map(item => item.title)
        });
        return result;
    }, [pendingItems, startIndex, endIndex, currentPage]);
    
    // Отладочная информация
    console.log('🔍 RatingModal пагинация:', {
        totalItems: pendingItems.length,
        itemsPerPage,
        totalPages,
        currentPage,
        startIndex,
        endIndex,
        currentItemsCount: currentItems.length,
        currentItems: currentItems.map(item => item.title),
        sliceResult: pendingItems.slice(startIndex, endIndex).map(item => item.title)
    });
    
    // Сброс на первую страницу при изменении количества товаров
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            console.log('🔍 RatingModal - сбрасываем страницу с', currentPage, 'на 1, totalPages:', totalPages);
            setCurrentPage(1);
        }
    }, [pendingItems.length, totalPages]); // Убираем currentPage из зависимостей, чтобы избежать бесконечного цикла
    
    const handlePageChange = (page) => {
        console.log('🔍 RatingModal - переключение страницы с', currentPage, 'на', page);
        setCurrentPage(page);
    };
    
    // Отслеживаем изменения currentItems
    useEffect(() => {
        console.log('🔍 RatingModal - currentItems обновлен:', {
            currentPage,
            currentItemsCount: currentItems.length,
            currentItems: currentItems.map(item => item.title)
        });
    }, [currentItems, currentPage]);

    // Загрузка объявлений готовых для отзыва
    useEffect(() => {
        const loadReadyForReview = async () => {
            if (!user) return;
            
            try {
                setIsLoading(true);
                setError(null);
                
                const response = await rentService.getReadyForReview();
                
                if (response && response.products && Array.isArray(response.products)) {
                    // Преобразуем данные для отображения
                    const adaptedItems = response.products.map(product => ({
                        id: product.idProduct || product.id || 0, // Используем idProduct из бэкенда
                        image: product.photo || product.image || '/default-product.jpg', // Используем photo из бэкенда
                        title: product.name || product.title || 'Без названия', // Используем name из бэкенда
                        currentRating: 0
                    }));
                    
                    console.log('🔍 RatingModal - адаптированные товары:', adaptedItems);
                    setPendingItems(adaptedItems);
                    setCurrentPage(1); // Сбрасываем на первую страницу при загрузке новых данных
                } else {
                    console.log('🔍 RatingModal - нет товаров для отзыва');
                    setPendingItems([]);
                    setCurrentPage(1); // Сбрасываем на первую страницу
                }
            } catch (error) {
                console.error('Ошибка при загрузке объявлений готовых для отзыва:', error);
                setError('Не удалось загрузить объявления');
                setPendingItems([]);
                setCurrentPage(1); // Сбрасываем на первую страницу при ошибке
            } finally {
                setIsLoading(false);
            }
        };

        loadReadyForReview();
    }, [user]);

    // Обработчик изменения рейтинга при клике
    const handleRatingChange = (itemId, rating) => {
        // Находим выбранный товар
        const product = currentItems.find(item => item.id === itemId);
        if (product && product.id && product.image && product.title) {
            setSelectedProduct({
                id: product.id, // Это уже idProduct из бэкенда
                photo: product.image, // Это уже photo из бэкенда
                name: product.title // Это уже name из бэкенда
            });
            // Передаем выбранное количество звезд
            setRatings(prev => ({
                ...prev,
                [itemId]: rating
            }));
            setShowProductRating(true);
        } else {
            console.error('🔍 RatingModal - неполные данные товара:', product);
        }
    };

    // Обработчик успешного создания отзыва
    const handleReviewSubmitted = () => {
        if (selectedProduct && selectedProduct.id) {
            // Убираем товар из списка готовых для отзыва
            setPendingItems(prev => prev.filter(item => item.id !== selectedProduct.id));
            console.log('🔍 RatingModal - товар удален из списка после отзыва:', selectedProduct.id);
        }
        // Сбрасываем выбранный товар
        setSelectedProduct(null);
        // Закрываем модальное окно
        setShowProductRating(false);
    };

    // Обработчик наведения на звезду
    const handleStarHover = (itemId, rating) => {
        setHoverRatings(prev => ({
            ...prev,
            [itemId]: rating
        }));
    };

    // Обработчик убирания курсора с блока звезд
    const handleStarLeave = (itemId) => {
        if (itemId) {
            setHoverRatings(prev => ({
                ...prev,
                [itemId]: 0
            }));
        }
    };

    // Функция для отображения звезд
    const renderStars = (itemId) => {
        if (!itemId) return null;
        
        const currentRating = ratings[itemId] || 0;
        const hoverRating = hoverRatings[itemId] || 0;
        const displayRating = hoverRating > 0 ? hoverRating : currentRating;
        
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <img 
                    key={i} 
                    src="/StarSharp.svg" 
                    alt={`Звезда ${i}`} 
                    className={`star-rating ${i <= displayRating ? 'star-active' : ''}`}
                    onMouseEnter={() => handleStarHover(itemId, i)}
                    onClick={() => handleRatingChange(itemId, i)}
                />
            );
        }
        return stars;
    };

    // Функция для обрезки текста до 2 строк
    const truncateText = (text, maxLength = 80) => {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Функции для управления ProductRatingModal
    const handleCloseProductRating = () => {
        setShowProductRating(false);
        setSelectedProduct(null);
    };

    // Функция для анимации закрытия основного модального окна
    const handleCloseWithAnimation = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 350); // Время анимации закрытия
    };

    const handleBackToRatingModal = () => {
        setShowProductRating(false);
        setSelectedProduct(null);
    };



    return (
        <>
            <div
                className="fixed top-0 left-0 w-full h-full bg-black/40 z-50 flex justify-center items-center"
                onClick={handleCloseWithAnimation}
            >
                <div
                    className={`bg-white border-2 rounded-[17px] relative ${isClosing ? 'rating-modal-hide' : 'rating-modal-animate'}`}
                    style={{ borderColor: '#504e4a' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Заголовок */}
                    <div className="text-center py-8" style={{ paddingTop: '60px' }}>
                        <h2 className="text-[30px] font-medium text-[#53515E] font-weight-500">
                            Что хотите оценить?
                        </h2>
                    </div>

                    {/* Разделяющая полоса - только если нет товаров для оценки */}
                    {!hasPendingRatings && <div className="separator-line"></div>}

                    {/* Содержимое */}
                    <div className="content-area">
                        {isLoading ? (
                            <div className="no-ratings-content">
                                <h3 className="no-ratings-title">
                                    Загрузка...
                                </h3>
                                <p className="no-ratings-description">
                                    Загружаем объявления готовые для отзыва
                                </p>
                            </div>
                        ) : error ? (
                            <div className="no-ratings-content">
                                <h3 className="no-ratings-title">
                                    Ошибка загрузки
                                </h3>
                                <p className="no-ratings-description">
                                    {error}
                                </p>
                            </div>
                        ) : !hasPendingRatings ? (
                            <div className="no-ratings-content w-[440px] mx-auto">
                                <h3 className="no-ratings-title">
                                    Упс! Здесь ничего нет
                                </h3>
                                <p className="no-ratings-description">
                                    Новых товаров на оценку еще нет, но это легко исправить, закажите что-нибудь из нашего каталога.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="ratings-grid">
                                    {currentItems.map((item) => (
                                    <div key={item.id} className="rating-item">
                                        <div className="item-image">
                                            <img 
                                                src={item.image || '/default-product.jpg'} 
                                                alt={item.title || 'Товар'} 
                                                onError={(e) => {
                                                    e.target.src = '/default-product.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="item-stars" onMouseLeave={() => handleStarLeave(item.id)}>
                                            {renderStars(item.id)}
                                        </div>
                                        <div className="item-description">
                                            {truncateText(item.title)}
                                        </div>
                                    </div>
                                ))}
                                </div>
                                
                                {/* Пагинация */}
                                {totalPages > 1 && (
                                    <div style={{ marginTop: '-3    5px', display: 'flex', justifyContent: 'center' }}>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            itemsPerPage={itemsPerPage}
                                            totalItems={pendingItems.length}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Кнопка закрытия */}
                    <button
                        onClick={handleCloseWithAnimation}
                        className="absolute top-4 right-4 text-[#53515E] hover:text-black"
                    >
                        <img src="/close_icon.svg" className="cursor-pointer w-[40px]" alt="Закрыть" />
                    </button>
                </div>
            </div>

            {/* ProductRatingModal */}
            <ProductRatingModal
                isOpen={showProductRating}
                onClose={handleCloseProductRating}
                onBack={handleBackToRatingModal}
                onCloseMain={handleCloseWithAnimation}
                product={selectedProduct}
                onSubmit={handleReviewSubmitted}
                initialData={{ 
                    stars: selectedProduct ? (ratings[selectedProduct.id] || 5) : 5, 
                    comment: '' 
                }}
            />
        </>
    );
};

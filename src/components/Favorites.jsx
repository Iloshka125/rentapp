import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Pagination } from './Pagination';
import { favouriteService } from '../services/favouriteService';
import { useAuth } from '../contexts/AuthContext';
import { getUploadUrl } from '../config/config';
import { useAlertContext } from '../contexts/AlertContext';

export const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 8; // Количество товаров на странице (2 ряда по 4 карточки)
    const { user } = useAuth();
    const { showSuccess, showError, showInfo } = useAlertContext();

    // Загружаем избранное из БД при монтировании компонента
    useEffect(() => {
        if (user) {
            loadFavourites();
        }
    }, [user]);

    const loadFavourites = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await favouriteService.getUserFavourites();
            
            if (response && response.products) {
                // Преобразуем данные из БД в формат, ожидаемый ProductCard
                const adaptedFavourites = response.products.map(product => {
                    return {
                        id: product.idProduct,
                        title: product.name,
                        image: product.photo ? getUploadUrl(product.photo) : '/default-image.jpg',
                        price: `от ${product.price} ₽`,
                        rating: product.reviewsCount === 0 ? 'Нет отзывов' : `★ ${(product.rating || 4.0).toFixed(1)}`,
                        reviewsCount: product.reviewsCount || 0, // Добавляем количество отзывов
                        category: product.category,
                        titleClass: 'text-xl',
                        priceClass: 'text-2xl',
                        ratingClass: 'text-xl'
                    };
                });
                
                setFavorites(adaptedFavourites);
                
            } else {
                setFavorites([]);
                showInfo('В избранном пока нет товаров');
            }
        } catch (error) {
            console.error('Ошибка при загрузке избранного:', error);
            setError('Не удалось загрузить избранное: ' + error.message);
            showError('Не удалось загрузить избранное');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция для удаления товара из избранного
    const removeFromFavorites = async (productId) => {
        try {
            await favouriteService.removeFromFavourites(productId);
            // Обновляем локальное состояние
            const updatedFavorites = favorites.filter(product => product.id !== productId);
            setFavorites(updatedFavorites);
            showSuccess('Товар удален из избранного');
        } catch (error) {
            console.error('Ошибка при удалении из избранного:', error);

        }
    };

    // Функция для обновления состояния избранного (вызывается из ProductCard)
    const updateFavoriteStatus = (productId, isFavorite) => {
        if (!isFavorite) {
            removeFromFavorites(productId);
        }
    };

    // Логика пагинации
    const totalPages = Math.ceil(favorites.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFavorites = favorites.slice(startIndex, endIndex);
    
    // Отладочная информация
    console.log('🔍 Favorites пагинация:', {
        totalFavorites: favorites.length,
        itemsPerPage,
        totalPages,
        currentPage,
        startIndex,
        endIndex,
        currentFavoritesCount: currentFavorites.length
    });

    // Сброс на первую страницу при изменении количества избранного
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [favorites.length, currentPage, totalPages]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        
    };

    // Показываем загрузку
    if (isLoading) {
        return (
            <div className="border_pd flex flex-col items-center" style={{ position: 'absolute', left: '459px', top: '151px' }}>
                <div className='data' style={{ width: '100%' }}>
                    <p className='editing_text' style={{ textAlign: 'center', marginBottom: 50 }}>Избранное</p>
                    <div className="flex justify-center items-center py-20">
                        <div className="text-[#53515E] text-xl">Загрузка избранного...</div>
                    </div>
                </div>
            </div>
        );
    }

    // Показываем ошибку
    if (error) {
        return (
            <div className="border_pd flex flex-col items-center" style={{ position: 'absolute', left: '459px', top: '151px' }}>
                <div className='data' style={{ width: '100%' }}>
                    <p className='editing_text' style={{ textAlign: 'center', marginBottom: 50 }}>Избранное</p>
                    <div className="flex justify-center items-center py-20">
                        <div className="text-red-500 text-xl">{error}</div>
                        <button 
                            onClick={loadFavourites}
                            className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
                        >
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Если нет избранных товаров
    if (favorites.length === 0) {
        return (
            <div className="border_pd flex flex-col items-center" style={{ position: 'absolute', left: '459px', top: '151px' }}>
                <div className='data' style={{ width: '100%' }}>
                    <p className='editing_text' style={{ textAlign: 'center', marginBottom: 50 }}>Избранное</p>
                    
                    {/* Разделительная черта */}
                    <div className="separator-menu" style={{ marginBottom: 40, width: '79.5%' }}></div>
                    
                    <div style={{ width: "78.5%", margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="text-left">
                            <h3 className="text-[20px] font-medium text-[#53515E] mb-4">Сохраняйте объявления</h3>
                            <p className="text-[30px] text-[#53515E] leading-relaxed">
                                Если вы нашли что-то интересное, нажмите «Добавить в избранное» в объявлении или на сердечко в результатах поиска.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border_pd flex flex-col items-center" style={{ position: 'absolute', left: '459px', top: '151px' }}>
            <div className='data' style={{ width: '100%' }}>
                <p className='editing_text' style={{ textAlign: 'center', marginBottom: 40 }}>Избранное</p>
                <div style={{ width: '100%', maxWidth: '1300px', margin: '0 auto' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 p-4">
                        {currentFavorites.map((product) => (
                            <div key={product.id} className="relative">
                                <ProductCard 
                                    product={{
                                        ...product,
                                        titleClass: 'text-xl',
                                        priceClass: 'text-2xl',
                                        ratingClass: 'text-xl',
                                        isFavorite: true, // Передаем флаг, что товар уже в избранном
                                        onFavoriteToggle: updateFavoriteStatus, // Передаем функцию для обновления состояния
                                        cardClass: 'favorites-card' // Добавляем специальный класс для избранного
                                    }} 
                                />
                            </div>
                        ))}
                    </div>
                    
                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={favorites.length}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

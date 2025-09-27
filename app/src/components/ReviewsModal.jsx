import React, { useState, useEffect } from 'react';
import './ReviewsModal.css';
import { Pagination } from './Pagination';
import { useAuth } from '../contexts/AuthContext';
import { reviewService } from '../services/reviewService';

export const ReviewsModal = ({ onClose, animated = true, userData = null }) => {
    const { user } = useAuth();
    const [reviewsData, setReviewsData] = useState({
        rating: 4.0,
        totalReviews: 0,
        reviews: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewsType, setReviewsType] = useState('written'); // 'written' или 'about'
    
    // Состояние для пагинации
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Количество отзывов на страницу
    
    // Логика пагинации
    const totalPages = Math.ceil(reviewsData.reviews.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReviews = reviewsData.reviews.slice(startIndex, endIndex);
    
    // Сброс на первую страницу при изменении количества отзывов
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [reviewsData.reviews.length, currentPage, totalPages]);
    
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Загрузка отзывов пользователя
    const loadReviews = async () => {
        if (!user || !user.id) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            let reviewsArray = [];
            let totalRating = 4.0;
            let totalReviews = 0;
            
            // Если передан userData (открытие из SideBar или уведомлений), загружаем отзывы о пользователе
            if (userData) {
                console.log('🔍 ReviewsModal - открытие из SideBar/уведомлений, загружаем отзывы о пользователе:', userData);
                console.log('🔍 ReviewsModal - userData.idUser:', userData.idUser);
                console.log('🔍 ReviewsModal - userData.id:', userData.id);
                console.log('🔍 ReviewsModal - userData.name:', userData.name);
                setReviewsType('about');
                
                try {
                    // Используем ID пользователя из userData, а не текущего пользователя
                    const userId = userData.idUser || userData.id;
                    console.log('🔍 ReviewsModal - загружаем отзывы о пользователе с ID:', userId);
                    
                    if (!userId) {
                        console.error('🔍 ReviewsModal - НЕ НАЙДЕН ID пользователя в userData!');
                        console.error('🔍 ReviewsModal - userData:', userData);
                        return;
                    }
                    
                    const aboutUserResponse = await reviewService.getReviewsAboutUser(userId);
                    console.log('🔍 ReviewsModal - getReviewsAboutUser response:', aboutUserResponse);
                    console.log('🔍 ReviewsModal - aboutUserResponse тип:', typeof aboutUserResponse);
                    console.log('🔍 ReviewsModal - aboutUserResponse массив?', Array.isArray(aboutUserResponse));
                    
                    if (Array.isArray(aboutUserResponse)) {
                        reviewsArray = aboutUserResponse;
                        totalReviews = reviewsArray.length;
                        console.log('🔍 ReviewsModal - найдено отзывов:', totalReviews);
                        
                        if (reviewsArray.length > 0) {
                            // Рассчитываем средний рейтинг из отзывов о пользователе
                            const sumRating = reviewsArray.reduce((sum, review) => sum + review.rate, 0);
                            totalRating = sumRating / reviewsArray.length;
                            console.log('🔍 ReviewsModal - рассчитанный рейтинг:', totalRating);
                        }
                    } else {
                        console.error('🔍 ReviewsModal - getReviewsAboutUser вернул не массив:', aboutUserResponse);
                    }
                } catch (error) {
                    console.error('🔍 ReviewsModal - Ошибка при загрузке отзывов о пользователе:', error);
                    console.error('🔍 ReviewsModal - Детали ошибки:', error.message, error.stack);
                }
            } else {
                // Если userData не передан (открытие из других мест), сначала пытаемся получить отзывы, которые написал пользователь
                console.log('🔍 ReviewsModal - открытие из других мест, загружаем написанные отзывы');
                
                const userReviewsResponse = await reviewService.getUserReviews(user.id);
                console.log('🔍 ReviewsModal - getUserReviews response:', userReviewsResponse);
                
                if (Array.isArray(userReviewsResponse)) {
                    reviewsArray = userReviewsResponse;
                    totalReviews = reviewsArray.length;
                    
                    if (reviewsArray.length > 0) {
                        // Рассчитываем средний рейтинг
                        const sumRating = reviewsArray.reduce((sum, review) => sum + review.rate, 0);
                        totalRating = sumRating / reviewsArray.length;
                    }
                } else if (userReviewsResponse && userReviewsResponse.reviews && Array.isArray(userReviewsResponse.reviews)) {
                    reviewsArray = userReviewsResponse.reviews;
                    totalReviews = reviewsArray.length;
                    
                    if (reviewsArray.length > 0) {
                        // Рассчитываем средний рейтинг
                        const sumRating = reviewsArray.reduce((sum, review) => sum + review.rate, 0);
                        totalRating = sumRating / reviewsArray.length;
                    }
                }
                
                console.log('🔍 ReviewsModal - reviewsArray:', reviewsArray);
                
                // Если у пользователя нет написанных отзывов, показываем отзывы о нем
                if (reviewsArray.length === 0) {
                    console.log('🔍 ReviewsModal - Нет написанных отзывов, загружаем отзывы о пользователе');
                    setReviewsType('about');
                    
                    try {
                        const aboutUserResponse = await reviewService.getReviewsAboutUser(user.id);
                        console.log('🔍 ReviewsModal - getReviewsAboutUser response:', aboutUserResponse);
                        
                        if (Array.isArray(aboutUserResponse)) {
                            reviewsArray = aboutUserResponse;
                            totalReviews = reviewsArray.length;
                            
                            if (reviewsArray.length > 0) {
                                // Для отзывов о пользователе используем рейтинг 4.0 (по умолчанию)
                                totalRating = 4.0;
                            }
                        }
                    } catch (error) {
                        console.log('🔍 ReviewsModal - Ошибка при загрузке отзывов о пользователе:', error);
                    }
                } else {
                    setReviewsType('written');
                }
            }
            
            setReviewsData({
                rating: totalRating,
                totalReviews: totalReviews,
                reviews: reviewsArray
            });
        } catch (error) {
            console.error('❌ Ошибка при загрузке отзывов:', error);
            setError('Не удалось загрузить отзывы');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция удаления отзыва
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            return;
        }
        
        try {
            await reviewService.deleteReview(reviewId);
            window.showAlert('Отзыв успешно удален', 'success');
            // Перезагружаем отзывы
            loadReviews();
        } catch (error) {
            console.error('Ошибка при удалении отзыва:', error);
            window.showAlert('Не удалось удалить отзыв', 'error');
        }
    };

    // Загружаем отзывы при монтировании компонента
    useEffect(() => {
        console.log('🔍 ReviewsModal - useEffect, userData:', userData);
        loadReviews();
    }, [userData]);

    // Функция для отображения звезд
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <img 
                    key={`full-${i}`} 
                    src="/StarSharp.svg" 
                    alt="Звезда" 
                    className="star-icon"
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <img 
                    key="half" 
                    src="/StarSharp.svg" 
                    alt="Половина звезды" 
                    className="star-icon half-star"
                />
            );
        }

        const emptyStars = 5 - Math.floor(rating) - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <div key={`empty-${i}`} className="star-icon empty-star"></div>
            );
        }

        return stars;
    };

    // Функция для отображения звезд пользователя
    const renderUserStars = (userRating) => {
        const stars = [];
        const fullStars = Math.floor(userRating);
        const hasHalfStar = userRating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <img 
                        key={i} 
                        src="/StarSharp.svg" 
                        alt="Звезда" 
                        className="user-star-icon"
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <img 
                        key={i} 
                        src="/StarSharp.svg" 
                        alt="Половина звезды" 
                        className="user-star-icon half-star"
                    />
                );
            } else {
                stars.push(
                    <div key={i} className="user-star-icon empty-star"></div>
                );
            }
        }
        return stars;
    };

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/40 z-50 flex justify-center items-center"
            onClick={onClose}
            
        >
            <div
                className={`bg-white border-2 rounded-[17px] relative w-[800px] max-h-[80vh] overflow-y-auto reviews-modal-animate${animated ? '' : ' reviews-modal-hide'}`}
                style={{ borderColor: '#504e4a' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок и кнопка закрытия */}
                <div className="flex justify-between items-center p-8">
                    <h2 className="text-[40px] font-medium text-[#53515E]">
                        {userData 
                            ? `Отзывы о ${userData.name || 'пользователе'}`
                            : reviewsType === 'written' 
                                ? 'Мои отзывы' 
                                : 'Отзывы о вас'
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#53515E] hover:text-black"
                    >
                        <img src="/close_icon.svg" className="cursor-pointer w-[40px]" alt="Закрыть" />
                    </button>
                </div>

                {/* Блок с рейтингом */}
                <div className="px-8 pb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {reviewsData.totalReviews === 0 ? (
                                <span className="text-3xl font-medium text-[#666]">Нет отзывов</span>
                            ) : (
                                <>
                                    <span className="text-5xl font-medium text-[#53515E] mr-6">
                                        {reviewsData.rating.toFixed(1)}
                                    </span>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-[20px] text-gray-600 mb-1">
                                            {userData 
                                                ? `на основании ${reviewsData.totalReviews === 1 ? '1 отзыва' : 
                                                               reviewsData.totalReviews < 5 ? `${reviewsData.totalReviews} отзывов` : 
                                                               `${reviewsData.totalReviews} отзывов`}`
                                                : reviewsType === 'written' 
                                                    ? `на основании ${reviewsData.totalReviews === 1 ? '1 отзыва' : 
                                                                   reviewsData.totalReviews < 5 ? `${reviewsData.totalReviews} отзывов` : 
                                                                   `${reviewsData.totalReviews} отзывов`}`
                                                    : `на основании ${reviewsData.totalReviews === 1 ? '1 отзыва' : 
                                                                   reviewsData.totalReviews < 5 ? `${reviewsData.totalReviews} отзывов` : 
                                                                   `${reviewsData.totalReviews} отзывов`}`
                                            }
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {renderStars(reviewsData.rating)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Список отзывов */}
                <div className="px-8 pb-8">
                    {isLoading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-[#53515E] text-xl">Загрузка отзывов...</div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-red-500 text-xl">{error}</div>
                            <button 
                                onClick={loadReviews}
                                className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && reviewsData.reviews.length === 0 && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-[#53515E] text-xl">Пока нет отзывов</div>
                        </div>
                    )}

                    {!isLoading && !error && reviewsData.reviews.length > 0 && (
                        <>
                            {currentReviews.map((review) => (
                            <div key={review.idReview || review.id || review.idReview} className="mb-8 last:mb-0">
                                <div className="flex items-start gap-5">
                                    {/* Аватар */}
                                    <div className="avatar-small">
                                        <span>{(review.product?.name || 'Товар').charAt(0).toUpperCase()}</span>
                                    </div>
                                    
                                    {/* Содержимое отзыва */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1">
                                                
                                                {renderUserStars(review.rate || 0)}
                                            </div>
                                            
                                            
                                        </div>
                                        
                                        <p className="font-medium text-[#53515E] mb-2 text-lg">
                                            {review.product?.name || 'Товар'}
                                        </p>
                                        
                                        <p className="text-gray-700 leading-relaxed text-lg">
                                            {review.comment || 'Без комментария'}
                                        </p>
                                        
                                        
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Пагинация */}
                        {totalPages > 1 && (
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    itemsPerPage={itemsPerPage}
                                    totalItems={reviewsData.reviews.length}
                                />
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

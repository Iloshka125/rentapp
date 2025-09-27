import React from 'react';
import './ReviewsModal.css';
import { Pagination } from './Pagination';
import { reviewService } from '../services/reviewService';

export const ProductReviewsModal = ({ onClose, animated = true, productId, productRating, reviewsCount, onWriteReview }) => {
    const [reviewsData, setReviewsData] = React.useState({
        rating: productRating || 4.0,
        totalReviews: reviewsCount || 0,
        reviews: []
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    // Состояние для пагинации
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5; // Количество отзывов на страницу
    
    // Логика пагинации
    const totalPages = Math.ceil(reviewsData.reviews.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReviews = reviewsData.reviews.slice(startIndex, endIndex);
    
    // Сброс на первую страницу при изменении количества отзывов
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [reviewsData.reviews.length, currentPage, totalPages]);
    
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Загружаем отзывы на продукт
    React.useEffect(() => {
        const loadReviews = async () => {
            if (!productId) return;
            
            try {
                setIsLoading(true);
                setError(null);
                
                const response = await reviewService.getAllByProduct({ idProduct: productId });
                
                if (response && response.reviews) {
                    // Преобразуем данные из БД в нужный формат
                    const adaptedReviews = response.reviews.map(review => ({
                        id: review.idReview,
                        userRating: review.rate,
                        userName: review.user ? 
                            `${review.user.secondName || ''} ${review.user.name || ''}`.trim() || 'Пользователь' : 
                            'Пользователь',
                        comment: review.comment || 'Без комментария'
                    }));
                    
                    setReviewsData({
                        rating: response.stats?.avgRating || productRating || 4.0,
                        totalReviews: response.stats?.countReviews || 0,
                        reviews: adaptedReviews
                    });
                }
            } catch (error) {
                console.error('Ошибка при загрузке отзывов:', error);
                setError('Не удалось загрузить отзывы');
            } finally {
                setIsLoading(false);
            }
        };

        loadReviews();
    }, [productId, productRating, reviewsCount]);

    // Функция для отображения звезд
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <img 
                    key={`main-full-${i}`} 
                    src="/StarSharp.svg" 
                    alt="Звезда" 
                    className="star-icon"
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <img 
                    key="main-half" 
                    src="/StarSharp.svg" 
                    alt="Половина звезды" 
                    className="star-icon half-star"
                />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <div key={`main-empty-${i}`} className="star-icon empty-star"></div>
            );
        }

        return stars;
    };

    // Функция для отображения звезд пользователя
    const renderUserStars = (userRating) => {
        const fullStars = Math.floor(userRating);
        const hasHalfStar = userRating % 1 >= 0.5;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <img 
                    key={`user-full-${i}`} 
                    src="/StarSharp.svg" 
                    alt="Звезда" 
                    className="user-star-icon"
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <img 
                    key="user-half" 
                    src="/StarSharp.svg" 
                    alt="Половина звезды" 
                    className="user-star-icon half-star"
                />
            );
        }

        const emptyStars = 5 - Math.ceil(userRating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <div key={`user-empty-${i}`} className="user-star-icon empty-star"></div>
            );
        }

        return stars;
    };

    const handleWriteReview = () => {
        if (onWriteReview) {
            onWriteReview();
        }
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
                    <div>
                        <h2 className="text-[40px] font-medium text-[#53515E]">Отзывы</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#53515E] hover:text-black"
                    >
                        <img src="/close_icon.svg" className="cursor-pointer w-[40px]" alt="Закрыть" />
                    </button>
                </div>

                {/* Блок с рейтингом и кнопкой "написать отзыв" */}
                <div className="px-8 pb-8">
                    <div className="flex items-center justify-between">
                        {/* Левый блок с рейтингом */}
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
                                            {`на основании ${reviewsData.totalReviews} ${reviewsData.totalReviews === 1 ? 'оценки' : 
                                             reviewsData.totalReviews > 1 && reviewsData.totalReviews < 5 ? 'оценок' : 
                                             'оценок'}`}
                                        </p>
                                        <div className="flex gap-1">
                                            {renderStars(reviewsData.rating)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Правая кнопка "написать отзыв" */}
                        <button
                            onClick={handleWriteReview}
                            className="save_but"
                            style={{ 
                                width: 200, 
                                height: 50, 
                                alignSelf: 'center',
                                margin: 0
                            }}
                        >
                            написать отзыв
                        </button>
                    </div>
                </div>

                {/* Список отзывов */}
                <div className="px-8 pb-8">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="text-[#53515E] text-xl">Загрузка отзывов...</div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-500 text-xl">{error}</div>
                        </div>
                    ) : reviewsData.reviews.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-[#666] text-xl">Пока нет отзывов на это объявление</div>
                        </div>
                    ) : (
                        reviewsData.reviews.map((review) => (
                            <div key={review.id} className="mb-8 last:mb-0">
                                <div className="flex items-start gap-5">
                                    {/* Аватар */}
                                    <div className="avatar-small">
                                        <span>{review.userName.split(' ').map(n => n[0]).join('')}</span>
                                    </div>
                                    
                                    {/* Содержимое отзыва */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            
                                            {renderUserStars(review.userRating)}
                                        </div>
                                        <p className="font-medium text-[#53515E] mb-3 text-lg">
                                            {review.userName}
                                        </p>
                                        <p className="text-gray-700 leading-relaxed text-lg" style={{
                                            wordWrap: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            width: '100%'
                                        }}>
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

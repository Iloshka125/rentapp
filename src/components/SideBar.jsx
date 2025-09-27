import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReviewsModal } from './ReviewsModal';
import { useAuth } from '../contexts/AuthContext';
import { reviewService } from '../services/reviewService';
import { notificationService } from '../services/notificationService';
import { useAlertContext } from '../contexts/AlertContext';

export const SideBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const { showSuccess, showError, showInfo } = useAlertContext();
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [showReviewsModalAnimated, setShowReviewsModalAnimated] = useState(false);
    const [userRating, setUserRating] = useState(5.0);
    const [reviewsCount, setReviewsCount] = useState(0);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [notificationsCount, setNotificationsCount] = useState(0);

    const menuItems = [
        { label: 'Личные данные', path: '/profile' },
        { label: 'Уведомления', path: '/profile/notifications' },
        { label: 'Избранное', path: '/profile/favorites' },
        { label: 'Мои\nобъявления', path: '/profile/my-ads' },
        { label: 'Заказы', path: '/profile/orders' },
        { label: 'Мои отзывы', path: '/profile/reviews' },
        { label: 'Безопасность', path: '/profile/security' },
        { label: 'Разместить\nобъявление', path: '/publication' },
    ];

    const getActiveItem = () => {
        const currentItem = menuItems.find(item => item.path === location.pathname);
        return currentItem ? currentItem.label : 'Личные данные';
    };

    const [activeItem, setActiveItem] = useState(getActiveItem());

    useEffect(() => {
        setActiveItem(getActiveItem());
    }, [location.pathname]);

    const handleOpenReviews = () => {
        
        setShowReviewsModal(true);
        setTimeout(() => setShowReviewsModalAnimated(true), 10);
    };

    const handleCloseReviews = () => {
        setShowReviewsModalAnimated(false);
        setTimeout(() => setShowReviewsModal(false), 350);
    };

    const handleLogout = () => {
        
        logout();
        navigate('/');
    };

    // Загрузка статистики пользователя (рейтинг и количество отзывов)
    const loadUserStats = async () => {
        if (!user || !user.id) return;
        
        try {
            setIsLoadingStats(true);
    
            // Получаем отзывы О пользователе (кто писал отзывы о его продуктах)
            const reviews = await reviewService.getReviewsAboutUser(user.id);
            console.log('🔍 SideBar - getReviewsAboutUser response:', reviews);
            console.log('🔍 SideBar - user.id:', user.id);
            
            if (Array.isArray(reviews)) {
                setReviewsCount(reviews.length);
                console.log('🔍 SideBar - reviewsCount set to:', reviews.length);
                
                if (reviews.length > 0) {
                    // Рассчитываем средний рейтинг
                    const totalRating = reviews.reduce((sum, review) => sum + review.rate, 0);
                    const averageRating = totalRating / reviews.length;
                    setUserRating(averageRating);
                    console.log('🔍 SideBar - userRating set to:', averageRating);
                } else {
                    // Если отзывов нет, ставим 4.0
                    setUserRating(4.0);
                }
            } else {
                console.error('❌ API вернул не массив отзывов:', reviews);
                setUserRating(4.0);
                setReviewsCount(0);
            }
            
            // Также проверим, есть ли у пользователя написанные отзывы
            try {
                const userReviews = await reviewService.getUserReviews(user.id);
                console.log('🔍 SideBar - getUserReviews response:', userReviews);
                if (Array.isArray(userReviews)) {
                    console.log('🔍 SideBar - user has written reviews:', userReviews.length);
                }
            } catch (error) {
                console.log('🔍 SideBar - getUserReviews error:', error);
            }
            
            // Загружаем количество непрочитанных уведомлений
            try {
                console.log('🔍 SideBar - загружаем уведомления для пользователя:', user.id);
                const notificationsResponse = await notificationService.getOwnerNotifications();
                console.log('🔍 SideBar - notifications response:', notificationsResponse);
                console.log('🔍 SideBar - notifications response type:', typeof notificationsResponse);
                
                if (notificationsResponse && notificationsResponse.notifications) {
                    const unreadCount = notificationsResponse.notifications.length;
                    console.log('🔍 SideBar - найдено уведомлений:', unreadCount);
                    console.log('🔍 SideBar - уведомления:', notificationsResponse.notifications);
                    setNotificationsCount(unreadCount);
                    console.log('🔍 SideBar - notificationsCount установлен в:', unreadCount);
                } else {
                    console.log('🔍 SideBar - нет уведомлений или неправильная структура');
                    setNotificationsCount(0);
                }
            } catch (error) {
                console.error('🔍 SideBar - ошибка загрузки уведомлений:', error);
                setNotificationsCount(0);
            }
            
        } catch (error) {
            console.error('❌ Ошибка при загрузке статистики пользователя:', error);
            // В случае ошибки ставим значения по умолчанию
            setUserRating(4.0);
            setReviewsCount(0);
            setNotificationsCount(0);
        } finally {
            setIsLoadingStats(false);
        }
    };

    // Функция для обновления счетчика уведомлений (можно вызывать извне)
    const updateNotificationsCount = async () => {
        if (!user || !user.id) return;
        
        try {
            console.log('🔍 SideBar - updateNotificationsCount вызван');
            const notificationsResponse = await notificationService.getOwnerNotifications();
            console.log('🔍 SideBar - updateNotificationsCount response:', notificationsResponse);
            
            if (notificationsResponse && notificationsResponse.notifications) {
                const unreadCount = notificationsResponse.notifications.length;
                console.log('🔍 SideBar - updateNotificationsCount unreadCount:', unreadCount);
                setNotificationsCount(unreadCount);
            } else {
                console.log('🔍 SideBar - updateNotificationsCount нет уведомлений');
                setNotificationsCount(0);
            }
        } catch (error) {
            console.error('🔍 SideBar - updateNotificationsCount error:', error);
            setNotificationsCount(0);
        }
    };

    // Загружаем статистику при монтировании компонента и при изменении пользователя
    useEffect(() => {
        loadUserStats();
    }, [user]);
    
    // Обновляем уведомления каждые 30 секунд
    useEffect(() => {
        if (!user) return;
        
        const interval = setInterval(() => {
            updateNotificationsCount();
        }, 30000); // 30 секунд
        
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className='h-[1096px] w-[271px]' style={{marginTop: '31px'}}>
            <div className="sidebar">
                <div className="user-info">
                    <div className="avatar">
                        <span>{user ? 
                            (user.secondName && user.name ? 
                                `${user.secondName[0]}${user.name[0]}`.toUpperCase() : 
                                user.name ? user.name[0].toUpperCase() : 'П'
                            ) : 'П'}</span>
                    </div>
                    <div className="details">
                        <p className="name">{user ? 
                            (user.secondName && user.name ? 
                                `${user.secondName} ${user.name}` : 
                                user.name || 'Пользователь'
                            ) : 'Пользователь'}</p>
                        <div className='rating' onClick={handleOpenReviews} style={{marginLeft: '-5px' }}>
                            {isLoadingStats ? (
                                <p>Загрузка...</p>
                            ) : reviewsCount === 0 ? (
                                <p style={{ fontSize: '16px', color: '#666' }}>Нет отзывов</p>
                            ) : (
                                <>
                                    <p>{userRating.toFixed(1)}</p>
                                    <img 
                                        src="/StarSharp.svg" 
                                        alt="Звезда" 
                                        style={{ 
                                            width: '32px', 
                                            height: '32px',
                                            margin: '0 8px'
                                        }}
                                    />
                                    <p>{reviewsCount === 1 ? '1 отзыв' : 
                                         reviewsCount < 5 ? `${reviewsCount} отзыва` : 
                                         `${reviewsCount} отзывов`}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="separator"></div>
                </div>
                <ul className="menu">
                    {menuItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <li
                                className={`menu-item ${activeItem === item.label ? 'active' : ''} ${
                                    item.label === 'Разместить\nобъявление' ? 'menu-item-bold' : ''
                                }`}
                                onClick={() => {
                                    setActiveItem(item.label);
                                    
                                    navigate(item.path);
                                }}
                                style={{ position: 'relative' }}
                            >
                                {item.label}
                                {/* Индикатор уведомлений */}
                                {item.label === 'Уведомления' && notificationsCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '15px',
                                        backgroundColor: '#ff4757',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '25px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '20px'
                                    }}>
                                        {notificationsCount > 99 ? '99+' : notificationsCount}
                                    </span>
                                )}
                            </li>
                            {item.label === 'Безопасность' && (
                                <div className="separator-menu"></div>
                            )}
                        </React.Fragment>
                    ))}
                </ul>
                
                {/* Кнопка выхода */}
                <div className="separator-menu"></div>
                <button
                    onClick={handleLogout}
                    className="menu-item menu-item-logout"
                    style={{
                        color: '#d2514b',
                        border: '2px solid #d2514b',
                        borderRadius: '17px',
                        padding: '12px 20px',
                        margin: '20px',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: 'calc(100% - 40px)',
                        fontSize: '18px',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d2514b';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#d2514b';
                    }}
                >
                    Выйти из аккаунта
                </button>
            </div>

            {/* Модальное окно отзывов */}
            {showReviewsModal && (
                <ReviewsModal 
                    onClose={handleCloseReviews} 
                    animated={showReviewsModalAnimated}
                    userData={user} // Передаем данные пользователя для загрузки отзывов о нем
                />
            )}
        </div>
    );
};
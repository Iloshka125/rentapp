import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from './Pagination';
import { ReviewsModal } from './ReviewsModal';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { useAlertContext } from '../contexts/AlertContext';
import { getUploadUrl } from '../config/config';

export const NotificationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useAlertContext();

  // Функция для форматирования даты в формат MM/DD/YYYY с сохранением нулей
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  const [notifications, setNotifications] = useState([]);
  const [hovered, setHovered] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 4; // Количество уведомлений на страницу
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewsModalAnimated, setShowReviewsModalAnimated] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Загрузка уведомлений из бэкенда
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 NotificationList: загружаем уведомления...');
      
      const response = await notificationService.getOwnerNotifications();
      console.log('🔍 NotificationList: ответ от бэкенда:', response);
      
      // Проверяем структуру ответа
      if (!response) {
        console.error('🔍 NotificationList: ответ от сервера пустой');
        setError('Получен пустой ответ от сервера');
        return;
      }
      
      if (!response.notifications) {
        console.error('🔍 NotificationList: в ответе отсутствует поле notifications');
        setError('Некорректный формат ответа от сервера');
        return;
      }
      
      if (!Array.isArray(response.notifications)) {
        console.error('🔍 NotificationList: notifications не является массивом:', typeof response.notifications);
        setError('Некорректный формат данных от сервера');
        return;
      }
      
      if (response.notifications.length === 0) {
        console.log('🔍 NotificationList: уведомлений нет');
        setNotifications([]);
        return;
      }
      
      if (response && response.notifications && Array.isArray(response.notifications)) {
        console.log('🔍 NotificationList: найдено уведомлений:', response.notifications.length);
        
        // Проверяем, что есть хотя бы одно уведомление перед логированием
        if (response.notifications.length > 0) {
          console.log('🔍 NotificationList: первое уведомление с сервера:', response.notifications[0]);
          console.log('🔍 NotificationList: структура первого уведомления:', {
            notificationKeys: response.notifications[0] ? Object.keys(response.notifications[0]) : 'notification is null',
            rentKeys: response.notifications[0]?.rent ? Object.keys(response.notifications[0].rent) : 'rent is null',
            renterKeys: response.notifications[0]?.rent?.renter ? Object.keys(response.notifications[0].rent.renter) : 'renter is null'
          });
          
          // Детальное логирование структуры rent
          if (response.notifications[0]?.rent) {
            console.log('🔍 NotificationList: детальная структура rent:', {
              rent: response.notifications[0].rent,
              rentUser: response.notifications[0].rent.user,
              rentRenter: response.notifications[0].rent.renter
            });
          }
        }
        
        // Преобразуем данные из бэкенда в формат для отображения
        const adaptedNotifications = response.notifications.map(notification => {
          // Проверяем, что уведомление имеет необходимую структуру
          if (!notification || !notification.rent) {
            console.error('🔍 NotificationList: уведомление или rent отсутствует:', notification);
            return null;
          }
          
          const rent = notification.rent;
          
          // Проверяем, что rent.user существует
          if (!rent.user) {
            console.error('🔍 NotificationList: rent.user отсутствует для уведомления:', notification.idNotification);
            return null;
          }
          
          const product = rent.product; // было rent.Product
          
          // Проверяем, что product существует
          if (!product) {
            console.error('🔍 NotificationList: product отсутствует для уведомления:', notification.idNotification);
            return null;
          }
          
          // Объединяем данные пользователя из rent.user и рейтинг из rent.renter
          const userData = rent.user || {};
          const renterData = rent.renter || {};
          
          console.log('🔍 NotificationList: userData:', userData);
          console.log('🔍 NotificationList: renterData:', renterData);
          
          // Создаем объединенный объект арендатора
          const renter = {
            ...userData,  // базовые данные (idUser, name, secondName, etc.)
            rating: renterData.rating || 4.0,  // рейтинг из renter
            reviewsCount: renterData.reviewsCount || 0  // количество отзывов из renter
          };
          
          console.log('🔍 NotificationList: итоговый объект renter:', renter);
          
          console.log('🔍 NotificationList: обработка уведомления:', {
            notification,
            rent,
            product,
            renter
          });
          
          console.log('🔍 NotificationList: структура rent:', {
            rentKeys: rent ? Object.keys(rent) : 'rent is null',
            rentUser: rent?.user,
            rentUserKeys: rent?.user ? Object.keys(rent.user) : 'user is null'
          });
          
          console.log('🔍 NotificationList: структура rent.renter:', {
            renterKeys: rent.renter ? Object.keys(rent.renter) : 'renter is null',
            renter: rent.renter
          });
          
          console.log('🔍 NotificationList: объединенные данные арендатора:', {
            idUser: renter.idUser,
            name: renter.name,
            secondName: renter.secondName,
            rating: renter.rating,
            reviewsCount: renter.reviewsCount
          });
          
          // Проверяем, есть ли отзывы у арендатора
          if (renter.reviewsCount === 0) {
            console.log('🔍 NotificationList: у арендатора нет отзывов, показываем "нет отзывов"');
          } else {
            console.log('🔍 NotificationList: у арендатора есть отзывы:', renter.reviewsCount, 'с рейтингом:', renter.rating);
          }
          
          // Проверяем, что данные rating и reviewsCount действительно есть
          if (renter.rating === undefined || renter.reviewsCount === undefined) {
            console.error('🔍 NotificationList: ОШИБКА! Данные rating или reviewsCount не загружены:', {
              rating: renter.rating,
              reviewsCount: renter.reviewsCount
            });
          }
          
          // Проверяем, что все необходимые данные есть
          if (!rent || !product || !rent.user) {
            console.error('🔍 NotificationList: отсутствуют необходимые данные:', { rent, product, rentUser: rent?.user });
            return null;
          }
          
          // Проверяем, что у арендатора есть базовые данные
          if (!renter.idUser || !renter.name) {
            console.error('🔍 NotificationList: отсутствуют базовые данные арендатора:', renter);
            return null;
          }
          
          return {
            id: notification.idNotification,
            image: product.photo ? getUploadUrl(product.photo) : '/default-image.jpg',
            title: product.name,
            request: 'Запрос на аренду:',
            dates: `${formatDate(rent.dataStart)} - ${formatDate(rent.dataEnd)}`,
            user: {
              initials: `${renter.name && renter.name.length > 0 ? renter.name[0] : 'П'}${renter.secondName && renter.secondName.length > 0 ? renter.secondName[0] : 'П'}`,
              name: `${renter.name || 'Пользователь'} ${renter.secondName || ''}`.trim(),
              rating: renter.rating || 4.0,
              reviews: renter.reviewsCount || 0,
              // Добавляем ID пользователя для передачи в ReviewsModal
              idUser: renter.idUser
            },
            // Сохраняем оригинальные данные для работы с кнопками
            originalData: {
              notificationId: notification.idNotification,
              rentId: rent.idRent,
              productId: product.idProduct,
              renterId: renter.idUser
            }
          };
        });
        
        // Фильтруем null значения
        const validNotifications = adaptedNotifications.filter(n => n !== null);
        console.log('🔍 NotificationList: валидных уведомлений:', validNotifications.length);
        
        // Проверяем, что есть валидные уведомления
        if (validNotifications.length === 0) {
          console.log('🔍 NotificationList: все уведомления были отфильтрованы как невалидные');
          setNotifications([]);
          return;
        }
        
        // Логируем данные первой уведомления для диагностики
        if (validNotifications.length > 0) {
          const firstNotification = validNotifications[0];
          console.log('🔍 NotificationList: данные первой уведомления:', {
            user: firstNotification.user,
            renterData: {
              rating: firstNotification.user.rating,
              reviews: firstNotification.user.reviews,
              idUser: firstNotification.user.idUser
            }
          });
        }
        
        setNotifications(validNotifications);
      } else {
        console.error('🔍 NotificationList: некорректный формат ответа:', response);
        setError('Некорректный формат данных от сервера');
      }
    } catch (error) {
      console.error('🔍 NotificationList: ошибка при загрузке уведомлений:', error);
      setError('Не удалось загрузить уведомления: ' + error.message);
      showError('Не удалось загрузить уведомления: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем уведомления при монтировании компонента
  useEffect(() => {
    if (user) {
      console.log('🔍 NotificationList: пользователь авторизован, загружаем уведомления...');
      loadNotifications();
    } else {
      console.log('🔍 NotificationList: пользователь не авторизован');
    }
  }, [user]);

  // Принять запрос на аренду
  const handleAccept = async (notificationId) => {
    try {
      console.log('🔍 NotificationList: принимаем аренду для уведомления:', notificationId);
      
      await notificationService.acceptRent(notificationId);
      console.log('🔍 NotificationList: аренда принята успешно');
      
      // Показываем уведомление об успехе
      showSuccess('Аренда принята успешно!');
      
      // Перезагружаем уведомления
      await loadNotifications();
    } catch (error) {
      console.error('🔍 NotificationList: ошибка при принятии аренды:', error);
      showError('Ошибка при принятии аренды: ' + error.message);
    }
  };

  // Отклонить запрос на аренду
  const handleDecline = async (notificationId) => {
    try {
      console.log('🔍 NotificationList: отклоняем аренду для уведомления:', notificationId);
      
      await notificationService.declineRent(notificationId);
      console.log('🔍 NotificationList: аренда отклонена успешно');
      
      // Показываем уведомление об успехе
      showSuccess('Аренда отклонена успешно!');
      
      // Перезагружаем уведомления
      await loadNotifications();
    } catch (error) {
      console.error('🔍 NotificationList: ошибка при отклонении аренды:', error);
      showError('Ошибка при отклонении аренды: ' + error.message);
    }
  };

  // Логика пагинации
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);
  
  // Отладочная информация
  console.log('🔍 NotificationList пагинация:', {
    totalNotifications: notifications.length,
    itemsPerPage,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    currentNotificationsCount: currentNotifications.length
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    showInfo(`Переход на страницу ${page}`);
  };

  const handleOpenReviews = (user) => {
    console.log('🔍 NotificationList - открываем отзывы для пользователя:', user);
    console.log('🔍 NotificationList - user.idUser:', user.idUser);
    console.log('🔍 NotificationList - user.name:', user.name);
    console.log('🔍 NotificationList - user.rating:', user.rating);
    console.log('🔍 NotificationList - user.reviews:', user.reviews);
    setSelectedUser(user);
    setShowReviewsModal(true);
    setTimeout(() => setShowReviewsModalAnimated(true), 10);
  };

  const handleCloseReviews = () => {
    setShowReviewsModalAnimated(false);
    setTimeout(() => setShowReviewsModal(false), 350);
  };

  // Навигация на страницу товара
  const handleProductClick = (productId) => {
    navigate(`/card/${productId}`);
  };

  return (
    <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px', width: 1345 }}>
      <div className='data' style={{ width: '100%' }}>
        <p className='editing_text' style={{ textAlign: 'center', marginBottom: 40 }}>Уведомления</p>
        
        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <p style={{ fontSize: '18px', color: '#53515E' }}>Загрузка уведомлений...</p>
          </div>
        )}
        
        {error && (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <p style={{ fontSize: '18px', color: '#d2514b', marginBottom: 20 }}>{error}</p>
            <button 
              onClick={loadNotifications}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FFDC64',
                color: '#53515E',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        {notifications.length === 0 && !isLoading && !error ? (
          <div style={{ width: '76.5%', marginRight: '1em', marginTop: 25, textAlign: 'left' }}>
            <div style={{ width: '100%', height: 1, background: '#53515E', marginBottom: 55 }} />
            <div style={{ marginBottom: 18 }}>
              <span className='editing_text' style={{ color: '#53515E', fontWeight: 500, fontSize: 30 }}>Упс! Здесь ещё ничего нет</span>
            </div>
            <div>
              <span style={{ color: '#53515E', fontWeight: 400, fontSize: 30, opacity: 0.7 }}>Чтобы получить уведомления, дождитесь новых событий.</span>
            </div>
          </div>
        ) : !isLoading && !error ? (
          <>
            <div style={{ width: 1170, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 50 }}>
              {currentNotifications.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', background: '#f7f7f7', borderRadius: 17, border: '1px solid #efefef', padding: 5, minHeight: 70, gap: 24, boxShadow: '0 2px 8px 0 #0000000a', paddingLeft: 16, paddingRight: 50 }}>
                  {/* Фото + блок с названием, полосой, запросом и датами */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: "36.3em", 
                      flex: 'none', 
                      gap: 20,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleProductClick(n.originalData.productId)}
                  >
                    <img src={n.image} alt={n.title} style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ddd' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginLeft: '-10px' }}>
                      <span style={{ 
                        fontWeight: 400, 
                        fontSize: 21, 
                        color: '#53515E', 
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '300px',
                        display: 'block'
                      }}>{n.title}</span>
                      <div style={{ width: '100%', height: 2, background: '#aaa', margin: '-5px 0 0' }} />
                      <span style={{ fontSize: 20, color: '#53515E', marginBottom: -1 }}>{n.request}</span>
                      <span style={{ fontSize: 20, color: '#53515E', marginTop: -10, marginBottom: 17 }}>{n.dates}</span>
                    </div>
                  </div>
                  {/* Блок пользователя */}
                  <div style={{ minWidth: 70, display: 'flex', alignItems: 'center', gap: 12, marginLeft: '50px' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#FFF4CC', color: '#fff', fontWeight: 500, fontSize: 23, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.user.initials}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500, fontSize: 18, color: '#53515E' }}>{n.user.name}</span>
                      <div 
                        style={{ 
                          color: '#53515E', 
                          fontSize: 16,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          // Меняем цвет только текста, не трогая звездочку
                          const ratingText = e.target.querySelector('.rating-text');
                          const reviewsText = e.target.querySelector('.reviews-text');
                          if (ratingText) ratingText.style.color = '#FFDC64';
                          if (reviewsText) reviewsText.style.color = '#FFDC64';
                        }}
                        onMouseLeave={(e) => {
                          // Возвращаем исходный цвет текста
                          const ratingText = e.target.querySelector('.rating-text');
                          const reviewsText = e.target.querySelector('.reviews-text');
                          if (ratingText) ratingText.style.color = '#53515E';
                          if (reviewsText) reviewsText.style.color = '#53515E';
                        }}
                        onClick={() => handleOpenReviews(n.user)}
                      >
                        {n.user.reviews === 0 ? (
                          <span style={{ color: '#666', fontSize: 16 }}>Нет отзывов</span>
                        ) : (
                          <>
                            <span className="rating-text">{n.user.rating}</span> 
                            <span style={{ color: '#FFDC64', fontSize: 19, verticalAlign: 'middle' }}>★</span> 
                            <span className="reviews-text">{n.user.reviews} отзывов</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Кнопки */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 180, marginLeft: '30px' }}>
                    <button
                      style={{
                        width: 180,
                        height: 38,
                        border: '1px solid #58bf59',
                        borderRadius: 17,
                        background: hovered[n.id] === 'accept' ? '#58bf59' : 'transparent',
                        color: hovered[n.id] === 'accept' ? '#fff' : '#53515d',
                        fontWeight: 400,
                        fontSize: 20,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s'
                      }}
                      onMouseEnter={() => setHovered(prev => ({ ...prev, [n.id]: 'accept' }))}
                      onMouseLeave={() => setHovered(prev => ({ ...prev, [n.id]: null }))}
                      onClick={() => handleAccept(n.originalData.notificationId)}
                    >Принять</button>
                    <button
                      style={{
                        width: 180,
                        height: 38,
                        border: '1px solid #cc4742',
                        borderRadius: 17,
                        background: hovered[n.id] === 'decline' ? '#cc4742' : 'transparent',
                        color: hovered[n.id] === 'decline' ? '#fff' : '#53515d',
                        fontWeight: 400,
                        fontSize: 20,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s'
                      }}
                      onMouseEnter={() => setHovered(prev => ({ ...prev, [n.id]: 'decline' }))}
                      onMouseLeave={() => setHovered(prev => ({ ...prev, [n.id]: null }))}
                      onClick={() => handleDecline(n.originalData.notificationId)}
                    >Отклонить</button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={notifications.length}
                />
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Модальное окно отзывов */}
      {showReviewsModal && (
        <ReviewsModal 
          onClose={handleCloseReviews} 
          animated={showReviewsModalAnimated}
          userData={selectedUser}
        />
      )}
    </div>
  );
};

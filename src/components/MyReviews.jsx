  import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RatingModal } from './RatingModal';
import { ProductRatingModal } from './ProductRatingModal';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';
import { useAlertContext } from '../contexts/AlertContext';

export const MyReviews = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRatingModalAnimated, setShowRatingModalAnimated] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const { user } = useAuth();

  // Загружаем отзывы пользователя из базы данных
  const loadReviews = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await reviewService.getUserReviews(user.id);
      
      if (Array.isArray(response)) {
        console.log('🔍 MyReviews.loadReviews - сырой ответ от API:', response);
        
        // Адаптируем данные из БД под формат компонента
        const adaptedReviews = response.map(review => ({
          id: review.idReview || review.id || 0,
          productId: review.idProduct || review.product?.idProduct, // Сохраняем ID товара
          image: review.product?.photo ? `/uploads/${review.product.photo}` : '/default-image.jpg',
          title: review.product?.name || 'Товар',
          comment: review.comment || '',
          stars: Math.max(1, Math.min(5, review.rate || 5)) // Ограничиваем от 1 до 5
        }));
        
        console.log('🔍 MyReviews.loadReviews - адаптированные отзывы:', adaptedReviews);
        setReviews(adaptedReviews);
      } else {
        console.log('🔍 MyReviews.loadReviews - ответ не является массивом:', response);
        setReviews([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
      setError('Не удалось загрузить отзывы');
      
      // Показываем боковой alert
      showError('Ошибка при загрузке отзывов: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем отзывы при монтировании компонента
  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      // Показываем подтверждение
      if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        return;
      }

      // Удаляем отзыв из БД
      await reviewService.deleteReview(id);
      
      // Удаляем отзыв из локального состояния
      setReviews(reviews => reviews.filter(r => r.id !== id));
      
      // Показываем успешное уведомление
      showSuccess('Отзыв успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении отзыва:', error);
      
      // Показываем ошибку
      showError('Ошибка при удалении отзыва: ' + error.message);
    }
  };

  const handleEdit = (id) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    console.log('🔍 MyReviews.handleEdit - найденный отзыв:', review);
    console.log('🔍 MyReviews.handleEdit - review.productId:', review.productId);
    showInfo('Редактирование отзыва...');

    // Открываем модальное окно для редактирования
    setEditingReview({
      id: review.productId, // ID товара для создания отзыва
      photo: review.image,
      name: review.title
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (ratingData) => {
    try {
      console.log('🔍 MyReviews.handleSaveEdit - ratingData:', ratingData);
      
      // Находим отзыв по productId, так как editingReview.id содержит ID товара
      const reviewToUpdate = reviews.find(r => r.productId === editingReview.id);
      console.log('🔍 MyReviews.handleSaveEdit - найденный отзыв для обновления:', reviewToUpdate);
      
      if (!reviewToUpdate) {
        throw new Error('Отзыв не найден');
      }

      // Обновляем отзыв в локальном состоянии
      setReviews(reviews => reviews.map(r => 
        r.id === reviewToUpdate.id 
          ? { ...r, comment: ratingData.comment, stars: ratingData.stars }
          : r
      ));

      // Закрываем модальное окно
      setShowEditModal(false);
      setEditingReview(null);

      // Показываем успешное уведомление
      if (window.showAlert) {
        window.showAlert('Отзыв успешно обновлен', 'success');
      }
    } catch (error) {
      console.error('Ошибка при обновлении отзыва:', error);
      
      // Показываем ошибку
      if (window.showAlert) {
        window.showAlert('Ошибка при обновлении отзыва: ' + error.message, 'error');
      }
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingReview(null);
  };



  const handleOpenRatingModal = () => {
    setShowRatingModal(true);
    setTimeout(() => setShowRatingModalAnimated(true), 10);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModalAnimated(false);
    setTimeout(() => setShowRatingModal(false), 350);
  };

  // Навигация на страницу товара
  const handleProductClick = (productId) => {
    
    navigate(`/card/${productId}`);
  };

  return (
    <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px', width: 1345 }}>
      <div className='data' style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, width: '82%', marginTop: 65 }}>
          <p className='editing_text' style={{ textAlign: 'left', marginLeft: '1em', marginBottom: 0, marginTop: 0 }}>Мои отзывы</p>
          <button
            style={{
              width: 200,
              height: 50,
              border: '2px solid #53515E',
              borderRadius: 17,
              background: 'transparent',
              color: '#53515E',
              fontWeight: 500,
              fontSize: 20,
              marginRight: '2em',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#53515E'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#53515E'; }}
            onClick={() => {
              
              handleOpenRatingModal();
            }}
          >Ждут оценки</button>
        </div>
        {isLoading ? (
          <div style={{ width: '76.5%', marginRight: '1em', marginTop: 25, textAlign: 'left', }}>
            <div style={{ width: '100%', height: 1, background: '#53515E', marginBottom: 55 }} />
            <div style={{ marginBottom: 18 }}>
              <span className='editing_text' style={{ color: '#53515E', fontWeight: 500, fontSize: 30 }}>Загрузка отзывов...</span>
            </div>
          </div>
        ) : error ? (
          <div style={{ width: '76.5%', marginRight: '1em', marginTop: 25, textAlign: 'left', }}>
            <div style={{ width: '100%', height: 1, background: '#53515E', marginBottom: 55 }} />
            <div style={{ marginBottom: 18 }}>
              <span className='editing_text' style={{ color: '#53515E', fontWeight: 500, fontSize: 30 }}>Ошибка загрузки</span>
            </div>
            <div>
              <span style={{ color: '#53515E', fontWeight: 400, fontSize: 30, opacity: 0.7 }}>{error}</span>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ width: '76.5%', marginRight: '1em', marginTop: 25, textAlign: 'left', }}>
            <div style={{ width: '100%', height: 1, background: '#53515E', marginBottom: 55 }} />
            <div style={{ marginBottom: 18 }}>
              <span className='editing_text' style={{ color: '#53515E', fontWeight: 500, fontSize: 30 }}>Упс! Здесь ещё ничего нет</span>
            </div>
            <div>
              <span style={{ color: '#53515E', fontWeight: 400, fontSize: 30, opacity: 0.7 }}>Чтобы оставить отзыв нажмите "Ждут оценки".</span>
            </div>
          </div>
        ) : (
        <div style={{ width: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 36 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', background: '#f7f7f7', borderRadius: 17, border: '1px solid #efefef', padding: 16, minHeight: 70, gap: 24, boxShadow: '0 2px 8px 0 #0000000a', paddingLeft: 16, paddingRight: 50, flexWrap: 'nowrap', overflow: 'hidden' }}>
              {/* Левая часть: фото + вертикальный блок */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  minWidth: 320, 
                  flex: 1, 
                  gap: 20, 
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => handleProductClick(r.productId)}
              >
                <img 
                  src={r.image || '/default-image.jpg'} 
                  alt={r.title || 'Товар'} 
                  style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ddd' }}
                  onError={(e) => {
                    e.target.src = '/default-image.jpg';
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '700px', flex: 1 }}>
                  <span style={{ fontWeight: 400, fontSize: 21, color: '#53515f', marginBottom: 4, wordWrap: 'break-word', overflowWrap: 'break-word' }}>{r.title || 'Товар'}</span>
                  
                  {/* Звезды рейтинга */}
                  <div style={{ display: 'flex', gap: 4, margin: '-5px 0 5px' }}>
                    {(() => {
                      const starCount = Math.max(1, Math.min(5, r.stars || 5));
                      return Array.from({ length: starCount }, (_, i) => (
                        <img 
                          key={i} 
                          src="/StarSharp.svg" 
                          alt="Звезда" 
                          style={{ 
                            width: '22px', 
                            height: '22px',
                            filter: 'brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)'
                          }}
                        />
                      ));
                    })()}
                  </div>
                  
                  {/* Комментарий */}
                  <div style={{ 
                    fontSize: 18, 
                    color: '#53515f', 
                    marginTop: 0,
                    lineHeight: '1.4',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    width: '100%'
                  }}>
                    {r.comment || 'Без комментария'}
                  </div>
                </div>
              </div>
              
              {/* Правая часть: кнопки */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 60, justifyContent: 'center' }}>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}
                  onClick={() => handleEdit(r.id)}
                >
                  <img src="/Pencil.svg" alt="Редактировать" style={{ width: 52, height: 52, filter: 'brightness(0) saturate(100%) invert(24%) sepia(8%) saturate(928%) hue-rotate(314deg) brightness(96%) contrast(89%)' }} />
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }} onClick={() => handleDelete(r.id)}>
                      <img src="/Trash.svg" alt="Удалить" style={{ width: 52, height: 52, filter: 'brightness(0) saturate(100%) invert(24%) sepia(8%) saturate(928%) hue-rotate(359deg) brightness(96%) contrast(89%)' }} />
                    </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      {showRatingModal && (
        <RatingModal
          onClose={handleCloseRatingModal}
          animated={showRatingModalAnimated}
        />
      )}

      {/* Модальное окно для редактирования отзыва */}
      {showEditModal && editingReview && (
        <ProductRatingModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          product={editingReview}
          onSubmit={handleSaveEdit}
          hideBackButton={true}
          isEditing={true} // Флаг для редактирования
          reviewId={(() => {
            const foundReview = reviews.find(r => r.productId === editingReview.id);
            return foundReview?.id;
          })()} // ID отзыва для обновления
          initialData={{ 
            stars: (() => {
              const foundReview = reviews.find(r => r.productId === editingReview.id);
              console.log('🔍 MyReviews.initialData - найденный отзыв для stars:', foundReview);
              return foundReview?.stars || 5;
            })(), 
            comment: (() => {
              const foundReview = reviews.find(r => r.productId === editingReview.id);
              console.log('🔍 MyReviews.initialData - найденный отзыв для comment:', foundReview);
              return foundReview?.comment || '';
            })() 
          }}
        />
      )}
    </div>
  );
};

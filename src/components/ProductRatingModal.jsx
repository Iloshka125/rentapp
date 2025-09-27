    import React, { useState, useEffect, useMemo } from 'react';
import { MdArrowBack } from 'react-icons/md';
import './RatingModal.css';
import { reviewService } from '../services/reviewService';

export const ProductRatingModal = ({ 
  isOpen, 
  onClose, 
  onBack, 
  onCloseMain, 
  product, 
  onSubmit, 
  initialData = { stars: 5, comment: '' },
  animated = true,
  hideBackButton = false,
  isEditing = false, // Флаг для редактирования
  reviewId = null // ID отзыва для обновления
}) => {
  const [ratingData, setRatingData] = useState(initialData);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showSideAlert, setShowSideAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Создаем стабильный объект initialData
  const stableInitialData = useMemo(() => initialData, [initialData.stars, initialData.comment]);

  // Обновляем ratingData при изменении initialData
  useEffect(() => {
    setRatingData(stableInitialData);
  }, [stableInitialData]);

  if (!isOpen) return null;

  // Логируем данные продукта для отладки
  console.log('🔍 ProductRatingModal - product:', product);
  console.log('🔍 ProductRatingModal - product.id:', product?.id);
  console.log('🔍 ProductRatingModal - product.idProduct:', product?.idProduct);
  console.log('🔍 ProductRatingModal - product.photo:', product?.photo);
  console.log('🔍 ProductRatingModal - product.name:', product?.name);
  console.log('🔍 ProductRatingModal - isEditing:', isEditing);
  console.log('🔍 ProductRatingModal - reviewId:', reviewId);
  
  // Проверяем наличие ID товара
  const hasProductId = product?.id || product?.idProduct;
  console.log('🔍 ProductRatingModal - hasProductId:', hasProductId);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(); // Закрываем ProductRatingModal
      if (onCloseMain) {
        onCloseMain(); // Закрываем основное модальное окно
      }
      setIsClosing(false);
    }, 350); // Время анимации закрытия
  };

  const handleStarClick = (stars) => {
    setRatingData(prev => ({ ...prev, stars }));
  };

  const handleStarHover = (stars) => {
    setHoveredStars(stars);
  };

  const handleStarLeave = () => {
    setHoveredStars(0);
  };

  const handleSubmit = async () => {
    console.log('🔍 ProductRatingModal.handleSubmit - product:', product);
    console.log('🔍 ProductRatingModal.handleSubmit - product.id:', product?.id);
    console.log('🔍 ProductRatingModal.handleSubmit - product.idProduct:', product?.idProduct);
    console.log('🔍 ProductRatingModal.handleSubmit - isEditing:', isEditing);
    console.log('🔍 ProductRatingModal.handleSubmit - reviewId:', reviewId);
    
    // Проверяем наличие ID товара (может быть в поле id или idProduct)
    const productId = product?.id || product?.idProduct;
    console.log('🔍 ProductRatingModal.handleSubmit - используемый productId:', productId);
    
    if (!productId) {
      showSideAlertMessage('Ошибка: товар не найден', 'error');
      return;
    }

    try {
      if (isEditing && reviewId) {
        // Редактируем существующий отзыв
        console.log('🔍 ProductRatingModal.handleSubmit - обновляем отзыв:', reviewId);
        await reviewService.updateReview(reviewId, {
          comment: ratingData.comment,
          rate: ratingData.stars
        });
        showSideAlertMessage('Отзыв успешно обновлен!', 'success');
      } else {
        // Создаем новый отзыв
        console.log('🔍 ProductRatingModal.handleSubmit - создаем новый отзыв');
        await reviewService.createReview({
          idProduct: productId,
          rate: ratingData.stars,
          comment: ratingData.comment
        });
        showSideAlertMessage('Отзыв успешно отправлен!', 'success');
      }
      
      // Вызываем onSubmit для обновления родительского компонента
      onSubmit(ratingData);
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      
      // Показываем ошибку
      let errorMessage = 'Не удалось отправить отзыв';
      if (error.message) {
        if (error.message.includes('нет активного или завершенного заказа')) {
          errorMessage = 'Вы можете оставить отзыв только после подтверждения заказа на этот товар';
        } else if (error.message.includes('свой собственный товар')) {
          errorMessage = 'Нельзя оставлять отзыв на свой собственный товар';
        } else {
          errorMessage = error.message;
        }
      }
      
      showSideAlertMessage(errorMessage, 'error');
    }
  };

  const handleCommentChange = (e) => {
    setRatingData(prev => ({ ...prev, comment: e.target.value }));
  };

  const handleTextareaFocus = () => {
    setIsTextareaFocused(true);
  };

  const handleTextareaBlur = () => {
    setIsTextareaFocused(false);
  };

  const showSideAlertMessage = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowSideAlert(true);
    
    // Автоматически скрываем алерт через 5 секунд
    setTimeout(() => {
      setShowSideAlert(false);
    }, 5000);
  };

  return (
    <>
      <style>
        {`
          .product-rating-textarea {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-all !important;
            white-space: pre-wrap !important;
            hyphens: auto !important;
          }
        `}
      </style>
      <div
        className="fixed top-0 left-0 w-full h-full bg-black/40 z-50 flex justify-center items-center"
        onClick={handleClose}
      >
      <div
        className={`bg-white border-2 rounded-[17px] relative ${isClosing ? 'rating-modal-hide' : 'rating-modal-animate'}`}
        style={{ borderColor: '#504e4a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Верхний блок: стрелка назад и крестик */}
        <div className="flex justify-between items-center absolute top-4 left-12 right-12">
          {!hideBackButton && (
            <button
              onClick={onBack}
              className="text-[#53515E] transition-all duration-300 cursor-pointer hover:scale-110"
            >
              <MdArrowBack size={32} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-[#53515E] hover:text-black ml-auto"
          >
            <img src="/close_icon.svg" className="cursor-pointer w-[40px]" alt="Закрыть" />
          </button>
        </div>

        {/* Заголовок */}
        <div className="text-center py-8">
          
        </div>

        {/* Содержимое */}
        <div className="content-area">
          {/* Блок с фото товара и информацией */}
          <div className="flex items-start gap-6 mb-8 w-[85%] mx-auto">
                         {/* Фото товара - фиксированный размер без закруглений */}
             <div className="w-32 h-32 flex-shrink-0">
               <img 
                 src={product?.photo || '/default-image.jpg'} 
                 alt={product?.name || 'Товар'} 
                 className="w-full h-full object-contain border border-gray-200"
                 onError={(e) => {
                   console.log('🔍 ProductRatingModal - ошибка загрузки изображения:', e.target.src);
                   e.target.src = '/default-image.jpg';
                 }}
                 onLoad={(e) => {
                   console.log('🔍 ProductRatingModal - изображение успешно загружено:', e.target.src);
                 }}
               />
             </div>
            {/* Информация о товаре */}
            <div className="flex-1 max-w-xs">
              {/* Название товара - максимум 2 строки */}
              <div className="mb-4">
                <h3 className="text-xl font-medium text-[#53515E] leading-tight" style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.2'
                }}>
                  {product?.name || 'Товар'}
                </h3>
              </div>
              {/* Выбор количества звезд - выровнены по левому краю */}
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  const isActive = starValue <= (hoveredStars || ratingData.stars);
                  
                  return (
                    <img 
                      key={i} 
                      src="/StarSharp.svg" 
                      alt="Звезда" 
                      className="cursor-pointer transition-all duration-200 hover:scale-110"
                      style={{ 
                        width: '30px', 
                        height: '30px',
                        filter: isActive 
                          ? 'brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)'
                          : 'brightness(0) saturate(100%) invert(90%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)'
                      }}
                      onClick={() => handleStarClick(starValue)}
                      onMouseEnter={() => handleStarHover(starValue)}
                      onMouseLeave={handleStarLeave}
                    />
                  );
                })}
              </div>
            </div>
          </div>

                     {/* Заголовок над textarea */}
                       <div className="mb-4">
              <h3 className="text-[32px] font-medium text-[#53515E] text-center">
                {isEditing ? 'Редактировать отзыв' : 'Оцените товар'}
              </h3>
              
              
            </div>

          {/* Textarea для комментария */}
          <div className="mb-6 flex flex-col items-center">
                         <textarea
               value={ratingData.comment}
               onChange={handleCommentChange}
               placeholder="Комментарий"
               maxLength={200}
               wrap="soft"
              className={`product-rating-textarea w-[90%] h-32 p-4 border-2 rounded-[17px] resize-none outline-none transition-all duration-300 placeholder:text-[#53515E] placeholder:opacity-100 ${
                ratingData.comment.trim() ? 'border-[#FFDC64]' : 'border-[#e1e1e1]'
              }`}
               style={{
                 fontSize: '18px',
                 color: '#53515E',
                 backgroundColor: 'white',
                 wordWrap: 'break-word',
                 overflowWrap: 'break-word',
                 whiteSpace: 'pre-wrap',
                 lineHeight: '1.4',
                 overflow: 'hidden',
                 wordBreak: 'break-all',
                 hyphens: 'auto',
                 maxWidth: '100%',
                 boxSizing: 'border-box'
               }}
             />
                         <div className="mt-2 text-sm text-gray-500">
               {ratingData.comment.length}/200 символов
             </div>
          </div>

          {/* Кнопка отправить */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              style={{
                width: '430px',
                marginTop: 45,
                height: '50px',
                border: '2px solid #53515E',
                borderRadius: 17,
                background: 'transparent',
                color: '#53515E',
                fontWeight: 500,
                fontSize: 20,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = '#53515E'; 
                e.currentTarget.style.color = '#fff'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = 'transparent'; 
                e.currentTarget.style.color = '#53515E'; 
              }}
            >
                             {isEditing ? 'Сохранить изменения' : 'Отправить'}
            </button>
                     </div>
                  </div>
        </div>
      </div>

      {/* Боковой алерт */}
      {showSideAlert && (
        <div className={`fixed right-4 top-4 z-[60] p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
          alertType === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
          alertType === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
          alertType === 'warning' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' :
          'bg-blue-100 border border-blue-300 text-blue-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {alertType === 'error' && <span className="text-red-400">❌</span>}
              {alertType === 'success' && <span className="text-green-400">✅</span>}
              {alertType === 'warning' && <span className="text-yellow-400">⚠️</span>}
              {alertType === 'info' && <span className="text-blue-400">ℹ️</span>}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{alertMessage}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setShowSideAlert(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

import React, { useMemo } from 'react';
import { PiCalendarDots } from "react-icons/pi";
import { VscHeart } from "react-icons/vsc";
import { MdFavorite, MdArrowBack } from "react-icons/md";
import ProductCard from './ProductCard';
import { DatePicker, ConfigProvider } from 'antd';
import ru_RU from 'antd/es/date-picker/locale/ru_RU';
import '../components/RangePickerCustom.css';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductReviewsModal } from './ProductReviewsModal';
import { ReviewsModal } from './ReviewsModal';
import { ProductRatingModal } from './ProductRatingModal';
import { productService } from '../services/productService';
import { favouriteService } from '../services/favouriteService';
import { rentService } from '../services/rentService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';
import { getUploadUrl } from '../config/config';
import { useAlertContext } from '../contexts/AlertContext';
const { RangePicker } = DatePicker;

export const Card = () => {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isBouncing, setIsBouncing] = React.useState(false);
  const [dateRange, setDateRange] = React.useState([null, null]);
  const [showReviewsModal, setShowReviewsModal] = React.useState(false);
  const [showReviewsModalAnimated, setShowReviewsModalAnimated] = React.useState(false);
  const [showUserReviewsModal, setShowUserReviewsModal] = React.useState(false);
  const [showUserReviewsModalAnimated, setShowUserReviewsModalAnimated] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [showRatingModalAnimated, setShowRatingModalAnimated] = React.useState(false);
  const [product, setProduct] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isCheckingFavorite, setIsCheckingFavorite] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0); // Индекс текущего изображения
  const [productOwner, setProductOwner] = React.useState(null); // Информация о владельце товара
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useAlertContext();

  // Создаем стабильные объекты для модальных окон
  const stableProductData = useMemo(() => {
    if (!product) return null;
    
    const productData = {
      id: product.idProduct, // Используем id для совместимости с ProductRatingModal
      idProduct: product.idProduct,
      name: product.name,
      photo: product.photo ? getUploadUrl(product.photo) : '/default-image.jpg',
      description: product.description
    };
    
    console.log('🔍 Card - stableProductData:', productData);
    console.log('🔍 Card - stableProductData.id:', productData.id);
    console.log('🔍 Card - stableProductData.idProduct:', productData.idProduct);
    console.log('🔍 Card - stableProductData.photo:', productData.photo);
    return productData;
  }, [product?.idProduct, product?.name, product?.photo, product?.description]);

  const stableInitialData = useMemo(() => ({ stars: 5, comment: '' }), []);

  // Получаем все изображения продукта
  const getAllImages = () => {
    const images = [];
    
    // Добавляем главное фото
    if (product.photo) {
      images.push(getUploadUrl(product.photo));
    }
    
    // Добавляем дополнительные изображения
    if (product.images) {
      try {
        const additionalImages = JSON.parse(product.images);
        if (Array.isArray(additionalImages)) {
          additionalImages.forEach(img => {
            if (img) {
              images.push(getUploadUrl(img));
            }
          });
        }
      } catch (e) {
        console.error('Ошибка парсинга дополнительных изображений:', e);
      }
    }
    
    return images;
  };

  const handleHeartClick = async () => {
    if (!user) {
      showError('Войдите в аккаунт, чтобы добавлять товары в избранное');
      return;
    }

    try {
      if (isFavorite) {
        // Убираем из избранного
        await favouriteService.removeFromFavourites(product.idProduct);
        setIsFavorite(false);
          
      } else {
        // Добавляем в избранное
        await favouriteService.addToFavourites(product.idProduct);
        setIsFavorite(true);
        
      }
      
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 150);
    } catch (error) {
      console.error('Ошибка при работе с избранным:', error);
      showError('Ошибка при работе с избранным');
    }
  };

  const handlePublishClick = () => {
    
    navigate('/publication');
  };

  const handleRentClick = async () => {
    if (!user) {
      showError('Войдите в аккаунт, чтобы арендовать товар');
      return;
    }
    
    // Проверяем, не является ли товар собственным
    if (product && product.userId === user.id) {
      showError('Нельзя арендовать свой собственный товар');
      return;
    }
    
    // Проверяем, что выбраны даты
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      showError('Пожалуйста, выберите даты аренды');
      return;
    }
    
    // Проверяем, что у товара есть даты доступности
    if (!product.startdate || !product.enddate) {
      showError('Товар не доступен для аренды (не указан период доступности)');
      return;
    }
    
    // Проверяем, что выбранные даты находятся в диапазоне доступности товара
    const startDate = dayjs(product.startdate);
    const endDate = dayjs(product.enddate);
    const selectedStart = dayjs(dateRange[0]);
    const selectedEnd = dayjs(dateRange[1]);
    
    if (selectedStart.isBefore(startDate, 'day') || selectedEnd.isAfter(endDate, 'day')) {
      showError(
        `Даты аренды должны быть в диапазоне доступности товара: с ${startDate.format('DD.MM.YYYY')} по ${endDate.format('DD.MM.YYYY')}`
      );
      return;
    }
    
    try {
      // Форматируем даты для отправки на сервер
      const startDate = dateRange[0].toISOString();
      const endDate = dateRange[1].toISOString();
      
      console.log('🔍 Отправляем данные аренды:', {
        productId: product.idProduct,
        startDate,
        endDate,
        product: product
      });
      
      // Отправляем запрос на создание аренды
      const response = await rentService.createRent({
        productId: product.idProduct,
        startDate,
        endDate
      });
      
      showSuccess('Запрос на аренду отправлен! Ожидайте подтверждения владельца.');
      
      // Очищаем выбранные даты
      setDateRange([null, null]);
      
      // TODO: Можно добавить редирект на страницу аренд или обновить данные
      
    } catch (error) {
      console.error('Ошибка при создании аренды:', error);
      
      if (error.message) {
        window.showAlert(`Ошибка при создании аренды: ${error.message}`, 'error');
      } else {
        window.showAlert('Ошибка при создании аренды. Попробуйте снова.', 'error');
      }
    }
  };

  const handleBackClick = () => {
    window.history.back();
  };

  const handleOpenReviews = () => {
    setShowReviewsModal(true);
    setTimeout(() => setShowReviewsModalAnimated(true), 10);
  };

  const handleOpenUserReviews = () => {
    if (!productOwner) return;
    setShowUserReviewsModal(true);
    setTimeout(() => setShowUserReviewsModalAnimated(true), 10);
  };

  const handleCloseUserReviews = () => {
    setShowUserReviewsModalAnimated(false);
    setTimeout(() => setShowUserReviewsModal(false), 350);
  };

  const handleCloseReviews = () => {
    setShowReviewsModalAnimated(false);
    setTimeout(() => setShowReviewsModal(false), 350);
  };

  const handleOpenRatingModal = () => {
    setShowRatingModal(true);
    setTimeout(() => setShowRatingModalAnimated(true), 10);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModalAnimated(false);
    setTimeout(() => setShowRatingModal(false), 350);
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      console.log('🔍 handleRatingSubmit - начало функции');
      console.log('🔍 handleRatingSubmit - user:', user);
      console.log('🔍 handleRatingSubmit - product:', product);
      console.log('🔍 handleRatingSubmit - ratingData:', ratingData);
      
      if (!user) {
        window.showAlert('Войдите в аккаунт, чтобы оставить отзыв', 'error');
        return;
      }

      if (!product || !product.idProduct) {
        window.showAlert('Ошибка: товар не найден', 'error');
        return;
      }

      console.log('🔍 handleRatingSubmit - отправляем отзыв для idProduct:', product.idProduct);
      console.log('🔍 handleRatingSubmit - product:', product);
      console.log('🔍 handleRatingSubmit - product.idProduct тип:', typeof product.idProduct);

      // Создаем отзыв через API
      await reviewService.createReview({
        idProduct: product.idProduct,
        rate: ratingData.stars,
        comment: ratingData.comment
      });
      
      // Закрываем модальное окно
      handleCloseRatingModal();
      
      // Показываем уведомление об успехе
      window.showAlert('Отзыв успешно отправлен', 'success');
      
      // Перезагружаем страницу для обновления отзывов
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      
      // Показываем понятное сообщение об ошибке
      if (error.message && error.message.includes('нет активного или завершенного заказа')) {
        window.showAlert('Вы можете оставить отзыв только после подтверждения заказа на этот товар. Сначала арендуйте товар, а после подтверждения заказа вернитесь сюда для написания отзыва.', 'warning');
      } else if (error.message && error.message.includes('свой собственный товар')) {
        window.showAlert('Нельзя оставлять отзыв на свой собственный товар.', 'warning');
      } else {
        window.showAlert('Ошибка при отправке отзыва: ' + (error.message || 'Неизвестная ошибка'), 'error');
      }
    }
  };

  // Проверяем, находится ли товар в избранном
  const checkIfFavorite = async () => {
    if (!user || !product) return;
    
    try {
      setIsCheckingFavorite(true);
      const response = await favouriteService.getUserFavourites();
      // Проверяем, что response содержит массив products
      if (response && response.products && Array.isArray(response.products)) {
        const isInFavorites = response.products.some(fav => fav.idProduct === product.idProduct);
        setIsFavorite(isInFavorites);
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      setIsFavorite(false);
    } finally {
      setIsCheckingFavorite(false);
    }
  };

  // Загружаем данные о продукте
  React.useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const productData = await productService.getProductById(id);
        console.log('🔍 loadProduct - загруженные данные продукта:', productData);
        console.log('🔍 loadProduct - productData.idProduct:', productData?.idProduct);
        setProduct(productData);
        
        // Загружаем информацию о владельце товара
        if (productData && productData.userId && typeof productData.userId === 'number' && productData.userId > 0) {
          try {
            const ownerResponse = await fetch(`/api/user/${productData.userId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            
            if (ownerResponse.ok) {
              const ownerData = await ownerResponse.json();
              setProductOwner(ownerData);
              console.log('🔍 Информация о владельце товара:', ownerData);
            }
          } catch (ownerError) {
            console.error('Ошибка при загрузке владельца товара:', ownerError);
          }
        } else {
          console.warn(`⚠️ Некорректный ID владельца товара: ${productData.userId}, тип: ${typeof productData.userId}`);
        }
      } catch (error) {
        console.error('Ошибка при загрузке продукта:', error);
        
        // Проверяем, нужно ли сделать редирект
        if (error.message && error.message.includes('redirect')) {
          window.showAlert('Товар был удален или остановлен', 'warning');
          navigate('/');
          return;
        }
        
        setError('Не удалось загрузить данные о продукте');
      } finally {
        setIsLoading(false);
      }
    };

      loadProduct();
  }, [id, navigate]);

  // Проверяем избранное после загрузки продукта
  React.useEffect(() => {
    if (product && user) {
      checkIfFavorite();
    }
  }, [product, user]);

  // Показываем загрузку или ошибку
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-[#53515E] text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-red-500 text-xl">{error}</div>
          <button 
          onClick={() => window.history.back()}
          className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
          >
            Назад
          </button>
        </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-[#53515E] text-xl">Продукт не найден</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-20 pt-20 pb-10 text-gray-800 main-div-card relative" style={{ minHeight: '100vh', margin: '35px' }}>
        {/* Кнопка "Назад" */}
        <button 
          onClick={handleBackClick} 
          className="absolute top-5 left-5 text-[#53515E] transition-all duration-300 cursor-pointer z-10"
        >
          <MdArrowBack size={39} 
          className="hover:border hover:border-[#53515E] hover:rounded-full p-0 hover:border-[2px]"/>
        </button>

        {/* Основной блок карточки товара */}
        <div className="flex flex-col lg:flex-row gap-10 items-start cart-mt" style={{marginTop: '-60px', marginLeft: '65px'}}>
          {/* Изображение товара */}
          <div className="flex-1">
                        <div className="w-[700px] h-[600px] bg-gray-100 flex items-center justify-center">
              <img 
                src={(() => {
                  const allImages = getAllImages();
                  return allImages.length > 0 ? allImages[currentImageIndex] : '/default-image.jpg';
                })()} 
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-300"
                onError={(e) => {
                  e.target.src = '/default-image.jpg';
                }}
              />
            </div>
                        {/* Галерея изображений */}
            {(() => {
              const allImages = getAllImages();
              if (allImages.length <= 1) return null; // Не показываем галерею, если только одно изображение
              
              return (
                <div className="mt-5">
                  {/* Счетчик изображений */}
                  <div className="text-sm text-gray-600 mb-3 text-center">
                    Фото {currentImageIndex + 1} из {allImages.length}
            </div>

                  {/* Сетка изображений */}
                  <div className="grid grid-cols-5 gap-3">
                    {allImages.map((image, index) => (
                      <div 
                        key={index} 
                        className={`w-[115px] h-[100px] cursor-pointer transition-all duration-300 hover:opacity-80 hover:scale-105 relative ${
                          index === currentImageIndex ? 'ring-2 ring-[#FFDC64] ring-offset-2 scale-105' : ''
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`${product.name} - фото ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />

                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
                </div>

          {/* Инфо о товаре */}
          <div className="flex-1" style={{marginTop: '50px', marginLeft: '-45px'}}>
            <h1 className="mb-3" style={{fontSize: '40px', fontWeight: '600'}}>{product.name}</h1>
            <div className='flex justify-between'>
              <div className='flex price-fav items-center'>
                <p className="mb-3 p-price" style={{fontSize: '40px', fontWeight: '400', color: '#53515E', marginTop: '-5px'}}>{product.price} ₽/сутки</p>
                <span
                  className={`ml-4 cursor-pointer flex items-center`}
                  style={{
                    fontSize: '2rem',
                    transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1), color 0.2s',
                    transform: isBouncing ? 'scale(1.05)' : 'scale(1.0)',
                    position: 'relative',
                    top: '-4px',
                    color: '#53515E'
                  }}
                  onClick={handleHeartClick}
                  title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  role="button"
                  tabIndex={0}
                >
                  {isFavorite ? <MdFavorite color="#e53e3e" /> : <VscHeart />}
                </span>
              </div>
            {/* Блок с владельцем и рейтингом */}
            <div className="flex flex-col gap-3 mb-4" style={{marginRight: '75px'}}>
              {/* Аватарка и имя пользователя */}
              {productOwner && (
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleOpenUserReviews}
                >
                  <div className="w-16 h-16 bg-[#FFF4CC] rounded-full flex items-center justify-center">
                    <span style={{ fontSize: '24px', fontWeight: '500', color: '#53515E' }}>
                      {productOwner.name && productOwner.secondName 
                        ? `${productOwner.secondName[0]}${productOwner.name[0]}`.toUpperCase()
                        : productOwner.name 
                          ? productOwner.name[0].toUpperCase() 
                          : 'П'
                      }
                    </span>
                  </div>
                  <span style={{ fontSize: '25px', fontWeight: '400', color: '#53515E' }}>
                    {productOwner.secondName && productOwner.name 
                      ? `${productOwner.secondName} ${productOwner.name}`
                      : productOwner.name || 'Пользователь'
                    }
                  </span>
                </div>
              )}
              
              {/* Рейтинг товара */}
              <div 
                className="flex items-center text-lg cursor-pointer hover:opacity-80 transition-opacity card-reviews-rating"
                onClick={handleOpenReviews}
              >
                {product.reviewsCount === 0 ? (
                  <span style={{color: '#666', fontSize: '25px', fontWeight: '400'}}>Нет отзывов</span>
                ) : (
                  <>
                    <span className="mr-1" style={{fontSize: '25px', fontWeight: '400', color: '#53515E'}}> {(product.rating || 5.0).toFixed(1)} </span>
                    <span className="text-yellow-300 mr-1" style={{fontSize: '35px', fontWeight: '400'}}> ★ </span>
                    <span className=" text-lg" style={{color: '#53515E', fontSize: '25px', fontWeight: '400'}}>
                      {product.reviewsCount === 1 ? '1 отзыв' : 
                       product.reviewsCount > 1 && product.reviewsCount < 5 ? `${product.reviewsCount} отзыва` : 
                       `${product.reviewsCount} отзывов`}
                    </span>
                  </>
                )}
              </div>
            </div>
            </div>
            <div className="items-center gap-2 text-2xl mb-2 main-category-card">
              <h3 className="font-semibold mb-[15px]" style={{fontSize: '25px', fontWeight: '600', color: '#000'}}>Категория:</h3>
              <p className='p-category mb-[15px]' style={{fontSize: '25px', fontWeight: '400', color: '#000'}}>{product.category}</p>
            </div>

            

            {/* Описание */}
                <div className="mb-6">
              <h3 className="font-semibold mb-[15px]" style={{fontSize: '25px', fontWeight: '600', color: '#000'}}>Описание:</h3>
              <p className="leading-relaxed whitespace-pre-line" style={{fontSize: '25px', fontWeight: '400', color: '#000'}}>
                    {product.description}
                  </p>
                </div>

            {/* Даты и кнопка */}
            <div className="flex flex-col sm:flex-row items-center gap-20">
              <div className="w-[330px]">
                <ConfigProvider theme={{ token: { colorPrimary: '#FFDC64' } }}>
                  <RangePicker
                    className="custom-range-picker card-range-picker"
                    classNames={{
                      popup: {
                        root: "custom-range-picker-dropdown"
                      }
                    }}
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        const [d1, d2] = dates;
                        const start = d1.isBefore(d2) ? d1 : d2;
                        const end = d1.isBefore(d2) ? d2 : d1;
                        setDateRange([start, end]);
                      } else {
                        setDateRange(dates);
                      }
                    }}
                    format="DD.MM.YYYY"
                    allowClear
                    placeholder={["Начало", "Окончание"]}
                    inputReadOnly
                    locale={ru_RU}
                    disabledDate={(current) => {
                      // Блокируем прошлые дни
                      if (current && current < dayjs().startOf('day')) {
                        return true;
                      }
                      
                      // Блокируем даты вне диапазона доступности товара
                      if (product && product.startdate && product.enddate) {
                        const startDate = dayjs(product.startdate);
                        const endDate = dayjs(product.enddate);
                        
                        // Блокируем даты до startdate и после enddate
                        if (current.isBefore(startDate, 'day') || current.isAfter(endDate, 'day')) {
                          return true;
                        }
                      } else {
                        // Если у товара нет дат доступности, блокируем все даты
                        return true;
                      }
                      
                      return false;
                    }}
                  />
                </ConfigProvider>
              </div>
              <button 
                className="rent_but"
                onClick={handleRentClick}
              >
                Арендовать
                </button>
            </div>
          </div>
        </div>

        {/* Недавно просмотренные (заглушка) - ЗАКОММЕНТИРОВАНО
        <div className="mt-16">
          <div className="grid justify-center grid-cols-[repeat(auto-fit,_minmax(290px,_1fr))]"></div>
          <p className="p-latest text-gray-700 text-3xl mb-6 ml-4">Недавно просмотренные</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center items-stretch px-4">
            <ProductCard product={{
              id: 201,
              image: "item4.jpg",
              price: "от 4 200 ₽",
              title: "Ленточная пила Metabo BAS 261",
              rating: "★ 4.6",
              titleClass: 'text-xl',
              priceClass: 'text-2xl',
              ratingClass: 'text-xl'
            }} />
            <ProductCard product={{
              id: 202,
              image: "item5.jpg",
              price: "от 5 100 ₽",
              title: "Фрезер Makita RP0900",
              rating: "★ 4.9",
              titleClass: 'text-xl',
              priceClass: 'text-2xl',
              ratingClass: 'text-xl'
            }} />
            <ProductCard product={{
              id: 203,
              image: "item2.jpg",
              price: "от 2 300 ₽",
              title: "Дрель-шуруповерт Bosch GSR 120-LI",
              rating: "★ 4.8",
              titleClass: 'text-xl',
              priceClass: 'text-2xl',
              ratingClass: 'text-xl'
            }} />
            <ProductCard product={{
              id: 204,
              image: "item1.jpg",
              price: "от 3 700 ₽",
              title: "Шлифмашина Makita BO3711",
              rating: "★ 4.7",
              titleClass: 'text-xl',
              priceClass: 'text-2xl',
              ratingClass: 'text-xl'
            }} />
            <ProductCard product={{
              id: 205,
              image: "item3.jpg",
              price: "от 2 800 ₽",
              title: "Лобзик Bosch PST 700 E",
              rating: "★ 4.5",
              titleClass: 'text-xl',
              priceClass: 'text-2xl',
              ratingClass: 'text-xl'
            }} />
          </div>
        </div>
        */}
      </div>

      {/* Фиксированный блок с плюсиком для публикации */}
      <div 
        className="fixed right-8 top-47/60 transform -translate-y-1/2 z-40 cursor-pointer"
        onClick={handlePublishClick}
      >
        <div className="w-[50px] h-[50px] bg-[#FFDC64] rounded-full flex items-center justify-center shadow-lg">
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path 
              d="M12 5V19M5 12H19" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
      </div>
    </div>

      {/* Модальное окно отзывов */}
      {showReviewsModal && (
        <ProductReviewsModal 
          onClose={handleCloseReviews} 
          animated={showReviewsModalAnimated}
          productId={product.idProduct}
          productRating={product.rating}
          reviewsCount={product.reviewsCount}
          onWriteReview={handleOpenRatingModal}
        />
      )}

      {/* Модальное окно для написания отзыва */}
      {showRatingModal && stableProductData && (
        <ProductRatingModal
          isOpen={showRatingModal}
          onClose={handleCloseRatingModal}
          onBack={handleCloseRatingModal}
          product={stableProductData}
          onSubmit={handleRatingSubmit}
          hideBackButton={false}
          initialData={stableInitialData}
        />
      )}

      {/* Модальное окно отзывов о пользователе */}
      {showUserReviewsModal && productOwner && (
        <ReviewsModal
          onClose={handleCloseUserReviews}
          animated={showUserReviewsModalAnimated}
          userData={productOwner}
        />
      )}
    </>
  );
};

export default Card; 
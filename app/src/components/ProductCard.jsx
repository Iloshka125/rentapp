//src/components/ProductCard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscHeart } from 'react-icons/vsc';
import { MdFavorite } from 'react-icons/md';
import { favouriteService } from '../services/favouriteService';
import { useAuth } from '../contexts/AuthContext';

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Проверяем, что product существует и имеет необходимые поля
  if (!product || !product.title || !product.price) {
    console.error('❌ ProductCard: некорректные данные продукта:', product);
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-red-500">Ошибка загрузки товара</div>
        </div>
      </div>
    );
  }

  const titleClass = product.titleClass || 'text-xl';
  const priceClass = product.priceClass || 'text-2xl';
  // Уменьшаем ценник на 1 пункт
  const smallerPriceClass = priceClass.replace('3xl', '2xl').replace('2xl', '2xl').replace('xl', 'xl');
  const ratingClass = product.ratingClass || 'text-base';
  // Уменьшаем описание (название и рейтинг) на 1 пункт
  const smallerTitleClass = titleClass.replace('2xl', 'xl').replace('xl', 'lg');

  // Проверяем, есть ли товар в избранном при загрузке
  useEffect(() => {
    const checkFavourite = async () => {
      if (user) {
        try {
          const response = await favouriteService.getUserFavourites();
          const isInFavourites = response.products.some(p => p.idProduct === product.id);
          setIsFavorite(isInFavourites);
        } catch (error) {
          console.error('Ошибка при проверке избранного:', error);
        }
      }
    };

    checkFavourite();
    
    // Если передан флаг isFavorite, используем его
    if (product.isFavorite !== undefined) {
      setIsFavorite(product.isFavorite);
    }
  }, [product.id, product.isFavorite, user]);

  const handleCardClick = () => {
    navigate(`/card/${product.id}`);
  };

  const handleHeartClick = async (e) => {
    e.stopPropagation(); // чтобы не всплывал клик на карточку
    
    if (!user) {
      // Если пользователь не авторизован, показываем уведомление
      if (window.showAlert) {
        window.showAlert('Войдите в аккаунт, чтобы добавить товар в избранное', 'warning');
      }
      return;
    }

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 120);

    try {
      if (newFavoriteState) {
        // Добавляем товар в избранное
        await favouriteService.addToFavourites(product.id);
        if (window.showAlert) {
          window.showAlert('Товар добавлен в избранное', 'success');
        }
      } else {
        // Убираем товар из избранного
        await favouriteService.removeFromFavourites(product.id);
        if (window.showAlert) {
          window.showAlert('Товар убран из избранного', 'success');
        }
      }

      // Вызываем callback функцию, если она передана
      if (product.onFavoriteToggle) {
        product.onFavoriteToggle(product.id, newFavoriteState);
      }
    } catch (error) {
      // Откатываем состояние в случае ошибки
      setIsFavorite(!newFavoriteState);
      console.error('Ошибка при работе с избранным:', error);
      
      if (window.showAlert) {
        window.showAlert('Ошибка при работе с избранным: ' + error.message, 'error');
      }
    }
  };

  return (
    <div className={`card ${product.cardClass || ''}`} onClick={handleCardClick}>
      <img 
        src={product.image} 
        alt={product.title} 
        className="cursor-pointer"
      />
      <div className="card-content">
        <div className="flex justify-between items-center relative mt-[-8px] mb-[10px]" >
          <div 
            className={`card-price cursor-pointer ${smallerPriceClass}`}
            dangerouslySetInnerHTML={{ __html: product.price }} 
            style={{fontSize: '25px', fontWeight: '400'}}
          />
          <button
            type="button"
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            onClick={handleHeartClick}
            style={{
              marginLeft: '-10px',
              marginTop: '20px',
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '26px',
              fontWeight: '900',
              color: '#53515E',
              transition: 'transform 120ms cubic-bezier(0.4,0,0.2,1), color 0.2s',
              transform: isBouncing ? 'scale(1.05)' : 'scale(1.0)'
            }}
          >
            {isFavorite ? <MdFavorite color="#e53e3e" style={{ fill: '#e53e3e' }} /> : <VscHeart />}
          </button>
        </div>
        <div 
          className={`card-title cursor-pointer ${smallerTitleClass}`}
          title={product.title}
          style={{maxHeight: '48px', maxWidth: '280px', fontSize: '20px', lineHeight: '1.1', fontWeight: '400'}}
        >
          {product.title}
        </div>
        <div className={`card-rating`} style={{fontSize: '20px', fontWeight: '400'}}>
          {(() => {
            // Проверяем сначала на строку "Нет отзывов"
            if (product.rating === 'Нет отзывов' || product.reviewsCount === 0) {
              return <span style={{ color: '#53515E', fontSize: '20px', marginTop: '-1px', display: 'block' }}>Нет отзывов</span>;
            }
            
            const ratingValue = product.rating.replace('★', '').trim();
            const numericRating = parseFloat(ratingValue);
            
            if (numericRating === 0 || isNaN(numericRating)) {
              return <span style={{ color: '#666', fontSize: '14px' }}>Нет отзывов</span>;
            }
            
            return (
              <>
                <span style={{ color: '#FFD700' }} className='text-2xl'>★ </span>
                <span style={{ color: '#555' }}>{ratingValue}</span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

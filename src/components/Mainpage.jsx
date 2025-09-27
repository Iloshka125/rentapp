// src/components/Main.jsx
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useSearch } from './SearchContext';
import { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { getUploadUrl } from '../config/config';
import { useAlertContext } from '../contexts/AlertContext';

export const Mainpage = ({ products }) => {
  const navigate = useNavigate();
  const { searchQuery, clearSearchQuery } = useSearch();
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [mainProducts, setMainProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Очищаем поисковый запрос при переходе на главную страницу
  useEffect(() => {
    if (searchQuery) {
      clearSearchQuery();
    }
  }, [searchQuery, clearSearchQuery]);

  // НЕ очищаем поисковый запрос при размонтировании - это сбрасывает результаты
  // useEffect(() => {
  //   return () => {
  //     clearSearchQuery();
  //   };
  // }, [clearSearchQuery]);

  const handlePublishClick = () => {
    
    navigate('/publication');
  };

  // Загрузка объявлений из базы данных
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const products = await productService.getAllProducts();
      
      if (Array.isArray(products)) {
        // Преобразуем данные из БД в формат, ожидаемый ProductCard
        const adaptedProducts = products.map(product => {
          return {
            id: product.idProduct,
            title: product.name,
            image: product.photo ? getUploadUrl(product.photo) : '/default-image.jpg',
            price: `от ${product.price} ₽`,
            rating: product.reviewsCount === 0 ? 'Нет отзывов' : `★ ${(product.rating || 5.0).toFixed(1)}`, // Используем рейтинг объявления (если есть отзывы) или рейтинг пользователя
            reviewsCount: product.reviewsCount || 0, // Добавляем количество отзывов
            titleClass: 'text-2xl',
            priceClass: 'text-3xl font-normal',
            ratingClass: 'text-2xl'
          };
        });
        
        setMainProducts(adaptedProducts);
      } else {
        console.error('❌ API вернул не массив:', products);
        setError('Некорректный формат данных от сервера');
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке объявлений:', error);
      setError('Не удалось загрузить объявления: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем объявления при монтировании компонента
  useEffect(() => {
    loadProducts();
  }, []);

  // Функция для перехода к детальному просмотру объявления
  const handleProductClick = (productId) => {

    navigate(`/card/${productId}`);
  };

  // Данные загружаются из базы данных

  return (
    <>
      <main className="main-wrapper mainpage-main px-[6em] py-8" style={{ minHeight: '100vh' }}>
        <h2 style={{fontSize: '35px', fontWeight: '500', color: '#53515E'}} className="mb-[25px] text-gray-700 mt-[-6px] ml-[-1px]">Рекомендации для вас</h2>
        
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-[#53515E] text-xl">Загрузка объявлений...</div>
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center py-20">
            <div className="text-red-500 text-xl">{error}</div>
            <button 
              onClick={() => {
                showInfo('Повторная загрузка объявлений...');
                loadProducts();
              }}
              className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!isLoading && !error && (!mainProducts || mainProducts.length === 0) && (
          <div className="flex justify-center items-center py-20">
            <div className="text-[#53515E] text-xl">Пока нет объявлений</div>
          </div>
        )}

        {!isLoading && !error && mainProducts && mainProducts.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,_minmax(314px,_1fr))] gap-6 mx-auto">
            {mainProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer"
              >
                <ProductCard 
                  product={product}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Фиксированный блок с плюсиком */}
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
    </>
  );
};
export default Mainpage;
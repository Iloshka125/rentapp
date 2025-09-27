import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useSearch } from './SearchContext';
import { useCity } from './CityContext';
import { productService } from '../services/productService';
import { getUploadUrl } from '../config/config';
import { useAlertContext } from '../contexts/AlertContext';

export const Catalog = () => {
  const navigate = useNavigate();
  const searchContext = useSearch();
  const { searchQuery } = searchContext;
  const { city } = useCity();
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [otherCityProducts, setOtherCityProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOtherCities, setShowOtherCities] = useState(false);

  // Счетчик рендеров для диагностики
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // Проверка контекста поиска
  console.log(`📚 === Catalog Component (рендер #${renderCount.current}) ===`);
  console.log('📚 Весь контекст поиска:', searchContext);
  console.log('📚 searchQuery:', searchQuery);
  console.log('📚 Тип searchQuery:', typeof searchQuery);
  console.log('📚 Длина searchQuery:', searchQuery ? searchQuery.length : 0);
  console.log('📚 searchQuery === ""', searchQuery === '');
  console.log('📚 searchQuery === null', searchQuery === null);
  console.log('📚 searchQuery === undefined', searchQuery === undefined);

  // Отладочная информация при рендере
  console.log('📚 Catalog render - searchQuery:', searchQuery);
  console.log('📚 Catalog render - searchQuery type:', typeof searchQuery);
  console.log('📚 Catalog render - searchQuery length:', searchQuery ? searchQuery.length : 0);

  // Очищаем поисковый запрос при размонтировании компонента
  useEffect(() => {
    console.log('🔄 Catalog useEffect - searchQuery изменился:', searchQuery);
    console.log('🔄 Catalog useEffect - searchQuery type:', typeof searchQuery);
    console.log('🔄 Catalog useEffect - searchQuery length:', searchQuery ? searchQuery.length : 0);
    console.log('🔄 Catalog useEffect - текущий путь:', window.location.pathname);
    console.log('🔄 Catalog useEffect - время:', new Date().toISOString());
    
    // НЕ очищаем поиск при размонтировании - это сбрасывает результаты
    // return () => {
    //   console.log('🧹 Catalog cleanup - очищаем поиск');
    //   clearSearchQuery();
    // };
  }, [searchQuery]);

  const handlePublishClick = () => {
    
    navigate('/publication');
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsCategoryOpen(false);
    showInfo(`Выбрана категория: ${category}`);
  };

  const handleResetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedCategory('');
    setMinRating(0);
    // Очищаем поисковый запрос при сбросе фильтров
    searchContext.clearSearchQuery();
    showInfo('Фильтры сброшены');
  };

  // Загрузка объявлений из базы данных с фильтрацией по городу
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowOtherCities(false);
      
      const products = await productService.getAllProducts();
      
      if (Array.isArray(products)) {
        // Преобразуем данные из БД в формат, ожидаемый ProductCard
        const adaptedProducts = products.map(product => {
          return {
            id: product.idProduct,
            title: product.name,
            image: product.photo ? getUploadUrl(product.photo) : '/default-image.jpg',
            price: `от ${product.price} ₽`,
            rating: product.rating || 5.0, // Используем рейтинг объявления (если есть отзывы) или рейтинг пользователя
            userRating: product.userRating || 5.0, // Сохраняем для совместимости
            reviewsCount: product.reviewsCount || 0, // Добавляем количество отзывов
            category: product.category,
            city: product.city || 'Таганрог', // Временно используем Таганрог как город по умолчанию
            titleClass: 'text-2xl',
            priceClass: 'text-3xl font-normal',
            ratingClass: 'text-2xl'
          };
        });
        
        // Фильтруем товары по городу из шапки
        const cityProducts = adaptedProducts.filter(product => 
          product.city === city
        );
        
        // Товары из других городов
        const otherProducts = adaptedProducts.filter(product => 
          product.city !== city
        );
        
        console.log(`🏙️ Товары в городе ${city}:`, cityProducts.length);
        console.log(`🏙️ Товары в других городах:`, otherProducts.length);
        
        setCatalogProducts(cityProducts);
        setOtherCityProducts(otherProducts);
        
        // Показываем товары из других городов, если они есть
        if (otherProducts.length > 0) {
          setShowOtherCities(true);
        }
        
      } else {
        console.error('❌ API вернул не массив:', products);
        setError('Некорректный формат данных от сервера');
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке объявлений в каталоге:', error);
      setError('Не удалось загрузить объявления: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем объявления при монтировании компонента и при смене города
  useEffect(() => {
    loadProducts();
  }, [city]);

  // Закрытие выпадающего списка при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCategoryOpen && !event.target.closest('.filter-block')) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  // Функция для перехода к детальному просмотру объявления
  const handleProductClick = (productId) => {
    navigate(`/card/${productId}`);
  };

  // Категории товаров
  const categories = [
    'Все категории',
    'Электроинструменты',
    'Бензоинструменты',
    'Ручные инструменты',
    'Сварочное оборудование',
    'Генераторы',
    'Компрессоры и насосы',
    'Станки',
    'Садовая техника'
  ];

  

  // Фильтрация товаров из текущего города
  const filteredCityProducts = (catalogProducts || []).filter(product => {
    
    // Поиск по тексту (название и категория)
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      const titleMatch = product.title.toLowerCase().includes(searchLower);
      const categoryMatch = product.category.toLowerCase().includes(searchLower);
      
      console.log(`🔍 Поиск: "${searchLower}"`);
      console.log(`🔍 Товар: "${product.title}"`);
      console.log(`🔍 Категория: "${product.category}"`);
      console.log(`🔍 Совпадение по названию: ${titleMatch}`);
      console.log(`🔍 Совпадение по категории: ${categoryMatch}`);
      
      // Если поиск не дал результатов, товар не показываем
      if (!titleMatch && !categoryMatch) {
        console.log('❌ Товар НЕ прошел поиск');
        return false;
      }
      console.log('✅ Товар прошел поиск');
    } else {
      console.log('ℹ️ Поисковый запрос отсутствует или пустой');
    }
    
    // Фильтр по категории
    if (selectedCategory && selectedCategory !== 'Все категории') {
      console.log(`🔍 Проверяем категорию: "${product.category}" vs "${selectedCategory}"`);
      if (product.category !== selectedCategory) {
        console.log('❌ Товар НЕ прошел фильтр категории');
        return false;
      }
    }
    
    // Фильтр по цене
    if (priceRange.min || priceRange.max) {
      // Извлекаем число из строки "от 1500 ₽"
      const priceMatch = product.price.match(/\d+/);
      if (!priceMatch) {
        console.log('❌ Товар НЕ прошел фильтр цены - не удалось извлечь цену');
        return false;
      }
      
      const price = parseInt(priceMatch[0]);
      const min = priceRange.min ? parseInt(priceRange.min) : 0;
      const max = priceRange.max ? parseInt(priceRange.max) : Infinity;
      
      if (price < min || price > max) {
        console.log('❌ Товар НЕ прошел фильтр цены');
        return false;
      }
    }
    
              // Фильтр по рейтингу
          if (minRating > 0 && (product.rating || 5.0) < minRating) {
            console.log(`❌ Товар НЕ прошел фильтр рейтинга: ${product.rating || 5.0} < ${minRating}`);
            return false;
          }
    
    console.log('✅ Товар прошел все фильтры');
    return true;
  });

  // Фильтрация товаров из других городов (с теми же критериями)
  const filteredOtherCityProducts = (otherCityProducts || []).filter(product => {
    // Применяем те же фильтры, что и для товаров из текущего города
    
    // Поиск по тексту (название и категория)
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      const titleMatch = product.title.toLowerCase().includes(searchLower);
      const categoryMatch = product.category.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !categoryMatch) {
        return false;
      }
    }
    
    // Фильтр по категории
    if (selectedCategory && selectedCategory !== 'Все категории') {
      if (product.category !== selectedCategory) {
        return false;
      }
    }
    
    // Фильтр по цене
    if (priceRange.min || priceRange.max) {
      const priceMatch = product.price.match(/\d+/);
      if (!priceMatch) return false;
      
      const price = parseInt(priceMatch[0]);
      const min = priceRange.min ? parseInt(priceRange.min) : 0;
      const max = priceRange.max ? parseInt(priceRange.max) : Infinity;
      
      if (price < min || price > max) {
        return false;
      }
    }
    
    // Фильтр по рейтингу
    if (minRating > 0 && (product.rating || 5.0) < minRating) {
      return false;
    }
    
    return true;
  });

  // Отладочная информация о результатах фильтрации
  console.log('📊 Результаты фильтрации:');
  console.log('📊 Товары в текущем городе:', catalogProducts ? catalogProducts.length : 0);
  console.log('📊 Отфильтровано товаров в текущем городе:', filteredCityProducts ? filteredCityProducts.length : 0);
  console.log('📊 Товары в других городах:', otherCityProducts ? otherCityProducts.length : 0);
  console.log('📊 Отфильтровано товаров в других городах:', filteredOtherCityProducts ? filteredOtherCityProducts.length : 0);
  console.log('📊 Поисковый запрос:', searchQuery);

  // Функция для отображения звезд
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <img 
            key={i} 
            src="/StarSharp.svg" 
            alt="Звезда" 
            className="w-5 h-5"
            style={{
              filter: 'brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)',
            }}
          />
        );
      } else {
        stars.push(
          <div key={i} className="w-5 h-5 border border-gray-300 rounded-sm opacity-30"></div>
        );
      }
    }
    return stars;
  };

  return (
    <div className="">
              <main className="main-wrapper px-[6em] py-8" style={{ minHeight: '100vh' }}>
        {/* Поисковый запрос */}
        {searchQuery && (
          <div className="search-results-header mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-medium text-gray-700">
                  Результаты поиска по запросу: "{searchQuery}"
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="filters-section mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-medium text-gray-700">Фильтры</h2>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[17px] transition-colors flex items-center gap-2"
            >
              <span>Сбросить фильтры</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div style={{fontSize: '20px'}} className="grid grid-cols-3 gap-20">
            {/* Фильтр по категории */}
            <div className="filter-block flex flex-col justify-center" style={{width: '635px'}}>
              <label style={{fontSize: '25px'}} className="block text-base font-medium text-gray-700 mb-3">Категория</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full border border-gray-300 rounded-[17px] px-3 py-2 focus:border-[#504e4a] focus:outline-none bg-white text-left flex justify-between items-center hover:border-[#504e4a] transition-colors"
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategory || 'Выберите категорию'}
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isCategoryOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {categories.map((category, index) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full px-3 py-2 text-left hover:bg-[#FFDC64] hover:text-white transition-colors ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${
                          index === categories.length - 1 ? 'rounded-b-lg' : ''
                        } ${
                          selectedCategory === category ? 'bg-[#FFDC64] font-medium text-white' : ''
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Фильтр по цене */}
            <div className="filter-block flex flex-col justify-center" style={{width: '635px', marginLeft: '96px'}}>
              <label style={{fontSize: '25px'}} className="block text-base font-medium text-gray-700 mb-3">Цена</label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  placeholder="От"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-[17px] px-3 py-2 focus:border-[#504e4a] focus:outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="До"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-[17px] px-3 py-2 focus:border-[#504e4a] focus:outline-none"
                />
              </div>
            </div>

            {/* Фильтр по рейтингу */}
            <div className="filter-block flex flex-col justify-center ml-15 mt-[50px]" style={{maxWidth: '290px', marginLeft: '250px'}}>
              <label className="flex flex-col gap-2 cursor-pointer">
                <span style={{fontSize: '20px' }} className="text-base font-medium text-gray-700">
                  С рейтингом
                </span>
                <div className="flex items-center gap-2">
                  <span style={{fontSize: '20px' }} className="text-base font-medium text-gray-700">
                    от 4.5
                  </span>
                  <img 
                    src="/StarSharp.svg" 
                    alt="Звезда" 
                    className="w-7 h-7"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)'
                    }}
                  />
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={minRating === 4.5}
                      onChange={(e) => setMinRating(e.target.checked ? 4.5 : 0)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-4 rounded-full transition-colors duration-200 flex items-center ${
                      minRating === 4.5 ? 'bg-[#FFDC64]' : 'bg-gray-300'
                    }`}>
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-200 transform shadow-md ${
                        minRating === 4.5 ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Количество товаров под фильтрами */}
          <div className="mt-8">
            <h3 className="text-2xl font-medium text-gray-700">
              Найдено товаров: {(filteredCityProducts ? filteredCityProducts.length : 0) + (filteredOtherCityProducts ? filteredOtherCityProducts.length : 0)}
            </h3>
          </div>
        </div>

        {/* Результаты поиска */}
        <div className="results-section">
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-[#53515E] text-xl">Загрузка объявлений...</div>
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center py-20">
              <div className="text-red-500 text-xl">{error}</div>
              <button 
                onClick={loadProducts}
                className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {!isLoading && !error && filteredCityProducts.length === 0 && filteredOtherCityProducts.length === 0 && (
            <div className="no-results text-center py-16">
              <p className="text-lg text-gray-500">
                {searchQuery 
                  ? `По запросу "${searchQuery}" ничего не найдено` 
                  : 'По вашему запросу ничего не найдено'
                }
              </p>
              <p className="text-base text-gray-400 mt-2">Попробуйте изменить параметры фильтра или поисковый запрос</p>
            </div>
          )}

       

          {/* Товары из текущего города */}
          {!isLoading && !error && filteredCityProducts && filteredCityProducts.length > 0 && (
            <div className="city-products-section mb-12">
              {filteredOtherCityProducts.length > 0 && (
                <h3 className="text-2xl font-medium text-gray-800 mb-6">Товары в городе {city}</h3>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(290px,_1fr))] gap-6 mx-auto">
                {filteredCityProducts.map(product => {
                  // Создаем объект для отображения, не изменяя оригинальный
                  const displayProduct = {
                    ...product,
                    rating: product.reviewsCount === 0 ? 'Нет отзывов' : `★ ${(product.rating || 5.0).toFixed(1)}`
                  };
                  
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer"
                    >
                      <ProductCard 
                        product={displayProduct}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Товары из других городов */}
          {!isLoading && !error && showOtherCities && filteredOtherCityProducts && filteredOtherCityProducts.length > 0 && (
            <div className="other-cities-section">
              <div className="other-cities-message text-left py-8 mb-8">
                <div className="max-w-2xl">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    {filteredCityProducts.length === 0 
                      ? `В городе ${city} таких товаров нет` 
                      : `Похожие товары в других городах`
                    }
                  </h3>
                  <p className="text-gray-600">
                    {filteredCityProducts.length === 0 
                      ? 'Но мы нашли похожие предложения в других городах:' 
                      : 'Возможно, вас заинтересуют эти предложения:'
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(290px,_1fr))] gap-6 mx-auto">
                {filteredOtherCityProducts.map(product => {
                  // Создаем объект для отображения, не изменяя оригинальный
                  const displayProduct = {
                    ...product,
                    rating: product.reviewsCount === 0 ? 'Нет отзывов' : `★ ${(product.rating || 5.0).toFixed(1)}`
                  };
                  
                  return (
                    <div 
                      key={`other-${product.id}`}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer"
                    >
                      <ProductCard 
                        product={displayProduct}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
};

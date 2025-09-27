import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rentService } from '../services/rentService';
import { productService } from '../services/productService';
import { useAlertContext } from '../contexts/AlertContext';
import { Pagination } from './Pagination';

const getStatusColor = (status) => {
  if (status === "Подтвержден" || status === "Завершен") return "#58bf59";
  if (status === "Ждет подтверждения") return "#ffdc64";
  if (status === "Отклонен") return "#d2514b";
  return '#53515f';
};

// Функция для форматирования даты в формате xx/xx/xxxx
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const Orders = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [activeTab, setActiveTab] = useState('Аренды');
  const [myRents, setMyRents] = useState([]);
  const [myProductRents, setMyProductRents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 5 заказов на страницу

  // Загружаем аренды пользователя (где он арендует)
  const loadMyRents = async () => {
    try {
      console.log('🔍 Загружаем аренды пользователя...');
      const response = await rentService.getUserRents();
      console.log('🔍 Ответ от rentService.getUserRents:', response);
      
      if (response && response.rents) {
        console.log(`🔍 Найдено ${response.rents.length} аренд`);
        
        // Для каждой аренды получаем полную информацию о товаре
        const rentsWithFullInfo = await Promise.all(
          response.rents.map(async (rent) => {
            try {
              console.log(`🔍 Получаем информацию о товаре ${rent.idProduct}`);
              // Получаем информацию о товаре
              const productResponse = await productService.getProductById(rent.idProduct);
              console.log(`🔍 Информация о товаре ${rent.idProduct}:`, productResponse);
              
                             if (productResponse) {
                 const product = productResponse;
                 console.log(`🔍 Получаем информацию о владельце товара ${product.userId}`);
                 
                 // Получаем информацию о владельце товара
                 let owner = null;
                 
                 // Проверяем, что userId является корректным числовым ID
                 if (product.userId && typeof product.userId === 'number' && product.userId > 0) {
                   try {
                     const ownerResponse = await fetch(`/api/user/${product.userId}`, {
                       headers: {
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                       }
                     });
                     
                     if (ownerResponse.ok) {
                       owner = await ownerResponse.json();
                       console.log(`🔍 Информация о владельце товара ${product.userId}:`, owner);
                     } else {
                       console.error(`❌ Ошибка при получении владельца товара ${product.userId}:`, ownerResponse.status);
                       // Создаем заглушку для владельца
                       owner = {
                         name: 'Владелец',
                         secondName: 'товара',
                         phone: 'Контакт через чат'
                       };
                     }
                   } catch (error) {
                     console.error(`❌ Ошибка при получении владельца товара ${product.userId}:`, error);
                     // Создаем заглушку для владельца
                     owner = {
                       name: 'Владелец',
                       secondName: 'товара',
                       phone: 'Контакт через чат'
                     };
                   }
                 } else {
                   console.warn(`⚠️ Некорректный ID владельца товара: ${product.userId}, тип: ${typeof product.userId}`);
                   // Создаем заглушку для владельца
                   owner = {
                     name: 'Владелец',
                     secondName: 'товара',
                     phone: 'Контакт через чат'
                   };
                 }
                 
                 return {
                   ...rent,
                   Product: {
                     idProduct: product.idProduct,
                     name: product.name,
                     photo: product.photo,
                     price: product.price,
                     category: product.category
                   },
                   Owner: owner // Информация о владельце товара
                 };
               }
              return rent;
            } catch (error) {
              console.error(`❌ Ошибка при получении информации о товаре ${rent.idProduct}:`, error);
              return rent;
            }
          })
        );
        
        console.log('🔍 Все аренды с полной информацией:', rentsWithFullInfo);
        setMyRents(rentsWithFullInfo);
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке моих аренд:', error);
      setError('Не удалось загрузить аренды');
    }
  };

    // Загружаем аренды товаров пользователя (где он сдает в аренду)
  const loadMyProductRents = async () => {
    try {
      console.log('🔍 Загружаем аренды товаров пользователя...');
      console.log('🔍 Текущий пользователь ID:', user?.id);
      console.log('🔍 Текущий пользователь объект:', user);
      
      // Получаем все товары пользователя
      console.log('🔍 Вызываем productService.getUserProducts()...');
      const userProductsResponse = await productService.getUserProducts();
      console.log('🔍 Ответ от productService.getUserProducts():', userProductsResponse);
      console.log('🔍 Тип ответа:', typeof userProductsResponse);
      console.log('🔍 Есть ли products:', !!userProductsResponse?.products);
      
      if (userProductsResponse && userProductsResponse.products) {
        console.log(`🔍 Найдено ${userProductsResponse.products.length} товаров пользователя`);
        console.log('🔍 Товары:', userProductsResponse.products);
        
        // Создаем массив ID товаров пользователя для быстрого поиска
        const userProductIds = userProductsResponse.products.map(p => p.idProduct);
        console.log('🔍 ID товаров пользователя:', userProductIds);
        
        // Получаем все аренды из базы данных
        try {
          console.log('🔍 Вызываем fetch для получения всех аренд...');
          const allRentsResponse = await fetch('/api/rent/all');
          console.log('🔍 Ответ от /api/rent/all:', allRentsResponse);
          console.log('🔍 Статус ответа:', allRentsResponse.status);
          console.log('🔍 OK ли ответ:', allRentsResponse.ok);
          
          if (allRentsResponse.ok) {
            const allRentsData = await allRentsResponse.json();
            console.log('🔍 Все аренды из базы:', allRentsData);
            console.log('🔍 Количество всех аренд:', allRentsData.rents ? allRentsData.rents.length : 0);
            
            if (!allRentsData.rents || allRentsData.rents.length === 0) {
              console.log('🔍 Аренды в базе отсутствуют');
              setMyProductRents([]);
              return;
            }
            
            // Фильтруем только те аренды, где idProduct соответствует товарам пользователя
            const userProductRents = allRentsData.rents.filter(rent => {
              const isMatch = userProductIds.includes(rent.idProduct);
              console.log(`🔍 Проверяем аренду ${rent.idRent}: idProduct=${rent.idProduct}, входит в ${userProductIds}? ${isMatch}`);
              return isMatch;
            });
            
            console.log(`🔍 Найдено ${userProductRents.length} аренд товаров пользователя`);
            console.log('🔍 Отфильтрованные аренды:', userProductRents);
            
            if (userProductRents.length === 0) {
              console.log('🔍 Нет аренд для товаров пользователя');
              setMyProductRents([]);
              return;
            }
            
            // Для каждой найденной аренды получаем полную информацию
            const rentsWithFullInfo = await Promise.all(
              userProductRents.map(async (rent) => {
                try {
                  console.log(`🔍 Обрабатываем аренду ${rent.idRent} для товара ${rent.idProduct}`);
                  
                  // Находим товар пользователя
                  const product = userProductsResponse.products.find(p => p.idProduct === rent.idProduct);
                  console.log(`🔍 Найденный товар для аренды ${rent.idRent}:`, product);
                  
                  if (!product) {
                    console.error(`❌ Товар ${rent.idProduct} не найден в списке товаров пользователя`);
                    return null;
                  }
                  
                  // Получаем информацию о пользователе, который арендует
                  let user = null;
                  
                  // Проверяем, что idUser является корректным числовым ID
                  if (rent.idUser && typeof rent.idUser === 'number' && rent.idUser > 0) {
                    try {
                      const userResponse = await fetch(`/api/user/${rent.idUser}`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                      });
                      
                      if (userResponse.ok) {
                        user = await userResponse.json();
                        console.log(`🔍 Информация о пользователе ${rent.idUser}:`, user);
                      } else {
                        console.error(`❌ Ошибка при получении пользователя ${rent.idUser}:`, userResponse.status);
                        user = {
                          name: 'Пользователь',
                          secondName: '',
                          phone: 'Телефон не указан'
                        };
                      }
                    } catch (error) {
                      console.error(`❌ Ошибка при получении пользователя ${rent.idUser}:`, error);
                      user = {
                        name: 'Пользователь',
                        secondName: '',
                        phone: 'Телефон не указан'
                      };
                    }
                  } else {
                    console.warn(`⚠️ Некорректный ID пользователя: ${rent.idUser}, тип: ${typeof rent.idUser}`);
                    user = {
                      name: 'Пользователь',
                      secondName: '',
                      phone: 'Телефон не указан'
                    };
                  }
                  
                  const result = {
                    ...rent,
                    Product: {
                      idProduct: product.idProduct,
                      name: product.name,
                      photo: product.photo,
                      price: product.price,
                      category: product.category
                    },
                    User: user
                  };
                  
                  console.log(`🔍 Результат обработки аренды ${rent.idRent}:`, result);
                  return result;
                } catch (error) {
                  console.error(`❌ Ошибка при обработке аренды ${rent.idRent}:`, error);
                  return null;
                }
              })
            );
            
            // Фильтруем null значения
            const validRents = rentsWithFullInfo.filter(rent => rent !== null);
            console.log('🔍 Все аренды товаров пользователя с полной информацией:', validRents);
            console.log('🔍 Количество валидных аренд:', validRents.length);
            setMyProductRents(validRents);
          } else {
            console.error('❌ Ошибка при получении всех аренд:', allRentsResponse.status);
            setMyProductRents([]);
          }
        } catch (error) {
          console.error('❌ Ошибка при получении всех аренд:', error);
          setMyProductRents([]);
        }
      } else {
        console.log('🔍 Товары пользователя не найдены или пусты');
        console.log('🔍 userProductsResponse:', userProductsResponse);
        setMyProductRents([]);
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке аренд моих товаров:', error);
      setError('Не удалось загрузить аренды товаров');
    }
  };

  // Обновление статуса аренды
  const handleUpdateStatus = async (rentId, newStatus) => {
    try {
      await rentService.updateRentStatus(rentId, newStatus);
      
      // Перезагружаем данные
      await Promise.all([loadMyRents(), loadMyProductRents()]);
      
      // Показываем уведомление
      if (window.showAlert) {
        window.showAlert(
          newStatus === 'active' ? 'Аренда подтверждена!' : 'Аренда отклонена!',
          newStatus === 'active' ? 'success' : 'error'
        );
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      if (window.showAlert) {
        window.showAlert('Ошибка при обновлении статуса', 'error');
      }
    }
  };

  // Отмена аренды
  const handleCancelRent = async (rentId) => {
    try {
      await rentService.cancelRent(rentId);
      
      // Перезагружаем данные
      await loadMyRents();
      
      // Показываем уведомление
      if (window.showAlert) {
        window.showAlert('Аренда отменена!', 'success');
      }
    } catch (error) {
      console.error('Ошибка при отмене аренды:', error);
      if (window.showAlert) {
        window.showAlert('Ошибка при отмене аренды', 'error');
      }
    }
  };

  // Навигация на страницу товара
  const handleProductClick = (productId) => {
    navigate(`/card/${productId}`);
  };

  // Обработчик смены страницы
  const handlePageChange = (page) => {
    console.log('🔍 Orders - смена страницы с', currentPage, 'на', page);
    setCurrentPage(page);
  };

  // Сброс страницы при смене вкладки
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      console.log('🔍 useEffect: пользователь авторизован, загружаем данные...');
      console.log('🔍 ID пользователя:', user.id);
      console.log('🔍 Объект пользователя:', user);
      setIsLoading(true);
      
      // Загружаем данные параллельно
      Promise.all([loadMyRents(), loadMyProductRents()])
        .then(() => {
          console.log('🔍 useEffect: загрузка завершена успешно');
          console.log('🔍 myRents после загрузки:', myRents);
          console.log('🔍 myProductRents после загрузки:', myProductRents);
        })
        .catch((error) => {
          console.error('🔍 useEffect: ошибка при загрузке:', error);
        })
        .finally(() => {
          console.log('🔍 useEffect: загрузка завершена');
          console.log('🔍 Финальное состояние:');
          console.log('🔍 myRents.length:', myRents.length);
          console.log('🔍 myProductRents.length:', myProductRents.length);
          setIsLoading(false);
        });
    } else {
      console.log('🔍 useEffect: пользователь не авторизован');
    }
  }, [user]);

  // Адаптация данных для отображения
  const adaptRentData = (rent, isMyRent = true) => {
    console.log(`🔍 adaptRentData вызван для аренды:`, rent);
    console.log(`🔍 isMyRent:`, isMyRent);
    
    const product = rent.Product;
    const user = rent.User;
    const owner = rent.Owner;
    
    console.log(`🔍 product:`, product);
    console.log(`🔍 user:`, user);
    console.log(`🔍 owner:`, owner);
    
    // Проверяем, что у нас есть все необходимые данные
    if (!product) {
      console.error('❌ Отсутствует информация о товаре в аренде:', rent);
      return {
        id: rent.idRent || 'unknown',
        image: '/placeholder-image.jpg',
        title: 'Товар не найден',
        startDate: formatDate(rent.dataStart),
        endDate: formatDate(rent.dataEnd),
        status: getStatusText(rent.status),
        contact: { name: 'Информация недоступна', phone: 'Не указан' }
      };
    }
    
    const result = {
      id: rent.idRent,
      image: product.photo ? `/uploads/${product.photo}` : '/placeholder-image.jpg',
      title: product.name || 'Название не указано',
      startDate: formatDate(rent.dataStart),
      endDate: formatDate(rent.dataEnd),
      status: getStatusText(rent.status),
      contact: isMyRent ? 
        { 
          name: owner ? `${owner.name || ''} ${owner.secondName || ''}`.trim() || 'Владелец товара' : 'Владелец товара', 
          phone: rent.status === 'active' || rent.status === 'completed' ? (owner?.phone || 'Контакт через чат') : 'Доступен после подтверждения'
        } : 
        { 
          name: user ? `${user.name || ''} ${user.secondName || ''}`.trim() || 'Пользователь' : 'Пользователь', 
          phone: user?.phone || 'Телефон не указан' 
        }
    };
    
    console.log(`🔍 Результат адаптации:`, result);
    return result;
  };

  // Преобразование статуса в читаемый текст
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ждет подтверждения';
      case 'active': return 'Подтвержден';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отклонен';
      default: return status;
    }
  };

  // Получаем все данные в зависимости от активной вкладки
  const getAllData = () => {
    console.log(`🔍 getAllData вызван для вкладки: ${activeTab}`);
    console.log(`🔍 myRents:`, myRents);
    console.log(`🔍 myProductRents:`, myProductRents);
    
    if (activeTab === 'Аренды') {
      const data = myRents
        .filter(rent => rent && rent.Product) // Фильтруем только валидные аренды
        .map(rent => ({
          ...adaptRentData(rent, true),
          originalRent: rent // Сохраняем оригинальный объект для доступа к статусу
        }));
      console.log(`🔍 Данные для вкладки "Аренды":`, data);
      return data;
    } else {
      console.log(`🔍 Обрабатываем вкладку "Сдачи"`);
      console.log(`🔍 myProductRents.length:`, myProductRents.length);
      console.log(`🔍 myProductRents с Product:`, myProductRents.filter(rent => rent && rent.Product));
      
      const data = myProductRents
        .filter(rent => rent && rent.Product) // Фильтруем только валидные аренды
        .map(rent => {
          console.log(`🔍 Обрабатываем аренду для отображения:`, rent);
          const adapted = adaptRentData(rent, false);
          console.log(`🔍 Адаптированная аренда:`, adapted);
          return {
            ...adapted,
            originalRent: rent // Сохраняем оригинальный объект для доступа к статусу
          };
        });
      console.log(`🔍 Данные для вкладки "Сдачи":`, data);
      return data;
    }
  };

  // Логика пагинации
  const allData = getAllData();
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(() => {
    const result = allData.slice(startIndex, endIndex);
    console.log('🔍 Orders - вычисляем currentData:', {
      allDataLength: allData.length,
      itemsPerPage,
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      resultLength: result.length
    });
    return result;
  }, [allData, startIndex, endIndex, currentPage]);

  console.log(`🔍 Текущие данные для отображения:`, currentData);

  if (isLoading) {
    return (
      <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px' }}>
        <div className='data'>
          <p className='editing_text'>Заказы</p>
          <div style={{ width: '1400px', margin: '0 auto', marginTop: 30, textAlign: 'center' }}>
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px' }}>
        <div className='data'>
          <p className='editing_text'>Заказы</p>
          <div style={{ width: '1400px', margin: '0 auto', marginTop: 30, textAlign: 'center' }}>
            <p style={{ color: '#d2514b' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px' }}>
      <div className='data'>
        <p className='editing_text'>Заказы</p>
        <div style={{ width: '1400px', margin: '0 auto', marginTop: 30 }}>
                     <div style={{ display: 'flex', gap: 10, marginBottom: 30, marginLeft: 90 }}>
             {['Аренды', 'Сдачи'].map(tab => (
               <div key={tab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => {
                 console.log(`🔍 Переключаемся на вкладку: ${tab}`);
                 console.log(`🔍 Текущие данные перед переключением:`);
                 console.log(`🔍 myRents:`, myRents);
                 console.log(`🔍 myProductRents:`, myProductRents);
                 
                 setActiveTab(tab);
               }}>
                <span style={{
                  color: activeTab === tab ? '#ffdc64' : '#bbb',
                  fontWeight: 500,
                  fontSize: 22,
                  transition: 'color 0.2s',
                  padding: '0 8px',
                  borderRadius: 2
                }}>{tab}</span>
                <div style={{
                  height: 3,
                  width: '100%',
                  background: activeTab === tab ? '#ffdc64' : 'transparent',
                  marginTop: 16,
                  borderRadius: 2,
                  transition: 'background 0.2s'
                }} />
              </div>
            ))}
          </div>
          
          {allData.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
              <p style={{ fontSize: '18px', color: '#53515E' }}>
                {activeTab === 'Аренды' ? 'У вас пока нет аренд' : 'У вас пока нет сдач в аренду'}
              </p>
            </div>
          ) : (
            <table style={{ width: '86.3%', borderCollapse: 'collapse', margin: '0 67px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', height: '90px' }}>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '22px', color: '#53515E', width: '30%' }}>Объявления</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '22px', color: '#53515E', width: '25%' }}>Даты</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '22px', color: '#53515E', width: '25%' }}>Статус</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '22px', color: '#53515E', width: '25%' }}>Контактная информация</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(order => (
                  <tr key={order.id} style={{ borderBottom: '2px solid #ddd', height: '60px' }}>
                    <td style={{
                      padding: '12px',
                      textAlign: 'left',
                      width: '30%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '15px', 
                          justifyContent: 'flex-start',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          
                          handleProductClick(order.originalRent?.Product?.idProduct);
                        }}
                      >
                        <img src={order.image} alt={order.title} style={{ width: '100px', height: '100px', objectFit: 'cover', border: '1px solid #ddd' }} />
                        <span style={{ fontSize: '19px', fontWeight: '500', color: '#53515f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '260px' }}>{order.title}</span>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      width: '25%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <span style={{ fontSize: '19px', color: '#3b3b3b' }}>{order.startDate} - {order.endDate}</span>
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      width: '25%'
                    }}>
                      <span style={{ fontSize: '19px', fontWeight: '500', color: getStatusColor(order.status) }}>{order.status}</span>
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      width: '25%'
                    }}>
                      <span style={{ fontSize: '19px', color: '#53515f', display: 'block' }}>{order.contact.name}</span>
                      <span style={{ fontSize: '17px', color: '#3b3b3b', display: 'block', marginTop: 2 }}>{order.contact.phone}</span>
                      
                      {/* Кнопки управления для владельца товара */}
                      {activeTab === 'Сдачи' && order.originalRent && order.originalRent.status === 'pending' && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 5, justifyContent: 'center' }}>
                          {/* Кнопки убраны */}
                        </div>
                      )}
                      
                      {/* Кнопка отмены для арендатора */}
                      {activeTab === 'Аренды' && order.originalRent && order.originalRent.status === 'pending' && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            onClick={() => handleCancelRent(order.id)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '14px',
                              backgroundColor: '#d2514b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Отменить
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Пагинация */}
          {allData.length > 0 && totalPages > 1 && (
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={allData.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

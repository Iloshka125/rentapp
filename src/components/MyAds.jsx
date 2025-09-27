import React, { useState, useEffect } from 'react';
import { FiChevronDown } from "react-icons/fi";
import { Pagination } from './Pagination';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import { useNavigate } from 'react-router-dom';

export const MyAds = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ads, setAds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [animatingId, setAnimatingId] = useState(null);
    const itemsPerPage = 5; // Количество объявлений на странице

    // Загрузка объявлений пользователя
    const loadUserAds = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await productService.getUserProducts();
            console.log('🔍 MyAds: ответ от getUserProducts:', response);
            
            // Проверяем структуру ответа
            if (response && response.products && Array.isArray(response.products)) {
                console.log('🔍 MyAds: найдено товаров:', response.products.length);
                
                // Преобразуем данные из БД в формат для отображения
                const adaptedAds = response.products.map(product => ({
                    id: product.idProduct,
                    image: product.photo ? `/uploads/${product.photo}` : '/default-image.jpg',
                    title: product.name,
                    startDate: new Date().toLocaleDateString('ru-RU'), // Пока используем текущую дату
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'), // +30 дней
                    status: product.status === 'available' ? "Активен" : "Остановлен" // Используем status из БД
                }));
                console.log('🔍 MyAds: адаптированные объявления:', adaptedAds);
                setAds(adaptedAds);
            } else {
                console.error('🔍 MyAds: некорректный формат ответа:', response);
                setError('Некорректный формат данных от сервера');
            }
        } catch (error) {
            console.error('🔍 MyAds: ошибка при загрузке объявлений:', error);
            setError('Не удалось загрузить объявления: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Загружаем объявления при монтировании компонента
    useEffect(() => {
        console.log('🔍 MyAds: useEffect вызван, user:', user);
        if (user) {
            console.log('🔍 MyAds: пользователь авторизован, загружаем объявления...');
            loadUserAds();
        } else {
            console.log('🔍 MyAds: пользователь не авторизован');
        }
    }, [user]);

    // Логика пагинации
    const totalPages = Math.ceil(ads.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAds = ads.slice(startIndex, endIndex);
    
    // Отладочная информация
    console.log('🔍 MyAds пагинация:', {
        totalAds: ads.length,
        itemsPerPage,
        totalPages,
        currentPage,
        startIndex,
        endIndex,
        currentAdsCount: currentAds.length
    });

    const getStatusColor = (status) => {
        return status === "Активен" ? "#58bf59" : "#ffdc64";
    };

    const toggleStatus = async (id) => {
        try {
            console.log('🔍 MyAds: toggleStatus вызван для ID:', id);
            setAnimatingId(id); // запускаем анимацию
            
            // Определяем новый статус
            const currentAd = ads.find(ad => ad.id === id);
            const newStatus = currentAd.status === "Активен" ? "unavailable" : "available";
            console.log('🔍 MyAds: текущий статус:', currentAd.status, 'новый статус:', newStatus);
            
            // Обновляем статус в БД
            console.log('🔍 MyAds: вызываем productService.updateProductStatus...');
            await productService.updateProductStatus(id, newStatus);
            console.log('🔍 MyAds: статус успешно обновлен в БД');
            
            // Обновляем локальное состояние
            setTimeout(() => {
                setAds(prevAds => 
                    prevAds.map(ad => 
                        ad.id === id 
                            ? { ...ad, status: newStatus === "available" ? "Активен" : "Остановлен" }
                            : ad
                    )
                );
                setAnimatingId(null); // сброс анимации
                console.log('🔍 MyAds: локальное состояние обновлено');
            }, 200); // задержка на fade-out
            
            // Показываем уведомление
            if (window.showAlert) {
                window.showAlert(`Объявление ${newStatus === "available" ? "активировано" : "остановлено"}`, 'success');
            }
        } catch (error) {
            console.error('🔍 MyAds: ошибка при обновлении статуса:', error);
            setAnimatingId(null); // сброс анимации в случае ошибки
            
            if (window.showAlert) {
                window.showAlert('Ошибка при обновлении статуса: ' + error.message, 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        // Запрашиваем подтверждение удаления
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить это объявление?');
        
        if (!isConfirmed) {
            return; // Отменяем удаление если пользователь не подтвердил
        }
        
        try {
            console.log('🔍 MyAds: handleDelete вызван для ID:', id);
            console.log('🔍 MyAds: вызываем productService.deleteProduct...');
            await productService.deleteProduct(id);
            console.log('🔍 MyAds: объявление успешно удалено из БД');
            
            // Обновляем список объявлений
            setAds(prevAds => prevAds.filter(ad => ad.id !== id));
            console.log('🔍 MyAds: локальное состояние обновлено');
            
            // Показываем уведомление об успешном удалении
            if (window.showAlert) {
                window.showAlert('Объявление успешно удалено', 'success');
            }
        } catch (error) {
            console.error('🔍 MyAds: ошибка при удалении объявления:', error);
            // Показываем уведомление об ошибке
            if (window.showAlert) {
                window.showAlert('Ошибка при удалении объявления: ' + error.message, 'error');
            }
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Функция для перехода к детальному просмотру объявления
    const handleProductClick = (productId) => {
        navigate(`/card/${productId}`);
    };

    return (
        <div className='border_pd flex flex-col items-center' style={{ 
            position: 'absolute',
            left: '459px',
            top: '151px'
        }}>
            <div className='data'>
                <p className='editing_text'>Мои объявления</p>
                <div className='w-[1400px] h-[900px] flex flex-col' style={{ 
                    position: 'absolute',
                    top: '143px'
                }}>
                    {isLoading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-[#53515E] text-xl">Загрузка объявлений...</div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-red-500 text-xl">{error}</div>
                            <button 
                                onClick={loadUserAds}
                                className="ml-4 px-4 py-2 bg-[#FFDC64] text-[#53515E] rounded-lg hover:bg-[#FFD700] transition-colors"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && ads.length === 0 && (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-[#53515E] text-xl">У вас пока нет объявлений</div>
                        </div>
                    )}

                    {!isLoading && !error && ads.length > 0 && (
                        <>
                            <table style={{ width: '90%', borderCollapse: 'collapse', margin: '0 67px', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ 
                                        borderTop: '2px solid #ddd',
                                        borderBottom: '2px solid #ddd',
                                        height: '90px'
                                    }}>
                                        <th style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            fontSize: '22px',
                                            color: '#53515E',
                                            width: '35%'
                                        }}>
                                            Объявления
                                        </th>
                                        <th style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            fontSize: '22px',
                                            color: '#53515E',
                                            width: '25%'
                                        }}>
                                            Дата
                                        </th>
                                        <th style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            fontSize: '22px',
                                            color: '#53515E',
                                            width: '25%'
                                        }}>
                                            Статус
                                        </th>
                                        <th style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            fontSize: '22px',
                                            color: '#53515E',
                                            width: '20%'
                                        }}>
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAds.map((ad) => (
                                        <tr key={ad.id} style={{
                                            borderBottom: '1px solid #ddd',
                                            height: '120px'
                                        }}>
                                            <td style={{
                                                padding: '12px',
                                                width: '35%'
                                            }}>
                                                <div 
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '15px',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleProductClick(ad.id)}
                                                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                                >
                                                    <img 
                                                        src={ad.image} 
                                                        alt={ad.title} 
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '18px',
                                                        fontWeight: '500',
                                                        color: '#3b3b3b',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {ad.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'center',
                                                width: '25%'
                                            }}>
                                                <span style={{
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    color: '#3b3b3b'
                                                }}>
                                                    {ad.startDate} - {ad.endDate}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'center',
                                                width: '25%'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    width: '180px',
                                                    margin: '0 auto'
                                                }}>
                                                    <span 
                                                        style={{
                                                            fontSize: '19px',
                                                            fontWeight: '500',
                                                            color: getStatusColor(ad.status),
                                                            opacity: animatingId === ad.id ? 0 : 1,
                                                            transform: animatingId === ad.id ? "translateY(-5px)" : "translateY(0)",
                                                            transition: "all 0.3s ease"
                                                        }}
                                                    >
                                                        {ad.status}
                                                    </span>
                                                    <button 
                                                        onClick={() => toggleStatus(ad.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '2px',
                                                            color: '#3b3b3b',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <FiChevronDown size={22} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'center',
                                                width: '20%'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '2px',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <button 
                                                        onClick={() => navigate(`/publication/edit/${ad.id}`)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '5px'
                                                        }}>
                                                        <img 
                                                            src="/Pencil.svg" 
                                                            alt="Редактировать" 
                                                            style={{
                                                                width: '52px',
                                                                height: '52px',
                                                                filter: 'brightness(0) saturate(100%) invert(24%) sepia(8%) saturate(928%) hue-rotate(314deg) brightness(96%) contrast(89%)'
                                                            }}
                                                        />
                                                    </button>
                                                    <button style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '5px'
                                                    }} onClick={() => handleDelete(ad.id)}>
                                                        <img 
                                                            src="/Trash.svg" 
                                                            alt="Удалить" 
                                                            style={{
                                                                width: '52px',
                                                                height: '52px',
                                                                filter: 'brightness(0) saturate(100%) invert(24%) sepia(8%) saturate(928%) hue-rotate(314deg) brightness(96%) contrast(89%)'
                                                            }}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* Пагинация */}
                            {totalPages > 1 && (
                                <div style={{ marginTop: '20px', marginLeft: '67px' }}>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={ads.length}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { MdOutlineCalendarMonth ,MdOutlineAddPhotoAlternate, MdArrowBack, MdArrowDropDown} from "react-icons/md";
import { Popper, ClickAwayListener, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DatePicker } from 'antd';
const { RangePicker } = DatePicker;
import './RangePickerCustom.css';
import ru_RU from 'antd/es/date-picker/locale/ru_RU';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getUploadUrl } from '../config/config';
import { productService } from '../services/productService';
import { useAlertContext } from '../contexts/AlertContext';
import { getCities, searchCities } from '../data/cities';

// Удаляю все импорты MUI-календарей и dayjs, оставляю только RangePicker

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFDC64',
      contrastText: '#53515E',
    },
  },
  components: {
    MuiPickersDay: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: '#FFDC64',
            color: '#53515E',
            '&:hover, &:focus': {
              backgroundColor: '#FFDC64',
            },
          },
        },
        dayInRange: {
          backgroundColor: 'rgba(255, 220, 100, 0.2)',
          color: '#53515E',
          '&.MuiPickersDay-rangeStart, &.MuiPickersDay-rangeEnd': {
            backgroundColor: '#FFDC64',
            color: '#53515E',
          },
        },
      },
    },
    // Удаляем MuiOutlinedInput override
  },
});

function CustomDateRangeInput({ value, onClick, error }) {
  const isEmpty = !value[0] || !value[1];
  let display = 'Начало → Окончание';
  if (value[0] && value[1]) {
    display = `${dayjs(value[0]).format('DD.MM.YYYY')} → ${dayjs(value[1]).format('DD.MM.YYYY')}`;
  }
  return (
    <div
      tabIndex={0}
      onClick={onClick}
      className={`w-full h-[50px] px-4 pr-12 border-2 rounded-[17px] flex items-center justify-center text-[20px] relative cursor-pointer transition-colors bg-white gap-4
        ${error ? 'border-red-500' : 'border-[#605F6D66] hover:border-[#FFDC64] focus-within:border-[#53515E]'}`}
      style={{ outline: 'none', userSelect: 'none' }}
    >
      <span className={`select-none flex items-center gap-1 ${isEmpty ? '' : 'text-[#53515E]'}`}>{display}</span>
      <span className="flex items-center justify-center h-full">
        <MdOutlineCalendarMonth className="text-2xl text-[#605F6D80]" />
      </span>
    </div>
  );
}

export default function Publication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Получаем ID для редактирования
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Флаг редактирования
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    price: '',
    dateRange: [null, null],
    images: []
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dateError, setDateError] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true); // добавлено состояние выбора начала/окончания
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Состояния для выпадающего списка городов
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const categories = [
    '',
    'Электроинструменты',
    'Бензоинструменты',
    'Ручные инструменты',
    'Сварочное оборудование',
    'Генераторы',
    'Компрессоры и насосы',
    'Станки',
    'Садовая техника'
  ];

  // Загружаем данные для редактирования
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadProductForEdit();
    }
  }, [id]);

  // Закрытие выпадающего списка городов при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownOpen && !event.target.closest('.relative')) {
        setCityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cityDropdownOpen]);

  const loadProductForEdit = async () => {
    try {
      setIsLoading(true);
      const product = await productService.getProductById(id);
      
      // Заполняем форму данными продукта
      setFormData({
        title: product.name || '',
        category: product.category || '',
        description: product.description || '',
        location: '', // В БД нет поля location
        price: product.price ? product.price.toString() : '',
        dateRange: [null, null], // В БД нет полей дат
        images: product.photo ? [{ name: product.photo, url: getUploadUrl(product.photo) }] : []
      });
    } catch (error) {
      console.error('Ошибка при загрузке продукта для редактирования:', error);
      showError('Не удалось загрузить данные для редактирования');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка городов
  const loadCities = async () => {
    try {
      setIsLoadingCities(true);
      const citiesData = await getCities();
      setCities(citiesData);
      setFilteredCities(citiesData.slice(0, 20)); // Показываем первые 20 городов
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
      showError('Не удалось загрузить список городов');
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Поиск городов
  const handleCitySearch = async (query) => {
    setCitySearchQuery(query);
    if (query.trim() === '') {
      setFilteredCities(cities.slice(0, 20));
      return;
    }
    
    try {
      const searchResults = await searchCities(query);
      setFilteredCities(searchResults);
    } catch (error) {
      console.error('Ошибка поиска городов:', error);
    }
  };

  // Выбор города
  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, location: city }));
    setCityDropdownOpen(false);
    setCitySearchQuery('');
    setFilteredCities(cities.slice(0, 20));
  };

  // Обработка клика по полю местоположения
  const handleLocationClick = () => {
    if (cities.length === 0) {
      loadCities();
    }
    setCityDropdownOpen(true);
  };

  const handleCategorySelect = (cat) => {
    setFormData(prev => ({ ...prev, category: cat }));
    setCategoryDropdownOpen(false);
  };

  const handleDateInputClick = (e) => {
    setAnchorEl(e.currentTarget);
    setCalendarOpen(true);
    setSelectingStart(true); // всегда начинаем с выбора начала
  };
  const handleDateChange = (isStart, newValue) => {
    setFormData(prev => {
        const newRange = [...prev.dateRange];
        if (isStart) {
            newRange[0] = newValue;
            // Если дата начала позже даты окончания, сбрасываем дату окончания
            if (newValue && newRange[1] && newValue.isAfter(newRange[1])) {
                newRange[1] = null;
            }
        } else {
            newRange[1] = newValue;
        }
        setDateError(!newRange[0] || !newRange[1]);
        if(newRange[0] && newRange[1]) setCalendarOpen(false);
        return { ...prev, dateRange: newRange };
    });
  };
  const handleCalendarClose = () => setCalendarOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Если изменяется поле местоположения, обновляем поиск
    if (name === 'location') {
      handleCitySearch(value);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => {
      const newImages = [...prev.images, ...files].slice(0, 10);
      return { ...prev, images: newImages };
    });
    // Сброс input, чтобы можно было выбрать те же файлы снова
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    if (!formData.title.trim()) {
      showError('Введите название объявления');
      return;
    }
    
    if (!formData.category || formData.category === '') {
      showError('Выберите категорию');
      return;
    }
    
    if (!formData.description.trim()) {
      showError('Введите описание объявления');
      return;
    }
    
    if (!formData.location.trim()) {
      showError('Введите местоположение');
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      showError('Введите корректную цену');
      return;
    }
    
    if (!formData.dateRange[0] || !formData.dateRange[1]) {
      showError('Выберите период аренды');
      return;
    }
    
    // Логируем выбранные даты для отладки
    console.log('🔍 [FRONTEND] Валидация дат:');
    console.log('🔍 [FRONTEND] dateRange[0]:', formData.dateRange[0]);
    console.log('🔍 [FRONTEND] dateRange[1]:', formData.dateRange[1]);
    console.log('🔍 [FRONTEND] dateRange[0] тип:', typeof formData.dateRange[0]);
    console.log('🔍 [FRONTEND] dateRange[1] тип:', typeof formData.dateRange[1]);
    
    if (formData.images.length === 0) {
      showError('Добавьте хотя бы одну фотографию');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing) {
        // Обновляем существующий продукт
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.title.trim());
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description.trim());
        formDataToSend.append('price', parseFloat(formData.price));
        formDataToSend.append('city', formData.location.trim()); // Добавляем город
        
        // Добавляем даты начала и окончания доступности
        if (formData.dateRange[0] && formData.dateRange[1]) {
          const startDate = formData.dateRange[0].toISOString();
          const endDate = formData.dateRange[1].toISOString();
          formDataToSend.append('startdate', startDate);
          formDataToSend.append('enddate', endDate);
          
          console.log('🔍 [FRONTEND] Обновляем даты в FormData:');
          console.log('🔍 [FRONTEND] startdate:', startDate);
          console.log('🔍 [FRONTEND] enddate:', endDate);
        }
        
        // Добавляем все файлы фотографий только если выбраны новые
        if (formData.images.length > 0) {
          formData.images.forEach((image, index) => {
            if (image instanceof File) {
              formDataToSend.append('photo', image);
            }
          });
        }

        // Логируем данные для отладки
        console.log('🔍 [FRONTEND] Отправляем данные для обновления:');
        console.log('🔍 [FRONTEND] name:', formData.title.trim());
        console.log('🔍 [FRONTEND] category:', formData.category);
        console.log('🔍 [FRONTEND] description:', formData.description.trim());
        console.log('🔍 [FRONTEND] price:', parseFloat(formData.price));
        console.log('🔍 [FRONTEND] photo:', formData.images.length > 0 && formData.images[0] instanceof File ? 'новый файл' : 'без изменений');

        await productService.updateProduct(id, formDataToSend);
        showSuccess('Объявление успешно обновлено!');
      } else {
        // Создаем новый продукт
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.title.trim());
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description.trim());
        formDataToSend.append('price', parseFloat(formData.price));
        formDataToSend.append('city', formData.location.trim()); // Добавляем город
        
        // Добавляем даты начала и окончания доступности
        if (formData.dateRange[0] && formData.dateRange[1]) {
          const startDate = formData.dateRange[0].toISOString();
          const endDate = formData.dateRange[1].toISOString();
          formDataToSend.append('startdate', startDate);
          formDataToSend.append('enddate', endDate);
          
          console.log('🔍 [FRONTEND] Добавляем даты в FormData:');
          console.log('🔍 [FRONTEND] startdate:', startDate);
          console.log('🔍 [FRONTEND] enddate:', endDate);
        }
        
        // Добавляем все файлы фотографий
        if (formData.images.length > 0) {
          formData.images.forEach((image, index) => {
            if (image instanceof File) {
              formDataToSend.append('photo', image);
            }
          });
        }

        await productService.createProduct(formDataToSend);
        showSuccess('Объявление успешно создано!');
      }
      
      // Перенаправляем на главную страницу
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      showError('Ошибка при ' + (isEditing ? 'обновлении' : 'создании') + ' объявления: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-[864px] ml-[96px] relative" style={{ minHeight: '100vh' }}>

     {/* Кнопка "Назад" */}
      <button 
        onClick={() => {
          showInfo('Возврат на предыдущую страницу...');
          window.history.back();
        }} 
        className="absolute -top-1 left-1 -ml-20 text-[#53515E] transition-all duration-300 cursor-pointer"
      >
        <MdArrowBack size={39} 
        className="hover:border hover:border-[#53515E] hover:rounded-full p-0 hover:border-[2px]"/>
      </button>

        <form onSubmit={handleSubmit} className="space-y-6 text-[20px] text-[#53515E]">
          
          {/* Название */}
          <div>
            <label htmlFor="title" className="block mb-3 font-medium">Название</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full h-[50px] px-4 mb-5.5 border-2 rounded-[17px] border-[#605F6D66] hover:border-[#FFDC64] transition-colors"
            />
          </div>

          {/* Категория */}
          <div>
            <label htmlFor="category" className="block mb-3 font-medium">Категория</label>
            <div className="relative select-none">
              <div
                className={`w-full h-[50px] px-4 pr-12 border-2 rounded-[17px] flex items-center cursor-pointer bg-white transition-colors ${categoryDropdownOpen ? 'border-[#FFDC64]' : 'border-[#605F6D66] hover:border-[#FFDC64]'} `}
                onClick={() => setCategoryDropdownOpen((v) => !v)}
                tabIndex={0}
                onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 150)}
              >
                <span className={`flex-1 text-left ${formData.category ? 'text-[#53515E]' : 'text-[#605F6D80]'}`}>
                  {formData.category || 'Выберите категорию'}
                </span>
                <MdArrowDropDown className={`text-2xl text-gray-500 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <div
                className={`absolute left-0 top-[54px] w-full z-20 rounded-[17px] bg-white border-2 border-[#605F6D66] shadow-lg overflow-hidden transition-all duration-300 ${categoryDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{boxShadow: categoryDropdownOpen ? '0 8px 24px 0 rgba(0,0,0,0.08)' : 'none'}}
              >
                {categories.slice(1).map((cat) => (
                  <div
                    key={cat}
                    className={`px-4 py-3 cursor-pointer hover:text-black transition-colors ${formData.category === cat ? 'bg-[#FFDC64] text-[#53515E]' : ''}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block mb-3 font-medium">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full h-[304px] px-4 py-3 mb-5.5 border-2 rounded-[17px] border-[#605F6D66] hover:border-[#FFDC64] transition-colors resize-none"
            ></textarea>
          </div>

          {/* Местоположение */}
          <div className="relative">
            <label htmlFor="location" className="block mb-3 font-medium">Местоположение</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              onClick={handleLocationClick}
              onFocus={handleLocationClick}
              className="w-full h-[50px] px-4 mb-5.5 border-2 rounded-[17px] border-[#605F6D66] hover:border-[#FFDC64] transition-colors"
              placeholder="Выберите город"
            />
            
            {/* Выпадающий список городов */}
            {cityDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-[#605F6D66] rounded-[17px] shadow-lg max-h-[200px] overflow-y-auto">
                {isLoadingCities ? (
                  <div className="p-4 text-center text-gray-500">
                    Загрузка городов...
                  </div>
                ) : filteredCities.length > 0 ? (
                  filteredCities.map((city, index) => (
                    <div
                      key={index}
                      onClick={() => handleCitySelect(city)}
                      className="px-4 py-2 hover:text-black cursor-pointer transition-colors"
                    >
                      {city}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Город не найден
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Цена */}
          <div>
            <label htmlFor="price" className="block mb-3 font-medium">Цена</label>
            <div className="flex w-full h-[50px] border-2 rounded-[17px] border-[#605F6D66] hover:border-[#FFDC64] focus-within:border-[#FFDC64] transition-colors price-input-wrapper">
              <span className="flex items-center justify-center px-4 text-[20px] font-semibold">
                ₽
              </span>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className="flex-1 px-4 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Время сдачи */}
          <div className="flex flex-col items-center w-full">
            <label className="block mb-3 text-[#53515E] text-[20px] font-medium text-center w-full">Время сдачи</label>
            <div className="w-full flex justify-center">
              <ConfigProvider theme={{ token: { colorPrimary: '#FFDC64' } }}>
                <RangePicker
                  className="custom-range-picker publication-range-picker"
                  classNames={{
                    popup: {
                      root: "custom-range-picker-dropdown"
                    }
                  }}
                  value={formData.dateRange}
                  onChange={(dates) => {
                    console.log('🔍 [FRONTEND] RangePicker onChange - dates:', dates);
                    if (dates && dates[0] && dates[1]) {
                      const [d1, d2] = dates;
                      const start = d1.isBefore(d2) ? d1 : d2;
                      const end = d1.isBefore(d2) ? d2 : d1;
                      console.log('🔍 [FRONTEND] RangePicker onChange - start:', start);
                      console.log('🔍 [FRONTEND] RangePicker onChange - end:', end);
                      setFormData(prev => ({ ...prev, dateRange: [start, end] }));
                      setDateError(false);
                    } else {
                      setFormData(prev => ({ ...prev, dateRange: dates }));
                      setDateError(!dates || !dates[0] || !dates[1]);
                    }
                  }}
                  format="DD.MM.YYYY"
                  allowClear
                  placeholder={["Начало", "Окончание"]}
                  inputReadOnly
                  locale={ru_RU}
                  disabledDate={(current) => {
                    // Блокируем прошлые дни
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </ConfigProvider>
            </div>
            {dateError && <div className="text-red-500 text-sm mt-1 text-center w-full">Выберите период</div>}
          </div>

          {/* Фотографии */}
          <div>
            <label className="block text-[#53515E] font-medium">Фотографии</label>
            <p className="text-sm text-gray-500 mb-2">Не более 10</p>
            <div className="flex flex-wrap gap-2 items-center">
              {formData.images.length < 10 && (
                <>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center h-[166px] w-[166px] border-2 border-solid border-gray-300 rounded-[17px] hover:border-[#FFDC64] transition-colors bg-white">
                      <MdOutlineAddPhotoAlternate className='cursor-pointer transition-colors text-4xl text-gray-500'/>
                    </div>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={formData.images.length >= 10}
                  />
                </>
              )}
              {formData.images && formData.images.map((img, idx) => (
                <div key={idx} className="relative group flex items-center justify-center h-[166px] w-[166px] border-2 border-solid border-gray-300 rounded-[17px] bg-white overflow-hidden">
                  <img
                    src={typeof img === 'string' ? img : (img.url || URL.createObjectURL(img))}
                    alt={`preview-${idx}`}
                    className="object-cover h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-7 h-7 bg-transparent border-2 border-gray-400 rounded-full text-gray-600 hover:bg-gray-200 transition-all z-10"
                    title="Удалить фото"
                  >
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block bg-gray-400 rounded-full" style={{width:'14px',height:'2px'}}></span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопка */}
          <div className="flex justify-end w-full">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-[330px] h-[50px] border-2 rounded-[17px] mb-12 transition-all duration-300 ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'hover:bg-[#53515E] hover:text-white'
              }`}
              style={{ borderColor: isLoading ? '#ccc' : '#53515E' }}
            >
              {isLoading ? (isEditing ? 'Обновление...' : 'Создание...') : (isEditing ? 'Обновить' : 'Сохранить')}
            </button>
          </div>
        </form>
    </div>
  );
}

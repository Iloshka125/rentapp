import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlertContext } from '../contexts/AlertContext';

export const PersonalData = () => {
    const { user, updateProfile } = useAuth();
    const { showSuccess, showError, showInfo } = useAlertContext();
    
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        birthday: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    // Загружаем данные пользователя при монтировании компонента
    useEffect(() => {
        if (user) {
            try {
                // Преобразуем дату из формата ISO в формат ДД/ММ/ГГГГ
                const formatDateForDisplay = (isoDate) => {
                    if (!isoDate) return '';
                    const date = new Date(isoDate);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                };

                // Преобразуем телефон из формата 8XXXXXXXXXX в +7 (XXX) XXX-XX-XX
                const formatPhoneForDisplay = (phone) => {
                    if (!phone) return '';
                    if (phone.startsWith('8') && phone.length === 11) {
                        const code = phone.substring(1, 4);
                        const part1 = phone.substring(4, 7);
                        const part2 = phone.substring(7, 9);
                        const part3 = phone.substring(9, 11);
                        return `+7 (${code}) ${part1}-${part2}-${part3}`;
                    }
                    return phone;
                };

                // Собираем ФИО в одну строку для отображения
                const fullName = [user.secondName, user.name, user.middleName]
                    .filter(Boolean)
                    .join(' ');
                
                setFormData({
                    fullName: fullName,
                    phone: formatPhoneForDisplay(user.phone),
                    email: user.email || '',
                    birthday: formatDateForDisplay(user.birthday)
                });
                
                // Проверяем email при загрузке данных
                if (user.email) {
                    const emailValidation = validateEmail(user.email);
                    setEmailError(emailValidation.message);
                }
                
                // Показываем информационное сообщение о загрузке данных
            
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                showError('Ошибка при загрузке данных пользователя');
            }
        }
    }, [user, showInfo, showError]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'birthday') {
        // Разрешаем только цифры и слэши
        if (/^[0-9/]*$/.test(value)) {
            // Автоматически ставим слэши
            let formattedValue = value;
                if (value.length === 2 && formData.birthday.length < value.length) {
                formattedValue += '/';
            }
                if (value.length === 5 && formData.birthday.length < value.length) {
                formattedValue += '/';
            }
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else if (name === 'phone') {
            // Разрешаем только цифры, пробелы, скобки, дефисы и +
            if (/^[0-9\s\(\)\-\+]*$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else if (name === 'email') {
            setFormData(prev => ({ ...prev, [name]: value }));
            
            // Валидация email в реальном времени
            if (value.trim()) {
                const emailValidation = validateEmail(value);
                setEmailError(emailValidation.message);
            } else {
                setEmailError(''); // Очищаем ошибку если поле пустое
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const parsePhoneForDB = (phone) => {
        if (!phone) return '';
        // Убираем все символы кроме цифр
        let digits = phone.replace(/\D/g, '');
        
        // Если номер начинается с +7, заменяем на 8
        if (digits.startsWith('7') && digits.length === 11) {
            digits = '8' + digits.substring(1);
        }
        
        // Если номер начинается с 8 и имеет 11 цифр, оставляем как есть
        if (digits.startsWith('8') && digits.length === 11) {
            return digits;
        }
        
        // Если номер имеет 10 цифр, добавляем 8 в начало
        if (digits.length === 10) {
            return '8' + digits;
        }
        
        return digits;
    };

    const parseDateForDB = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return null;
    };

    const parseNameForDB = (fullName) => {
        if (!fullName) return { name: '', secondName: '', middleName: '' };
        
        // Убираем лишние пробелы и разбиваем по пробелам
        const parts = fullName.trim().split(/\s+/);
        
        if (parts.length === 1) {
            // Только имя
            return { name: parts[0], secondName: '', middleName: '' };
        } else if (parts.length === 2) {
            // Фамилия и имя
            return { name: parts[1], secondName: parts[0], middleName: '' };
        } else if (parts.length >= 3) {
            // Фамилия, имя и отчество
            return { name: parts[1], secondName: parts[0], middleName: parts[2] };
        }
        
        return { name: '', secondName: '', middleName: '' };
    };

    // Функция валидации email
    const validateEmail = (email) => {
        if (!email.trim()) return { isValid: true, message: '' }; // Пустой email разрешен
        
        // Регулярное выражение для проверки email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!emailRegex.test(email.trim())) {
            return { 
                isValid: false, 
                message: 'Введите корректный email адрес (например: user@example.com)' 
            };
        }
        
        // Проверяем длину email
        if (email.trim().length > 254) {
            return { 
                isValid: false, 
                message: 'Email адрес слишком длинный (максимум 254 символа)' 
            };
        }
        
        // Проверяем, что email не содержит только точки или специальные символы
        if (/^[._%+-]+$/.test(email.split('@')[0])) {
            return { 
                isValid: false, 
                message: 'Email адрес содержит некорректные символы' 
            };
        }
        
        return { isValid: true, message: '' };
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            showInfo('Сохранение данных...');
            console.log('🔍 PersonalData: начало сохранения данных');
            
            // Валидация
            if (!formData.fullName.trim()) {
                showError('Пожалуйста, введите ФИО');
                return;
            }

            if (!formData.phone.trim()) {
                showError('Пожалуйста, введите номер телефона');
                return;
            }

            if (!formData.birthday.trim()) {
                showError('Пожалуйста, введите дату рождения');
                return;
            }
            
            // Дополнительная валидация
            if (formData.phone.trim() && formData.phone.replace(/\D/g, '').length < 10) {
                showError('Номер телефона должен содержать минимум 10 цифр');
                return;
            }
            
            if (formData.birthday.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.birthday)) {
                showError('Дата рождения должна быть в формате ДД/ММ/ГГГГ');
                return;
            }

            // Валидация email
            if (formData.email.trim()) {
                const emailValidation = validateEmail(formData.email);
                if (!emailValidation.isValid) {
                    showError(emailValidation.message);
                    return;
                }
            }
            
            // Проверяем, что нет ошибок email перед сохранением
            if (emailError) {
                showError('Исправьте ошибки в поле email перед сохранением');
                return;
            }

            // Парсим ФИО в отдельные поля
            const { name: firstName, secondName, middleName } = parseNameForDB(formData.fullName.trim());
            console.log('🔍 PersonalData: парсинг ФИО:', { firstName, secondName, middleName });
            
            // Преобразуем данные для отправки в БД
            const updateData = {
                name: firstName,
                secondName,
                middleName,
                phone: parsePhoneForDB(formData.phone),
                birthday: parseDateForDB(formData.birthday)
            };

            // Добавляем email только если он заполнен
            if (formData.email.trim()) {
                updateData.email = formData.email.trim();
            }
            
            console.log('🔍 PersonalData: данные для обновления:', updateData);

            await updateProfile(updateData);
            console.log('🔍 PersonalData: данные успешно обновлены');
            showSuccess('Данные успешно обновлены!');
            
            
            
            // Очищаем поля после успешного сохранения
            setFormData(prev => ({
                ...prev,
                fullName: '',
                phone: '',
                email: '',
                birthday: ''
            }));
            
            // Очищаем ошибку email
            setEmailError('');
            
        } catch (error) {
            console.error('🔍 PersonalData: ошибка при сохранении:', error);
            showError(error.message || 'Ошибка при обновлении данных');
        } finally {
            setIsLoading(false);
        }
    };



    if (!user) {
        return (
            <div className='border_pd flex flex-col items-center' style={{ 
                position: 'absolute',
                left: '459px',
                top: '151px'
            }}>
                <div className='data'>
                    <p className='editing_text'>Загрузка данных...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='border_pd flex flex-col items-center' style={{ 
            position: 'absolute',
            left: '459px',
            top: '151px'
        }}>
            <div className='data'>
                <p className='editing_text'>Редактирование личных данных</p>
                <div className='w-[520px] h-[456px] flex flex-col items-center' style={{ 
                    position: 'absolute',
                    top: '143px'
                }}>
                    <div className='flex flex-col items-center' style={{ marginBottom: '40px' }}>
                        <p className='fio'>ФИО</p>
                        <input 
                            type='text' 
                            className='border_input'
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Фамилия Имя Отчество"
                        />
                    </div>
                    <div className='flex flex-col items-center' style={{ marginBottom: '40px' }}>
                        <p className='fio'>Телефон</p>
                        <input 
                            type='text' 
                            className='border_input'
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+7 (XXX) XXX-XX-XX"
                        />
                    </div>
                    <div className='flex flex-col items-center' style={{ marginBottom: '40px' }}>
                        <p className='fio'>Почта <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>(необязательно)</span></p>
                        <input 
                            type='email' 
                            className={`border_input ${emailError ? 'border-red-500' : ''}`}
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                                if (e.target.value.trim()) {
                                    const emailValidation = validateEmail(e.target.value);
                                    setEmailError(emailValidation.message);
                                }
                            }}
                            placeholder="email@example.com"
                        />
                        {emailError && (
                            <p className='text-red-500 text-sm mt-1 text-center' style={{ maxWidth: '300px' }}>
                                {emailError}
                            </p>
                        )}
                    </div>
                    <div className='flex flex-col items-center' style={{ marginBottom: '60px' }}>
                        <p className='fio'>Дата рождения</p>
                        <input 
                            type='text' 
                            className='border_input' 
                            placeholder='дд/мм/гггг'
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleInputChange}
                            maxLength={10}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <button 
                            className='save_but'
                            onClick={handleSave}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.6 : 1 }}
                        >
                            {isLoading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

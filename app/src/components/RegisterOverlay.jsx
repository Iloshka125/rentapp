import React, { useState } from "react";
import { FaVk, FaEye, FaEyeSlash } from "react-icons/fa6";
import "./RegisterOverlay.css";
import { useAuth } from "../contexts/AuthContext";
import { useAlertContext } from "../contexts/AlertContext";

export const RegisterOverlay = ({ onClose, animated = true, onVKLogin }) => {
  const { login, register } = useAuth();
  const { showSuccess, showError } = useAlertContext();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Закрываем окно при клике по затемнённому фону
  const handleBackdropClick = (e) => {
    e.preventDefault();
    onClose();
  };

  const handleVKClick = () => {
    if (onVKLogin) {
      onVKLogin();
    }
  };

  // Обработка регистрации
  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('🔍 RegisterOverlay: начало регистрации');
    
    // Валидация
    if (!name.trim() || !phoneNumber.trim() || !birthDate.trim() || !password.trim() || !confirmPassword.trim()) {
      showError('Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      showError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      showError('Пароль должен содержать минимум 6 символов');
      return;
    }

    // Преобразование даты в формат ISO
    const [day, month, year] = birthDate.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    try {
      setIsLoading(true);
      // Парсим ФИО в отдельные поля
      const { name: firstName, secondName, middleName } = parseNameForDB(name.trim());
      
      const result = await register({
        name: firstName,
        secondName,
        middleName,
        phone: parsePhoneForDB(phoneNumber),
        birthday: isoDate,
        password: password,
        email: email.trim() || null
      });
      
      console.log('🔍 RegisterOverlay: регистрация успешна, результат:', result);
      showSuccess('Регистрация успешна!');
      console.log('🔍 RegisterOverlay: вызываем onClose()');
      onClose();
    } catch (error) {
      console.error('🔍 RegisterOverlay: ошибка при регистрации:', error);
      showError(error.message || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка входа
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔍 RegisterOverlay: начало входа');
    
    // Валидация
    if (!phoneNumber.trim() && !email.trim()) {
      showError('Пожалуйста, введите телефон или email');
      return;
    }

    if (!password.trim()) {
      showError('Пожалуйста, введите пароль');
      return;
    }

    // Дополнительная валидация email
    if (email.trim() && (!email.includes('@') || !email.includes('.'))) {
      showError('Пожалуйста, введите корректный email');
      return;
    }

    try {
      setIsLoading(true);
      
      // Определяем тип входа и подготавливаем данные
      const loginData = {
        password: password
      };

      if (phoneNumber.trim()) {
        // Вход по телефону
        loginData.phone = parsePhoneForDB(phoneNumber);
        loginData.email = null;
      } else if (email.trim()) {
        // Вход по email
        loginData.email = email.trim();
        loginData.phone = null;
      }

      const result = await login(loginData);
      
      console.log('🔍 RegisterOverlay: вход успешен, результат:', result);
      showSuccess('Вход выполнен успешно!');
      console.log('🔍 RegisterOverlay: вызываем onClose()');
      onClose();
    } catch (error) {
      console.error('🔍 RegisterOverlay: ошибка при входе:', error);
      showError(error.message || 'Ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для маски номера телефона +7 (XXX) XXX-XX-XX (только для отображения)
  const formatPhoneNumber = (value) => {
    // Убираем все символы кроме цифр
    const numbers = value.replace(/\D/g, '');
    
    // Ограничиваем длину до 11 цифр
    const limitedNumbers = numbers.slice(0, 11);
    
    // Форматируем номер телефона для отображения
    let formatted = '';
    if (limitedNumbers.length > 0) {
      formatted = '+7';
      if (limitedNumbers.length > 1) {
        formatted += ` (${limitedNumbers.slice(1, 4)}`;
        if (limitedNumbers.length > 4) {
          formatted += `) ${limitedNumbers.slice(4, 7)}`;
          if (limitedNumbers.length > 7) {
            formatted += `-${limitedNumbers.slice(7, 9)}`;
            if (limitedNumbers.length > 9) {
              formatted += `-${limitedNumbers.slice(9, 11)}`;
            }
          }
        }
      }
    }
    
    return formatted;
  };

  // Функция для преобразования номера в формат для БД (89281716796)
  const parsePhoneForDB = (phoneNumber) => {
    // Убираем все символы кроме цифр
    const numbers = phoneNumber.replace(/\D/g, '');
    
    // Если номер начинается с 7, заменяем на 8
    if (numbers.length === 11 && numbers.startsWith('7')) {
      return '8' + numbers.slice(1);
    }
    
    // Если номер начинается с 8, оставляем как есть
    if (numbers.length === 11 && numbers.startsWith('8')) {
      return numbers;
    }
    
    // Если номер короче 11 цифр, добавляем 8 в начало
    if (numbers.length === 10) {
      return '8' + numbers;
    }
    
    // Возвращаем номер как есть, если он не соответствует формату
    return numbers;
  };

  // Функция для парсинга ФИО в отдельные поля
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

  // Функция для маски даты рождения ДД/ММ/ГГГГ
  const formatBirthDate = (value) => {
    // Убираем все символы кроме цифр
    const numbers = value.replace(/\D/g, '');
    
    // Ограничиваем длину до 8 цифр (ДДММГГГГ)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Форматируем дату
    let formatted = '';
    for (let i = 0; i < limitedNumbers.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += limitedNumbers[i];
    }
    
    return formatted;
  };

  // Обработчик изменения номера телефона в реальном времени
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Обработчик изменения даты рождения в реальном времени
  const handleBirthDateChange = (e) => {
    const formatted = formatBirthDate(e.target.value);
    setBirthDate(formatted);
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const iconStyle = {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#bbb',
    fontSize: 22,
    cursor: 'pointer',
    transition: 'color 0.2s',
    zIndex: 2,
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    // Клик по затемнённому фону закрывает окно
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/40 z-50 flex justify-center items-center"
      onClick={handleBackdropClick}
    >
      {/* Само модальное окно — клик здесь не должен закрывать окно */}
      <div
        className={`bg-white gap-[20px] pt-[20px] pl-[60px] pb-[20px] pr-[60px] rounded-[17px] relative w-[36em] h-[42em] border-[2px] register-overlay-animate${animated ? '' : ' register-overlay-hide'}`}
        style={{ borderColor: '#504e4a' }}
        onClick={(e) => e.stopPropagation()} // Останавливаем всплытие события
      >
        {/* Кнопка Закрыть */}
        <button
          onClick={onClose}
          className="absolute top-[1em] right-[2.5em] text-[#53515E] hover:text-black"
        >
          <img src="/close_icon.svg" className="cursor-pointer w-[40px]" alt="Закрыть" />
        </button>

        {/* Кнопка Назад */}
        {isRegistering && (
          <button
            onClick={() => setIsRegistering(false)}
            className="absolute top-[1em] left-[2.5em] text-[#53515E] hover:text-black"
          >
            <img src="/back_icon.svg" className="cursor-pointer w-[40px]" />
          </button>
        )}

        <h2 className="text-center text_sign pt-[1em]">
          {isRegistering ? "Регистрация" : "Вход"}
        </h2>

        {/* Форма входа или регистрации */}
        {isRegistering ? (
          <form onSubmit={handleRegister} className="register_text pt-[30px]">
            <input 
              type="tel" 
              placeholder="Телефон" 
              className="custom_input" 
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={18}
              required
            />
            <input 
              type="text" 
              placeholder="Имя" 
              className="custom_input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input 
              type="email" 
              placeholder="Email (необязательно)" 
              className="custom_input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="ДД/ММ/ГГГГ" 
              className="custom_input" 
              value={birthDate}
              onChange={handleBirthDateChange}
              maxLength={10}
              required
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Пароль" 
                className="custom_input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44, height: '50px', boxSizing: 'border-box' }}
              />
              <span
                onMouseDown={e => {
                  e.preventDefault();
                  togglePasswordVisibility('password');
                }}
                style={iconStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#53515E')}
                onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
              > 
                <div className="flex items-center justify-center mb-[0.83em]">
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </div>
              </span>
            </div>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Подтвердите пароль" 
                className="custom_input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: 44, height: '50px', boxSizing: 'border-box' }}
              />
              <span
                onMouseDown={e => {
                  e.preventDefault();
                  togglePasswordVisibility('confirmPassword');
                }}
                style={iconStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#53515E')}
                onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
              >
                <div className="flex items-center justify-center mb-[0.83em]">
                  {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                </div>
              </span>
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="btn flex justify-center items-center w-full h-[50px] bg-[#53515E] text-white p-2 rounded-[17px] mb-1 font-medium text-xl mt-[1em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="register_text pt-[30px]">
            <input 
              type="text" 
              placeholder="Телефон или почта" 
              className="custom_input" 
              value={phoneNumber || email}
              onChange={(e) => {
                const value = e.target.value;
                // Если содержит @, считаем это email
                if (value.includes('@')) {
                  setEmail(value);
                  setPhoneNumber('');
                } else {
                  // Если не содержит @, считаем это телефон
                  setPhoneNumber(value);
                  setEmail('');
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                // При потере фокуса дополнительно проверяем формат email
                if (value.includes('@')) {
                                  if (!value.includes('.') || value.indexOf('@') > value.lastIndexOf('.') || value.indexOf('@') === 0) {
                  showError('Пожалуйста, введите корректный email');
                }
                }
              }}
              required
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Пароль" 
                className="custom_input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <span
                onMouseDown={e => {
                  e.preventDefault();
                  togglePasswordVisibility('password');
                }}
                style={iconStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#53515E')}
                onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
              >
                <div className="flex items-center justify-center mb-[0.83em]">  
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </div>
              </span>
            </div>

            {/* Чекбокс с картинками */}
            <div className="remember_password flex justify-between items-center text-sm text-[#605F6D] mt-[3px] gap-[10px] pb-[40px] h-[5em]">
              <label className="flex items-center gap-[6px] ml-[5px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="sr-only"
                />

                {rememberPassword ? (
                  <img src="/CheckboxActive.svg" alt="Checked" className="w-[1.4285714em] h-[1.4285714em]" />
                ) : (
                  <img src="/CheckboxInactive.svg" alt="Unchecked" className="w-[1.4285714em] h-[1.4285714em]" />
                )}

                <span className="ml-[4px]">Запомнить пароль</span>
              </label>

            <span className="forgot_password cursor-pointer hover:underline">Забыли пароль?</span>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="btn flex justify-center items-center w-full h-[50px] bg-[#53515E] text-white p-2 rounded-[17px] mb-1 font-medium text-xl disabled:opacity-50 disabled:cursor-not-allowed mt-[1em] mb-[0.5em]"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            <div className="flex items-center text-[#53515E] text-xl font-normal pt-[0.1em] pb-[0.1em] mb-[0.5em]">
              <div className="flex-grow h-px" />
              или
              <div className="flex-grow h-px" />
            </div>

            <div className="btn flex justify-center items-center w-full h-[50px] bg-[#0077FF] mt-1 text-white rounded-[17px] flex justify-center items-center gap-2 hover:bg-[#0063D5] cursor-pointer" onClick={handleVKClick}>
              <FaVk className="w-[28px] h-[28px]" />
              <span className="text-xl font-medium">Войти с VK ID</span>
            </div>

            <div className="w-full h-[73px] flex items-center justify-center mt-[1em]">
              <p className="text-[15px] text-black font-normal">
                Еще нет аккаунта?{" "}
                <span
                  className="cursor-pointer font-semibold text-[15px] text-[#53515E]"
                  onClick={() => setIsRegistering(true)}
                >
                  Зарегистрироваться
                </span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
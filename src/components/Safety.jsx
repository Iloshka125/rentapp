import React, { useState } from 'react';
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { authService } from '../services/authService';
import { useAlertContext } from '../contexts/AlertContext';

export default function Safety() {
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false
  });
  const [focusedInput, setFocusedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.oldPassword || !formData.newPassword) {
      showError('Пожалуйста, заполните все поля');
      return;
    }

    if (formData.newPassword.length < 6) {
      showError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setIsSubmitting(true);

      await authService.updatePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });

      showSuccess('Пароль успешно изменён!');
      
      // Очищаем форму
      setFormData({
        oldPassword: '',
        newPassword: ''
      });
    } catch (error) {
      console.error('Ошибка при смене пароля:', error);
      
      if (error.message.includes('Старый пароль указан неверно')) {
        showError('Старый пароль указан неверно');
      } else {
        showError('Ошибка при смене пароля. Попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
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
    zIndex: 2
  };

  return (
    <div className='border_pd flex flex-col items-center' style={{ position: 'absolute', left: '459px', top: '151px' }}>
      <div className='data' style={{ width: '100%' }}>
        <p className='editing_text' style={{ textAlign: 'center', marginBottom: 40 }}>Установка нового пароля</p>
        <div style={{ width: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <form onSubmit={handleSubmit} className="space-y-4" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="relative" style={{ marginBottom: 32, width: '100%' }}>
              <label htmlFor="oldPassword" className="text-[20px] font-light block mb-2" style={{ textAlign: 'left', color: '#5a5865' }}>
                Старый пароль
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword.oldPassword ? 'text' : 'password'}
                  id="oldPassword"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('oldPassword')}
                  onBlur={() => setFocusedInput('')}
                  className="w-full h-[50px] px-4 pr-11 py-2 border rounded-[17px] focus:outline-none focus:border-[#FFDC64] border_input"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: 44 }}
                />
                <span
                  onMouseDown={e => {
                    e.preventDefault();
                    togglePasswordVisibility('oldPassword');
                  }}
                  style={iconStyle}
                  onMouseEnter={e => (e.currentTarget.style.color = '#53515E')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                >
                  {showPassword.oldPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>
            <div className="relative" style={{ marginBottom: 32, width: '100%' }}>
              <label htmlFor="newPassword" className="text-[20px] font-light block mb-2" style={{ textAlign: 'left', color: '#5a5865' }}>
                Новый пароль
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword.newPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('newPassword')}
                  onBlur={() => setFocusedInput('')}
                  className="w-full h-[50px] px-4 pr-11 py-2 border rounded-[17px] focus:outline-none focus:border-[#FFDC64] border_input"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: 44 }}
                />
                <span
                  onMouseDown={e => {
                    e.preventDefault();
                    togglePasswordVisibility('newPassword');
                  }}
                  style={iconStyle}
                  onMouseEnter={e => (e.currentTarget.style.color = '#53515E')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                >
                  {showPassword.newPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="save_but"
              style={{ width: 330, alignSelf: 'center', marginTop: 30 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

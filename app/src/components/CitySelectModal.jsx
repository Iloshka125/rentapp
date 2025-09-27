import React, { useState, useMemo, useRef, useEffect } from "react";
import { getCities, searchCities } from "../data/cities";
import { useCity } from "./CityContext";
import "./CitySelectModal.css";

const borderColor = '#504e4a';

export const CitySelectModal = ({ onClose }) => {
  const { city, setCity } = useCity();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(city);
  const inputRef = useRef(null);
  const firstCityRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  // Состояние для загруженных городов
  const [allCities, setAllCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка городов при открытии модала
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        console.log('🔄 Начинаем загрузку городов...');
        const cities = await getCities();
        console.log('✅ Города загружены:', cities.length, 'городов');
        console.log('📋 Первые 5 городов:', cities.slice(0, 5));
        setAllCities(cities);
      } catch (error) {
        console.error('❌ Ошибка загрузки городов:', error);
      } finally {
        setLoading(false);
        console.log('🏁 Загрузка завершена, loading:', false);
      }
    };
    
    loadCities();
  }, []);

  // Фильтрация городов по поиску
  const filteredCities = useMemo(() => {
    console.log('🔍 Фильтрация городов:');
    console.log('🔍 search:', search);
    console.log('🔍 allCities.length:', allCities.length);
    console.log('🔍 allCities.slice(0, 3):', allCities.slice(0, 3));
    
    if (!search.trim()) {
      const result = allCities.slice(0, 100);
      console.log('🔍 Без поиска, показываем первые 100:', result.length);
      return result;
    }
    
    const filtered = allCities.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
    const result = filtered.slice(0, 50);
    console.log('🔍 С поиском, найдено:', filtered.length, 'отфильтровано до:', result.length);
    return result;
  }, [search, allCities]);

  // Клавиатурная навигация
  const [focusedIdx, setFocusedIdx] = useState(-1);
  useEffect(() => {
    setFocusedIdx(-1);
  }, [search]);

  // Фокус на input при открытии
  useEffect(() => {
    inputRef.current?.focus();
    setTimeout(() => setAnimated(true), 10);
  }, []);

  // Фокус на первый город
  const focusFirstCity = () => {
    if (filteredCities.length > 0 && firstCityRef.current) {
      firstCityRef.current.scrollIntoView({ block: 'nearest' });
      setFocusedIdx(0);
    }
  };

  const handleKeyDown = (e) => {
    if (filteredCities.length === 0) return;
    if (e.key === "ArrowDown") {
      setFocusedIdx((idx) => (idx + 1) % filteredCities.length);
    } else if (e.key === "ArrowUp") {
      setFocusedIdx((idx) => (idx - 1 + filteredCities.length) % filteredCities.length);
    } else if (e.key === "Enter") {
      focusFirstCity();
    }
  };

  const handleSearchIconClick = () => {
    focusFirstCity();
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 350);
  };

  const handleSelect = () => {
    setCity(selected);
    handleClose();
  };

  return (
    <div className={`city-modal-overlay fixed inset-0 z-50 flex items-center justify-center ${animated ? 'city-modal-overlay-animate' : 'city-modal-overlay-hide'}`} onClick={handleClose}>
      <div className={`bg-white border-2 rounded-[17px] p-10 w-[950px] max-w-[98vw] flex flex-col items-center shadow-xl relative min-h-[500px] text-[20px] ${animated ? 'city-modal-animate' : 'city-modal-hide'}`} style={{ borderColor }} onClick={e => e.stopPropagation()}>
        {/* Верхняя панель с заголовком и крестиком */}
        <div className="w-full flex items-center justify-between mb-8">
          <h2 className="text-[40px] font-medium text-left" style={{ color: '#000' }}>Выберите город</h2>
          <button
            onClick={handleClose}
            className="p-2"
            aria-label="Закрыть"
            style={{ lineHeight: 0, color: borderColor }}
          >
            <img src="/close_icon.svg" className="w-8 h-8" alt="Закрыть" />
          </button>
        </div>
        <div className="flex w-full mb-2 gap-6">
          <div className="city-modal-search flex-1">
            <label className="city-modal-search-label">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Выберите город"
                className="city-modal-search-input"
                style={{ color: borderColor }}
              />
              <span
                className="city-modal-search-icon"
                tabIndex={0}
                onClick={handleSearchIconClick}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSearchIconClick()}
                role="button"
                aria-label="Фокус на первый город"
              >
                <img src='/search_icon.svg' alt="Поиск" />
              </span>
            </label>
          </div>
          <button
            className={`w-[180px] h-[50px] border-2 rounded-[17px] hover:bg-[#53515E] transition-colors text-[20px] font-normal ml-12 mr-3.5 ${selected ? '' : 'opacity-50 pointer-events-none'}`}
            style={{ borderColor, color: borderColor, fontWeight: 400 }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.setProperty('color', '#fff', 'important'); }}
            onMouseOut={e => { e.currentTarget.style.color = borderColor; e.currentTarget.style.setProperty('color', borderColor, 'important'); }}
            disabled={!selected || selected === city}
            onClick={handleSelect}
          >
            Выбрать
          </button>
        </div>
        <div className="w-full mb-6">
          <p className="text-[18px] select-none text-left pl-1" style={{ color: 'rgba(80, 78, 74, 0.5)' }}>Выберите город в поиске или выберите из списка популярных</p>
        </div>
        <div className="w-full max-h-[330px] overflow-y-auto" style={{ minHeight: 330, maxHeight: 330 }}>
          {loading ? (
            <div className="col-span-3 text-center py-8" style={{ color: borderColor }}>
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor }}></div>
                <span>Загрузка городов...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 m-4 p-0">
              {filteredCities.length === 0 && (
                <div className="col-span-3 text-center py-8" style={{ color: borderColor }}>Нет такого города</div>
              )}
              {filteredCities.map((c, idx) => (
              <div
                key={c}
                ref={idx === 0 ? firstCityRef : undefined}
                className={`city-modal-city px-3 py-2 rounded-[10px] cursor-pointer text-left select-none transition-all duration-150
                  ${selected === c ? 'color-black' : ''}
                  ${focusedIdx === idx ? 'city-modal-city--hover' : ''}`}
                style={{
                  color: selected === c ? '#000' : borderColor,
                  minHeight: '32px',
                  lineHeight: '32px',
                  fontSize: '20px',
                  fontWeight: selected === c ? 500 : 400,
                  display: 'block',
                  zIndex: focusedIdx === idx ? 1 : 0,
                }}
                onClick={() => setSelected(c)}
                onMouseEnter={() => setFocusedIdx(idx)}
                tabIndex={0}
                aria-selected={selected === c}
                onMouseOver={e => {
                  if (selected !== c) e.currentTarget.style.color = '#000';
                }}
                onMouseOut={e => {
                  if (selected !== c) e.currentTarget.style.color = borderColor;
                }}
              >
                {c}
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
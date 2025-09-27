import { useLocation, useNavigate, Link } from 'react-router-dom';
import { IoLocationOutline } from "react-icons/io5";
import { TfiSearch } from "react-icons/tfi";
import { useCity } from "./CityContext";
import { useSearch } from "./SearchContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export const NavBar = ({ onLoginClick, onCityClick }) => {
  const { isAuthenticated, user, logout } = useAuth();
    const location = useLocation();
    const minimal = location.pathname === '/publication';
    const navigate = useNavigate();
    const { city } = useCity();
    const { updateSearchQuery, searchQuery } = useSearch();
    const [searchInput, setSearchInput] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Синхронизируем поисковое поле с контекстом только при переходе на каталог
    useEffect(() => {
        if (location.pathname === '/catalog' && searchQuery && !searchInput) {
            // Если перешли на каталог и есть поисковый запрос, но поле пустое - заполняем его
            setSearchInput(searchQuery);
        }
    }, [location.pathname, searchQuery]);

    // Очищаем поисковое поле при переходе на главную страницу
    useEffect(() => {
        if (location.pathname === '/') {
            setSearchInput('');
        }
    }, [location.pathname]);



    // Cleanup для timeout при размонтировании
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        
        // Всегда обновляем локальное состояние
        setSearchInput(value);
        
        // Динамический поиск с debounce (задержка 500ms)
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        const newTimeout = setTimeout(() => {
            if (value.trim()) {
                updateSearchQuery(value.trim());
                
                // Если мы не на странице каталога, переходим туда
                if (location.pathname !== '/catalog') {
                    navigate('/catalog');
                }
            } else {
                // Если поле пустое, очищаем поиск
                updateSearchQuery('');
            }
        }, 500);
        
        setSearchTimeout(newTimeout);
    };



    const handleSearch = (e) => {
        e.preventDefault();
        
        // При нажатии Enter сразу выполняем поиск без задержки
        if (searchInput.trim()) {
            const trimmedQuery = searchInput.trim();
            
            // Очищаем предыдущий timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
            }
            
            updateSearchQuery(trimmedQuery);
            
            // Переходим на каталог, если не там
            if (location.pathname !== '/catalog') {
                navigate('/catalog');
            }
        }
    };

    const handleSearchIconClick = () => {
        // При клике на иконку сразу выполняем поиск без задержки
        if (searchInput.trim()) {
            const trimmedQuery = searchInput.trim();
            
            // Очищаем предыдущий timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
            }
            
            updateSearchQuery(trimmedQuery);
            
            // Переходим на каталог, если не там
            if (location.pathname !== '/catalog') {
                navigate('/catalog');
            }
        }
    };

    const handleLogoClick = () => {
        // Очищаем поисковый запрос в контексте при переходе на главную
        updateSearchQuery('');
        setSearchInput(''); // Очищаем поисковое поле
        navigate('/');
    };

    const handleMainPageClick = () => {
        // Очищаем поисковый запрос в контексте при переходе на главную
        updateSearchQuery('');
        setSearchInput(''); // Очищаем поисковое поле
        // Очистка поиска произойдет автоматически в Mainpage компоненте
    };



    return (
        <div className="flex items-center border-b-[1px] main_nav_div bg-white h-[121px]">
            <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-[50px] w-[50px] cursor-pointer"
                onClick={handleLogoClick}
                style={{marginLeft: '63px'}}
            />
            {minimal ? (
              <span className="cursor-pointer text_nav flex items-center gap-[10px] w-[268.25px] h-[61px]"
                    onClick={handleLogoClick}
              >
                  <h className="w-[268.25px]" style={{marginLeft: '-0.46em', fontSize: '50px'}}>Discway</h>
              </span>
            ) : (
              <div className="flex items-center w-[528.33px] h-[61px] gap-[10px]">
                  <span className="cursor-pointer text_nav flex items-center gap-[10px] w-[268.25px] h-[61px]"
                        onClick={handleLogoClick}
                  >
                      <h className="w-[268.25px]" style={{marginLeft: '-0.46em', fontSize: '50px'}}>Discway</h>
                  </span>
                  <div className="group/location cursor-pointer flex items-center justify-center w-[190.09px] h-[60px] p-[15px]-[30px]-[15px]-[30px] ml-[-23px]"
                       onClick={onCityClick}
                  >
                      <p className="text-[#53515E] text_city group-hover/location:text-[#FFDC64]" style={{marginLeft: '1px'}}>
                          {city}
                      </p>
                      <img 
                          src="/location_icon.svg" 
                          alt="Location" 
                          className="ml-[11px] block group-hover/location:hidden"
                      />
                      <img 
                          src="/location_icon_active.svg" 
                          alt="Location" 
                          className="ml-[11px] hidden group-hover/location:block"
                      />
                  </div>
              </div>
            )}

            {!minimal && (
            <form onSubmit={handleSearch} className="input border_label h-[50px] rounded-[17px] border-[2px] w-[528.33px] relative"
            style={{marginLeft: '-20px'}}
            >
                <input 
                    type="text" 
                    placeholder="Поиск" 
                    className="w-[528.33px] search_text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    style={{fontSize: '20px', fontWeight: '400'}}
                />

                <span 
                    className="cursor-pointer bg-[#FFDC64] rounded-r-[14px] border_span search_hov flex items-center justify-center w-[75px] h-[46px]"
                    onClick={handleSearchIconClick}
                >
                    <img src="/search_icon.svg" />
                </span>
            </form>
            )}

            {!minimal && (
              <ul className="nav_links flex gap-[5px] w-[528.33px] justify-center flex-shrink-0">
                  <li>
                      <Link 
                          to="/" 
                          className={`nav_link${location.pathname === '/' ? ' active' : ''}`}
                          onClick={handleMainPageClick}
                      >
                          Главная
                      </Link>
                  </li>
                  <li>
                      <Link to="/catalog" className={`nav_link${location.pathname === '/catalog' ? ' active' : ''}`}>Каталог</Link>
                  </li>
                  <li>
                      <Link 
                          to="/support" 
                          className={`nav_link${location.pathname === '/support' ? ' active' : ''}`}
                      >
                          Поддержка
                      </Link>
                  </li>
              </ul>
            )}
            
            {isAuthenticated ? (
                <button
                    className="cursor-pointer border-[2px] border-[#53515E] text-[#53515E]
                    px-4 py-1 rounded-[17px] hover:bg-[#53515E] hover:text-white w-[78px] h-[50px] profile_button ml-auto flex-shrink-0 flex items-center justify-center"
                    onClick={() => navigate('/profile')}
                    title="Профиль"
                    style={{marginRight: '65px'}}
                >
                    <img src="/icon.svg" alt="Профиль" className="w-[29px] h-[35px]" />
                    
                </button>
            ) : (
                <button
                    className="cursor-pointer border-[2px] border-[#53515E] text-[#53515E]
                    px-6 py-0 rounded-[17px] hover:bg-[#53515E] hover:text-white w-[115px] h-[50px] login_button ml-auto flex-shrink-0"
                    onClick={onLoginClick}
                    style={{marginRight: '45px', fontSize: '20px', fontWeight: '400'}}
                >
                    Войти
                </button>
            )}
        </div>
    )
}

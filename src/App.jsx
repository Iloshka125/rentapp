import { useState } from 'react'
import './index.css'
import { End } from './components/End';
import { NavBar } from './components/NavBar';
import { Mainpage } from './components/Mainpage';
import { RegisterOverlay } from './components/RegisterOverlay';
import Card from './components/Card';
import Publication from './components/Publication';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './2index.css';
import { CityProvider } from './components/CityContext';
import { SearchProvider } from './components/SearchContext';
import { AuthProvider } from './contexts/AuthContext';
import { CitySelectModal } from './components/CitySelectModal';
import { Profile } from './components/Profile';
import { Catalog } from './components/Catalog';
import { Favorites } from './components/Favorites';
import { Support } from './components/Support';
import { AlertProvider } from './contexts/AlertContext';
import { ProtectedRoute } from './components/ProtectedRoute';



function App() {
    const [showRegisterOverlay, setShowRegisterOverlay] = useState(false);
    const [showRegisterOverlayAnimated, setShowRegisterOverlayAnimated] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showCityModalAnimated, setShowCityModalAnimated] = useState(false);

    const handleOpenRegister = () => {
      console.log('🔍 App: открываем модальное окно регистрации');
      setShowRegisterOverlay(true);
      setTimeout(() => {
        console.log('🔍 App: запускаем анимацию появления');
        setShowRegisterOverlayAnimated(true);
      }, 10); // задержка для анимации появления
    };
    const handleCloseRegister = () => {
      console.log('🔍 App: handleCloseRegister вызван');
      setShowRegisterOverlayAnimated(false);
      setTimeout(() => {
        console.log('🔍 App: закрываем модальное окно регистрации');
        setShowRegisterOverlay(false);
      }, 350); // 0.35s как у панели города
    };

    const handleOpenCityModal = () => {
      setShowCityModal(true);
      setTimeout(() => setShowCityModalAnimated(true), 10);
    };
    const handleCloseCityModal = () => {
      setShowCityModalAnimated(false);
      setTimeout(() => setShowCityModal(false), 350);
    };

    const handleVKLogin = () => {
      // Автоматическое подтверждение входа через ВК
      handleCloseRegister();
    };

    return (
      <Router>
      <AuthProvider>
      <CityProvider>
      <SearchProvider>
      <AlertProvider>
      <div className="app-container min-h-screen">
          <NavBar 
            onLoginClick={handleOpenRegister} 
            onCityClick={handleOpenCityModal}
          />
          <Routes>
            <Route path="/" element={<Mainpage />} />
            <Route path="/card/:id" element={<Card />} />
            <Route path="/publication" element={
              <ProtectedRoute>
                <Publication />
              </ProtectedRoute>
            } />
            <Route path="/publication/edit/:id" element={
              <ProtectedRoute>
                <Publication />
              </ProtectedRoute>
            } />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Mainpage />} />

          </Routes>
          <End />
          {showRegisterOverlay && <RegisterOverlay onClose={handleCloseRegister} animated={showRegisterOverlayAnimated} onVKLogin={handleVKLogin} />}
          {showCityModal && <CitySelectModal onClose={handleCloseCityModal} animated={showCityModalAnimated} />}
        </div>
        </AlertProvider>
      </SearchProvider>
      </CityProvider>
      </AuthProvider>
      </Router>
  );
}

export default App;
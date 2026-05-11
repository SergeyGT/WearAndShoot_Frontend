// Cloth.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cloth.css';

const API_BASE = 'http://localhost:8080';

// Константы для Enum
const CATEGORIES = ['HEAD', 'TOP_BASE', 'TOP_MID', 'TOP_OUTER', 'BOTTOM', 'SHOES', 'ACCESSORY'];

const OUTFIT_STYLES = [
    'BUSINESS_CASUAL',
    'SMART_CASUAL', 
    'STREETWEAR',
    'SPORTY',
    'ELEGANT',
    'CASUAL',
    'WINTER_CASUAL',
    'SUMMER_VACATION',
    'OFFICE_FORMAL'
];

const SEASONS = ['SUMMER', 'AUTUMN', 'WINTER', 'SPRING', 'ALL_SEASON'];

// Палитра цветов
const COLOR_PALETTE = [
  { name: 'Красный', value: '#E57373' },
  { name: 'Синий', value: '#64B5F6' },
  { name: 'Зеленый', value: '#81C784' },
  { name: 'Желтый', value: '#FFD54F' },
  { name: 'Черный', value: '#2C2C2C' },
  { name: 'Белый', value: '#F5F5F5' },
  { name: 'Серый', value: '#9E9E9E' },
  { name: 'Оранжевый', value: '#FFB74D' },
  { name: 'Фиолетовый', value: '#BA68C8' },
  { name: 'Розовый', value: '#F48FB1' },
  { name: 'Коричневый', value: '#A1887F' },
  { name: 'Голубой', value: '#81D4FA' },
  { name: 'Бежевый', value: '#E6D5B8' },
  { name: 'Бордовый', value: '#A55D5D' },
  { name: 'Хаки', value: '#A8B28C' },
];

const COLOR_SCHEMES = [
    { value: 'ANY', label: 'Любые цвета' },
    { value: 'MONOCHROME', label: 'Монохромная (оттенки одного цвета)' },
    { value: 'COMPLEMENTARY', label: 'Комплементарная (контрастные)' },
    { value: 'ANALOGOUS', label: 'Аналоговая (соседние цвета)' },
    { value: 'NEUTRAL', label: 'Нейтральная (базовые цвета)' },
];

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
const getCategoryLabel = (category) => {
    const labels = { 
      'HEAD': 'Головной убор',
      'TOP_BASE': 'Верх (футболка/рубашка)', 
      'TOP_MID': 'Средний слой (свитер/кофта)',
      'TOP_OUTER': 'Верхняя одежда (куртка, пальто)',
      'BOTTOM': 'Низ (брюки,юбка)',
      'SHOES': 'Обувь',
      'ACCESSORY': 'Аксессуар'
    };
    return labels[category] || category;
};

const getStyleLabel = (style) => {
    const labels = { 
      'BUSINESS_CASUAL': 'Деловой',
      'CASUAL': 'Повседневный',
      'SPORTY': 'Спортивный',
      'SMART_CASUAL': 'Смарт-кэжуал',
      'STREETWEAR': 'Стритвир',
      'ELEGANT': 'Элегантный',
      'OFFICE_FORMAL': 'Офисный',
      'WINTER_CASUAL': 'Зимний',
      'SUMMER_VACATION': 'Летний отпуск'
    };
    return labels[style] || style;
};

const getSeasonLabel = (season) => {
    const labels = { 'SUMMER': 'Лето', 'AUTUMN': 'Осень', 'WINTER': 'Зима', 'SPRING': 'Весна' , 'ALL_SEASON': 'Всесезонная'};
    return labels[season] || season;
};

const getColorFromName = (colorName) => {
    const color = COLOR_PALETTE.find(c => c.name === colorName);
    return color ? color.value : '#CCCCCC';
};

const getWeatherGradient = (weather) => {
     if (!weather) return 'weather-gradient-default';
    const temp = weather.current.temp_c;
    if (temp < -10) return 'weather-gradient-cold';
    if (temp < 0) return 'weather-gradient-cool';
    if (temp < 10) return 'weather-gradient-mild';
    if (temp < 20) return 'weather-gradient-warm';
    return 'weather-gradient-hot';
};
export default function Cloth() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Погода
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Генерация образов
  const [generatedOutfits, setGeneratedOutfits] = useState([]);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  
  const isGeneratingRef = useRef(false);
  
  // Модалка выбора стиля
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('CASUAL');
  const [outfitName, setOutfitName] = useState('');
  const [outfitImages, setOutfitImages] = useState({});
  const [colorScheme, setColorScheme] = useState('ANY');

  // Модалка создания/редактирования вещи
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState({
    clothName: '',
    category: 'TOP_BASE',
    style: 'CASUAL',
    color: '',
    season: 'SUMMER',
    warmthLevel: 3,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Лайкнутые образы
  const [likedOutfits, setLikedOutfits] = useState([]);
  const [showLikedOutfits, setShowLikedOutfits] = useState(false);
  const [likedOutfitImages, setLikedOutfitImages] = useState({});

  // Удаление
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ============ ВСЯ ЛОГИКА (БЭК НЕ ТРОГАЕМ) ============
  useEffect(() => {
    if (outfitError) {
      const timer = setTimeout(() => setOutfitError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [outfitError]);

  const WEATHER_CACHE_KEY = 'weather_cache';
  const CACHE_TTL = 15 * 60 * 1000;

  const loadOutfitItemImages = async (items) => {
    const imageMap = {};
    if (!items || items.length === 0) return imageMap;
    
    await Promise.all(items.map(async (item) => {
      if (item.id) {
        if (imageUrls[item.id]) {
          imageMap[item.id] = imageUrls[item.id];
        } else {
          try {
            const imgRes = await fetch(`${API_BASE}/cloth/image/${item.id}`, {
              credentials: 'include',
            });
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              if (blob.size > 0) {
                imageMap[item.id] = URL.createObjectURL(blob);
              }
            }
          } catch (err) {
            console.error(`Ошибка загрузки изображения для ${item.id}:`, err);
          }
        }
      }
    }));
    return imageMap;
  };

  const deleteCard = async (cardId) => {
    try {
      setDeletingCardId(cardId);
      const res = await fetch(`${API_BASE}/cloth/delete/${cardId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Ошибка удаления'); }
      if (imageUrls[cardId]?.startsWith('blob:')) URL.revokeObjectURL(imageUrls[cardId]);
      setCards(prev => prev.filter(c => c.id !== cardId));
      setImageUrls(prev => { const n = { ...prev }; delete n[cardId]; return n; });
      alert('Вещь удалена');
    } catch (err) { alert('Ошибка: ' + err.message); }
    finally { setDeletingCardId(null); }
  };

  const deleteOutfit = async (outfitId, fromLiked = false) => {
    try {
      setDeletingOutfitId(outfitId);
      const res = await fetch(`${API_BASE}/cloth/outfits/${outfitId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      if (fromLiked) {
        setLikedOutfits(prev => prev.filter(o => o.id !== outfitId));
        setLikedOutfitImages(prev => { const n = { ...prev }; delete n[outfitId]; return n; });
      } else {
        setGeneratedOutfits(prev => prev.filter(o => o.id !== outfitId));
        setOutfitImages(prev => { const n = { ...prev }; delete n[outfitId]; return n; });
      }
      alert('Образ удален');
    } catch (err) { alert('Ошибка: ' + err.message); }
    finally { setDeletingOutfitId(null); }
  };

  const confirmDelete = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'card') deleteCard(deleteTarget.id);
    else if (deleteTarget.type === 'outfit') deleteOutfit(deleteTarget.id);
    else if (deleteTarget.type === 'liked_outfit') deleteOutfit(deleteTarget.id, true);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const openStyleModal = () => {
    if (cards.length < 3) {
      setOutfitError('Недостаточно вещей для генерации образов (нужно минимум 3)');
      return;
    }
    setOutfitError(null);
    setOutfitName('');
    setSelectedStyle('CASUAL');
    setColorScheme('ANY');
    setIsStyleModalOpen(true);
  };

  const generateOutfits = async () => {
    if (isGeneratingRef.current || outfitLoading) return;
    
    const hasTopBase = cards.some(c => c.category === 'TOP_BASE');
    const hasBottom = cards.some(c => c.category === 'BOTTOM');
    const missingCategories = [];
    if (!hasTopBase) missingCategories.push('Верх (футболка/рубашка)');
    if (!hasBottom) missingCategories.push('Низ (брюки/юбка/шорты)');
    
    if (missingCategories.length > 0) {
        setOutfitError(`Для создания образа нужны: ${missingCategories.join(' и ')}. Добавьте недостающие вещи.`);
        return;
    }
    isGeneratingRef.current = true;
    setOutfitLoading(true);
    setOutfitError(null);
    setIsStyleModalOpen(false);

    try {
      const res = await fetch(`${API_BASE}/cloth/generate-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          style: selectedStyle,
          count: 3,
          outfitName: outfitName.trim() || null,
          colorScheme: colorScheme,
          lat: weather?.location?.lat || null,  // ДОБАВЛЕНО
          lon: weather?.location?.lon || null 
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
          if (!meRes.ok) { navigate('/login'); return; }
          throw new Error('Ошибка авторизации. Попробуйте перезагрузить страницу.');
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка генерации');
      }

      const outfits = await res.json();
      
      const allImages = {};
      for (const outfit of outfits) {
        if (outfit.items && outfit.items.length > 0) {
          const images = await loadOutfitItemImages(outfit.items);
          allImages[outfit.id] = images;
        }
      }
      
      setOutfitImages(allImages);
      setGeneratedOutfits(outfits);
      setIsOutfitModalOpen(true);
    } catch (err) {
      console.error('Ошибка генерации:', err);
      setOutfitError('Не удалось сгенерировать образы: ' + err.message);
    } finally {
      setOutfitLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const toggleLike = async (outfitId) => {
     try {
      const res = await fetch(`${API_BASE}/cloth/outfits/${outfitId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userId }),
      });

      if (res.ok) {
        const updatedOutfit = await res.json();
        
        setGeneratedOutfits(prev => 
          prev.map(outfit => 
            outfit.id === outfitId ? { ...outfit, isLiked: updatedOutfit.isLiked } : outfit
          )
        );
        
        if (updatedOutfit.isLiked) {
          setLikedOutfits(prev => {
            if (prev.some(o => o.id === outfitId)) return prev;
            return [...prev, updatedOutfit];
          });
          if (outfitImages[outfitId]) {
            setLikedOutfitImages(prev => ({ ...prev, [outfitId]: outfitImages[outfitId] }));
          }
        } else {
          setLikedOutfits(prev => prev.filter(o => o.id !== outfitId));
          setLikedOutfitImages(prev => {
            const newImages = { ...prev };
            delete newImages[outfitId];
            return newImages;
          });
        }
      }
    } catch (err) {
      console.error('Ошибка при лайке:', err);
    }
};

  const loadLikedOutfits = async () => {
    try {
      const res = await fetch(`${API_BASE}/cloth/outfits/liked/${userId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setLikedOutfits(data);
        
        const allImages = { ...likedOutfitImages };
        for (const outfit of data) {
          if (!allImages[outfit.id] && outfit.items?.length > 0) {
            const images = await loadOutfitItemImages(outfit.items);
            if (Object.keys(images).length > 0) {
              allImages[outfit.id] = images;
            }
          }
        }
        setLikedOutfitImages(allImages);
        setShowLikedOutfits(true);
      }
    } catch (err) {
      console.error('Ошибка загрузки лайкнутых образов:', err);
    }
};

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        Object.values(imageUrls).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
        Object.values(outfitImages).forEach(imgMap => { Object.values(imgMap).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); }); });
        Object.values(likedOutfitImages).forEach(imgMap => { Object.values(imgMap).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); }); });
        navigate('/login', { replace: true });
      } else {
        alert('Ошибка при выходе');
      }
    } catch (err) {
      console.error('Ошибка при выходе:', err);
      alert('Не удалось выйти');
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (!res.ok) { navigate('/login', { replace: true }); return; }
        const data = await res.json();
        setUserId(data.userId);
        setUserName(data.username);
      } catch (err) {
        console.error('Ошибка при получении /me:', err);
        navigate('/login', { replace: true });
      }
    };
    fetchMe();
  }, [navigate]);

  const fetchWeatherByCoords = async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError(null);

    const cache = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_TTL) {
        setWeather(data);
        setWeatherLoading(false);
        return;
      }
    }

    try {
      const query = `${lat},${lon}`;
      const res = await fetch(`${API_BASE}/weather/current?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { navigate('/login', { replace: true }); return; }
        throw new Error(`Ошибка: ${res.status}`);
      }

      const data = await res.json();
      setWeather(data);
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (err) {
      console.error('Ошибка погоды:', err);
      setWeatherError(err.message || 'Не удалось загрузить погоду');
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadWeather = () => {
    if (!navigator.geolocation) { setWeatherError('Геолокация не поддерживается'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
      (err) => {
        let msg = 'Не удалось определить местоположение';
        if (err.code === 1) msg = 'Доступ к геолокации запрещён';
        if (err.code === 2) msg = 'Местоположение недоступно';
        if (err.code === 3) msg = 'Время запроса истекло';
        setWeatherError(msg);
      }
    );
  };

  useEffect(() => { if (userId) loadWeather(); }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchCards = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cloth/userCards/${userId}`, { credentials: 'include' });
        if (!res.ok) { if (res.status === 401 || res.status === 403) { navigate('/login', { replace: true }); return; } throw new Error(`HTTP ${res.status}`); }
        const data = await res.json();
        setCards(data || []);
        
        if (data && data.length > 0) {
          Object.values(imageUrls).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
          const newImageUrls = {};
          await Promise.all(data.map(async (card) => {
            if (card.id) {
              try {
                const imgRes = await fetch(`${API_BASE}/cloth/image/${card.id}`, { credentials: 'include' });
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  if (blob.size > 0) newImageUrls[card.id] = URL.createObjectURL(blob);
                }
              } catch (err) { console.error(`Ошибка загрузки изображения для карточки ${card.id}:`, err); }
            }
          }));
          setImageUrls(newImageUrls);
        }
      } catch (err) { console.error('Ошибка загрузки карточек:', err); alert('Не удалось загрузить вещи'); }
      finally { setLoading(false); }
    };
    fetchCards();
  }, [userId, navigate]);

  useEffect(() => {
    if (selectedFile) { const url = URL.createObjectURL(selectedFile); setPreviewUrl(url); return () => URL.revokeObjectURL(url); }
    setPreviewUrl('');
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
      Object.values(outfitImages).forEach(imgMap => { Object.values(imgMap).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); }); });
    };
  }, []);

  const openCreate = () => {
    setEditingCard(null);
    setForm({ clothName: '', category: 'TOP_BASE', style: 'CASUAL', color: '', season: 'SUMMER', warmthLevel: 3 });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setForm({
      clothName: card.clothName || '',
      category: card.category || 'TOP_BASE',
      style: card.style || 'CASUAL',
      color: card.color || '',
      season: card.season || 'SUMMER',
      warmthLevel: card.warmthLevel || 3,
    });
    setSelectedFile(null);
    setPreviewUrl(imageUrls[card.id] || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { alert('Не удалось определить пользователя'); return; }

    const clothData = {
      userId, clothName: form.clothName.trim(), category: form.category,
      style: form.style, color: form.color, season: form.season, warmthLevel: Number(form.warmthLevel),
    };
    if (!clothData.clothName) { alert('Название вещи обязательно!'); return; }

    if (!form.color || form.color.trim() === '') {
        alert('Выберите цвет вещи!');
        return;
    }

    const formData = new FormData();
    formData.append('clothData', new Blob([JSON.stringify(clothData)], { type: 'application/json' }));
    if (selectedFile) { formData.append('image', selectedFile); }
    else if (!editingCard) { alert('Для новой вещи выберите изображение!'); return; }

    try {
      const url = editingCard ? `${API_BASE}/cloth/edit/${editingCard.id}` : `${API_BASE}/cloth/create`;
      const method = editingCard ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: formData, credentials: 'include' });
      if (!res.ok) { const errText = await res.text(); throw new Error(errText || `HTTP ${res.status}`); }
      
      alert(editingCard ? 'Карточка обновлена!' : 'Карточка создана!');
      setIsModalOpen(false);
      setSelectedFile(null);
      setEditingCard(null);

      const cardsRes = await fetch(`${API_BASE}/cloth/userCards/${userId}`, { credentials: 'include' });
      if (cardsRes.ok) {
        const updatedCards = await cardsRes.json();
        setCards(updatedCards);
        Object.values(imageUrls).forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
        const newImageUrls = {};
        if (updatedCards?.length > 0) {
          await Promise.all(updatedCards.map(async (card) => {
            if (card.id) {
              try {
                const imgRes = await fetch(`${API_BASE}/cloth/image/${card.id}`, { credentials: 'include' });
                if (imgRes.ok) { const blob = await imgRes.blob(); if (blob.size > 0) newImageUrls[card.id] = URL.createObjectURL(blob); }
              } catch (err) { console.error(`Ошибка загрузки изображения для карточки ${card.id}:`, err); }
            }
          }));
        }
        setImageUrls(newImageUrls);
      }
    } catch (err) { console.error(err); alert('Ошибка сохранения: ' + err.message); }
  };

  const closeModal = () => {
    setIsModalOpen(false); setSelectedFile(null); setEditingCard(null); setShowColorPicker(false);
  };

  // ============ РЕНДЕР ============
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__box">
          <p className="loading-screen__text">Загрузка...</p>
        </div>
      </div>
    );
  }

  const pluralize = (count) => {
    if (count === 1) return 'вещь';
    if (count >= 2 && count <= 4) return 'вещи';
    return 'вещей';
  };

  return (
    <div className="page-container">
      {/* Хедер */}
      <header className="header">
        <div className="container header__inner">
          <div className="header__left">
            <h1 className="header__title">Wear & Shoot</h1>
            {userName && (
              <span className="header__username">Привет, {userName}!</span>
            )}
          </div>
          <div className="header__actions">
            <button onClick={loadLikedOutfits} className="btn btn--rose">❤️ Избранное</button>
            <button onClick={openStyleModal} disabled={outfitLoading || cards.length < 3} className="btn btn--blue">
              {outfitLoading ? 'Генерация...' : '✨ Сгенерировать образ'}
            </button>
            <button onClick={handleLogout} disabled={logoutLoading} className="btn btn--amber">
              {logoutLoading ? 'Выход...' : 'Выйти'}
            </button>
          </div>
        </div>
        {outfitError && (
          <div className="container">
            <div className="error-banner error-banner--red" style={{marginTop: '0.75rem'}}>
              <span>⚠️ {outfitError}</span>
              <button onClick={() => setOutfitError(null)} className="error-banner__close">✕</button>
            </div>
          </div>
        )}
      </header>

      <main className="container" style={{paddingTop: '2.5rem', paddingBottom: '2.5rem'}}>
        {/* Блок погоды */}
        <div className={`weather-block ${getWeatherGradient(weather)}`}>
          <div className="weather-block__header">
            <h2 className="weather-block__title">🌤️ Погода сейчас</h2>
            <button onClick={loadWeather} disabled={weatherLoading} className="btn btn--outline">
              <span>{weatherLoading ? '⏳' : '🔄'}</span>
              <span>{weatherLoading ? 'Обновление...' : 'Обновить'}</span>
            </button>
          </div>

          {weatherError ? (
            <p className="weather-block__error">{weatherError}</p>
          ) : weather ? (
            <div className="weather-block__content">
              <img src={`https:${weather.current.condition.icon}`} alt={weather.current.condition.text} className="weather-block__icon" />
              <div className="weather-block__info">
                <div className="weather-block__temp-row">
                  <p className="weather-block__temp">{Math.round(weather.current.temp_c)}°</p>
                  <p className="weather-block__condition">{weather.current.condition.text}</p>
                </div>
                <p className="weather-block__details">
                  Ощущается: {Math.round(weather.current.feelslike_c)}° • {weather.location.name}, {weather.location.country}
                </p>
              </div>
            </div>
          ) : (
            <p className="weather-block__loading">Загрузка погоды...</p>
          )}
        </div>

        {/* Заголовок и кнопка */}
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Мой гардероб</h2>
            <p className="section-header__count">{cards.length} {pluralize(cards.length)}</p>
          </div>
          <button onClick={openCreate} className="btn btn--blue btn--lg">
            <span>➕</span> Добавить вещь
          </button>
        </div>

        {/* Сетка карточек */}
        {cards.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">😢</p>
            <p className="empty-state__title">У тебя пока нет вещей</p>
            <p className="empty-state__text">Нажми кнопку "Добавить вещь" чтобы создать первую карточку!</p>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="card">
                <div className="card__image-wrapper">
                  {imageUrls[card.id] ? (
                    <img src={imageUrls[card.id]} alt={card.clothName} className="card__image"
                      onError={(e) => { e.target.onerror = null; setImageUrls(prev => ({ ...prev, [card.id]: null })); }} />
                  ) : (
                    <div className="card__no-image">
                      {loadingImages[card.id] ? (
                        <div className="card__spinner"></div>
                      ) : (
                        <>
                          <span className="card__no-image-icon">📸</span>
                          <span className="card__no-image-text">Нет фото</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="card__body">
                  <h3 className="card__title">{card.clothName || 'Без названия'}</h3>
                  
                  <div className="card__info">
                    <div className="card__row">
                      <span className="card__label">Категория:</span>
                      <span className="card__tag card__tag--gray">{getCategoryLabel(card.category)}</span>
                    </div>
                    
                    <div className="card__row">
                      <span className="card__label">Стиль:</span>
                      <span className="card__tag card__tag--blue">{getStyleLabel(card.style)}</span>
                    </div>
                    
                    <div className="card__row">
                      <span className="card__label">Цвет:</span>
                      {card.color && <span className="card__color-dot" style={{ backgroundColor: getColorFromName(card.color) }} />}
                      <span className="card__color-name">{card.color || '—'}</span>
                    </div>
                    
                    <div className="card__row">
                      <span className="card__label">Сезон:</span>
                      <span className="card__tag card__tag--amber">{getSeasonLabel(card.season)}</span>
                    </div>
                    
                    <div className="card__row">
                      <span className="card__label">Теплота:</span>
                      <span className="card__warmth">
                        {'❤️'.repeat(card.warmthLevel || 0)}{'🤍'.repeat(5 - (card.warmthLevel || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="card__actions">
                    <button onClick={() => openEdit(card)} className="btn btn--amber" style={{flex: 1}}>✏️ Изменить</button>
                    <button onClick={() => confirmDelete('card', card.id, card.clothName)}
                      disabled={deletingCardId === card.id} className="btn btn--danger" style={{flex: 1}}>
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модалка создания/редактирования вещи */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal--lg">
            <div className="modal__body">
              <div className="modal__header">
                <h2 className="modal__title">{editingCard ? 'Редактировать вещь' : 'Новая вещь'}</h2>
                <button onClick={closeModal} className="modal__close">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="form">
                {(previewUrl || selectedFile) && (
                  <div className="form__preview">
                    <img src={previewUrl} alt="preview" className="form__preview-img" />
                  </div>
                )}

                <input type="file" accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="form__file-input" />

                <div className="form__group">
                  <label className="form__label">Название вещи *</label>
                  <input type="text" placeholder="Название вещи" value={form.clothName}
                    onChange={(e) => setForm({ ...form, clothName: e.target.value })}
                    className="form__input" required />
                </div>

                <div className="form__group">
                  <label className="form__label">Категория</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form__select">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>)}
                  </select>
                </div>

                <div className="form__group">
                  <label className="form__label">Стиль</label>
                  <select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} className="form__select">
                    {OUTFIT_STYLES.map(style => <option key={style} value={style}>{getStyleLabel(style)}</option>)}
                  </select>
                </div>

                <div className="form__group" style={{position: 'relative'}}>
                  <label className="form__label">Цвет</label>
                  <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="form__color-trigger">
                    <span className="form__color-value">
                      {form.color ? (
                        <>
                          <span className="form__color-dot" style={{ backgroundColor: getColorFromName(form.color) }} />
                          <span className="form__color-name">{form.color}</span>
                        </>
                      ) : 'Выберите цвет'}
                    </span>
                    <span className="form__color-arrow">▼</span>
                  </button>
                  
                  {showColorPicker && (
                    <div className="form__color-picker">
                      {COLOR_PALETTE.map((color) => (
                        <button key={color.value} type="button" className="form__color-option"
                          onClick={() => { setForm({ ...form, color: color.name }); setShowColorPicker(false); }}>
                          <span className="form__color-option-dot" style={{ backgroundColor: color.value }} />
                          <span className="form__color-option-name">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form__group">
                  <label className="form__label">Сезон</label>
                  <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="form__select">
                    {SEASONS.map(season => <option key={season} value={season}>{getSeasonLabel(season)}</option>)}
                  </select>
                </div>

                <div className="form__group">
                  <label className="form__label">Теплота: {form.warmthLevel}/5</label>
                  <input type="range" min="1" max="5" value={form.warmthLevel}
                    onChange={(e) => setForm({ ...form, warmthLevel: parseInt(e.target.value) })}
                    className="form__range" />
                  <div className="form__range-labels">
                    <span>❄️ Холодно</span>
                    <span>🔥 Жарко</span>
                  </div>
                </div>

                <div className="form__actions">
                  <button type="submit" className="btn btn--blue" style={{flex: 1}}>{editingCard ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" onClick={closeModal} className="btn btn--outline" style={{flex: 1}}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модалка выбора стиля */}
      {isStyleModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal--md">
            <div className="modal__body">
              <h2 className="modal__title" style={{textAlign: 'center', marginBottom: '1.5rem'}}>Создание образа</h2>
              
              <div className="form__group" style={{marginBottom: '1.25rem'}}>
                <label className="form__label">Название образа (необязательно)</label>
                <input type="text" value={outfitName} onChange={(e) => setOutfitName(e.target.value)}
                  placeholder="Например: Вечерний выход" className="form__input" />
              </div>

              <div className="form__group" style={{marginBottom: '1.25rem'}}>
                <label className="form__label">Цветовая схема</label>
                <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value)} className="form__select">
                  {COLOR_SCHEMES.map(scheme => <option key={scheme.value} value={scheme.value}>{scheme.label}</option>)}
                </select>
              </div>
              
              <p style={{fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem'}}>Выберите стиль:</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem'}}>
                {OUTFIT_STYLES.map((style) => (
                  <button key={style} onClick={() => setSelectedStyle(style)}
                    className={selectedStyle === style ? 'btn btn--amber' : 'btn btn--outline'}
                    style={{justifyContent: 'flex-start', width: '100%'}}>
                    {getStyleLabel(style)}
                  </button>
                ))}
              </div>
              
              <div className="form__actions">
                <button onClick={generateOutfits} disabled={outfitLoading} className="btn btn--blue" style={{flex: 1}}>
                  {outfitLoading ? '⏳ Генерация...' : '✨ Создать'}
                </button>
                <button onClick={() => { setIsStyleModalOpen(false); setOutfitName(''); }} className="btn btn--outline" style={{flex: 1}}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка с результатами генерации */}
      {isOutfitModalOpen && generatedOutfits.length > 0 && (
        <div className="modal-overlay">
          <div className="modal modal--xl">
            <div className="modal__body">
              <div className="modal__header">
                <h2 className="modal__title">{outfitName || 'Сгенерированные образы'}</h2>
                <button onClick={() => setIsOutfitModalOpen(false)} className="modal__close">✕</button>
              </div>
              
              {outfitError && (
                <div className="error-banner error-banner--red">
                  <span>⚠️ {outfitError}</span>
                  <button onClick={() => setOutfitError(null)} className="error-banner__close">✕</button>
                </div>
              )}
              
              <div className="outfits-grid">
                {generatedOutfits.map((outfit) => (
                  <div key={outfit.id} className="outfit-card">
                    <div className="outfit-card__actions">
                      <button onClick={() => toggleLike(outfit.id)} className="outfit-card__like-btn"
                        title={outfit.isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}>
                        {outfit.isLiked ? '❤️' : '🤍'}
                      </button>
                      <button onClick={() => confirmDelete('outfit', outfit.id, outfit.outfitName)}
                        disabled={deletingOutfitId === outfit.id} className="outfit-card__delete-btn" title="Удалить образ">
                        {deletingOutfitId === outfit.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                    
                    <h3 className="outfit-card__title">{outfit.outfitName}</h3>
                    
                    <div className="outfit-card__tags">
                      <span className="outfit-card__tag outfit-card__tag--style">{getStyleLabel(outfit.style)}</span>
                      {outfit.temperatureC && <span className="outfit-card__tag outfit-card__tag--info">🌡️ {Math.round(outfit.temperatureC)}°C</span>}
                      {outfit.weatherCondition && <span className="outfit-card__tag outfit-card__tag--info">🌤️ {outfit.weatherCondition}</span>}
                    </div>
                    
                    <div>
                      <p className="outfit-card__items-title">Состав образа:</p>
                      <div className="outfit-card__items">
                        {outfit.items?.map((item) => (
                          <div key={item.id} className="outfit-item">
                            <div className="outfit-item__image">
                              {outfitImages[outfit.id]?.[item.id] ? (
                                <img src={outfitImages[outfit.id][item.id]} alt={item.clothName} />
                              ) : (
                                <div className="outfit-item__image-placeholder">
                                  <div className="outfit-item__spinner"></div>
                                </div>
                              )}
                            </div>
                            <div className="outfit-item__info">
                              <p className="outfit-item__name">{item.clothName}</p>
                              <p className="outfit-item__category">{getCategoryLabel(item.category)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка с избранными образами */}
      {showLikedOutfits && (
        <div className="modal-overlay">
          <div className="modal modal--xl">
            <div className="modal__body">
              <div className="modal__header">
                <h2 className="modal__title">❤️ Избранные образы</h2>
                <button onClick={() => setShowLikedOutfits(false)} className="modal__close">✕</button>
              </div>
              
              {likedOutfits.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state__icon">🤍</p>
                  <p className="empty-state__title">Нет избранных образов</p>
                  <p className="empty-state__text">Лайкните понравившиеся образы, чтобы они появились здесь</p>
                </div>
              ) : (
                <div className="outfits-grid">
                  {likedOutfits.map((outfit) => (
                    <div key={outfit.id} className="outfit-card">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                        <h3 className="outfit-card__title" style={{marginBottom: 0, paddingRight: 0}}>{outfit.outfitName}</h3>
                        <div style={{display: 'flex', gap: '0.5rem', flexShrink: 0}}>
                          <span style={{fontSize: '1.5rem'}}>❤️</span>
                          <button onClick={() => confirmDelete('liked_outfit', outfit.id, outfit.outfitName)}
                            disabled={deletingOutfitId === outfit.id} className="outfit-card__delete-btn" title="Удалить образ">
                            {deletingOutfitId === outfit.id ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="outfit-card__tags">
                        <span className="outfit-card__tag outfit-card__tag--style">{getStyleLabel(outfit.style)}</span>
                      </div>
                      
                      <div>
                        <p className="outfit-card__items-title">Состав образа:</p>
                        <div className="outfit-card__items">
                          {outfit.items?.map((item) => (
                            <div key={item.id} className="outfit-item">
                              <div className="outfit-item__image">
                                {likedOutfitImages[outfit.id]?.[item.id] ? (
                                  <img src={likedOutfitImages[outfit.id][item.id]} alt={item.clothName} />
                                ) : (
                                  <div className="outfit-item__image-placeholder">👕</div>
                                )}
                              </div>
                              <div className="outfit-item__info">
                                <p className="outfit-item__name">{item.clothName}</p>
                                <p className="outfit-item__category">{getCategoryLabel(item.category)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{zIndex: 60}}>
          <div className="modal modal--sm">
            <div className="modal__body">
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.75rem'}}>Подтверждение удаления</h3>
              <p style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>
                {deleteTarget?.type === 'card' ? 'Удалить вещь?' : 'Удалить образ?'}
              </p>
              <p style={{color: 'var(--text-amber)', fontWeight: 600, marginBottom: '1rem'}}>"{deleteTarget?.name}"?</p>
              {deleteTarget?.type === 'card' && (
                <p style={{color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem'}}>⚠️ Вещь удалится из всех образов!</p>
              )}
              <div className="form__actions">
                <button onClick={executeDelete} className="btn btn--danger" style={{flex: 1}}>Удалить</button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="btn btn--outline" style={{flex: 1}}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
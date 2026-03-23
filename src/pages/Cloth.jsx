// src/pages/Cloth.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

// Константы для Enum
const CATEGORIES = ['HEAD', 'TOP_BASE', 'TOP_MID', 'TOP_OUTER', 'BOTTOM', 'SHOES', 'ACCESSORY'];
const STYLES = ['BUSINESS', 'CASUAL', 'SPORT'];
const SEASONS = ['SUMMER', 'AUTUMN', 'WINTER', 'SPRING'];

// Палитра цветов
const COLOR_PALETTE = [
  { name: 'Красный', value: '#FF0000' },
  { name: 'Синий', value: '#0000FF' },
  { name: 'Зеленый', value: '#00FF00' },
  { name: 'Желтый', value: '#FFFF00' },
  { name: 'Черный', value: '#000000' },
  { name: 'Белый', value: '#FFFFFF' },
  { name: 'Серый', value: '#808080' },
  { name: 'Оранжевый', value: '#FFA500' },
  { name: 'Фиолетовый', value: '#800080' },
  { name: 'Розовый', value: '#FFC0CB' },
  { name: 'Коричневый', value: '#8B4513' },
  { name: 'Голубой', value: '#87CEEB' },
  { name: 'Бежевый', value: '#F5F5DC' },
  { name: 'Бордовый', value: '#800000' },
  { name: 'Хаки', value: '#808000' },
];

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
  
  // Модалка выбора стиля для генерации
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('CASUAL');

  // Модалка
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

  // Кэш погоды
  const WEATHER_CACHE_KEY = 'weather_cache';
  const CACHE_TTL = 15 * 60 * 1000;

  // Функция для открытия модалки выбора стиля
  const openStyleModal = () => {
    if (cards.length < 3) {
      setOutfitError('Недостаточно вещей для генерации образов (нужно минимум 3)');
      return;
    }
    setIsStyleModalOpen(true);
  };

  // Генерация образов с выбранным стилем
  const generateOutfits = async () => {
    setOutfitLoading(true);
    setOutfitError(null);
    setIsStyleModalOpen(false);

    try {
      const res = await fetch(`${API_BASE}/cloth/generate-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId,
          style: selectedStyle,
          count: 3
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate('/login');
          return;
        }
        throw new Error('Ошибка генерации');
      }

      const outfits = await res.json();
      setGeneratedOutfits(outfits);
      setIsOutfitModalOpen(true);
    } catch (err) {
      setOutfitError('Не удалось сгенерировать образы: ' + err.message);
    } finally {
      setOutfitLoading(false);
    }
  };

  // Выход
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        Object.values(imageUrls).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
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

  // Получение пользователя
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (!res.ok) {
          navigate('/login', { replace: true });
          return;
        }

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

  // Погода
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
        if (res.status === 401 || res.status === 403) {
          navigate('/login', { replace: true });
          return;
        }
        throw new Error(`Ошибка: ${res.status}`);
      }

      const data = await res.json();
      setWeather(data);
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('Ошибка погоды:', err);
      setWeatherError(err.message || 'Не удалось загрузить погоду');
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadWeather = () => {
    if (!navigator.geolocation) {
      setWeatherError('Геолокация не поддерживается');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        let msg = 'Не удалось определить местоположение';
        if (err.code === 1) msg = 'Доступ к геолокации запрещён';
        if (err.code === 2) msg = 'Местоположение недоступно';
        if (err.code === 3) msg = 'Время запроса истекло';
        setWeatherError(msg);
      }
    );
  };

  useEffect(() => {
    if (userId) {
      loadWeather();
    }
  }, [userId]);

  // Градиент для погоды
  const getWeatherGradient = () => {
    if (!weather) return 'from-purple-900/50 to-indigo-900/50';
    const temp = weather.current.temp_c;
    if (temp < -10) return 'from-blue-900/50 to-cyan-900/50';
    if (temp < 0) return 'from-cyan-900/50 to-blue-900/50';
    if (temp < 10) return 'from-indigo-900/50 to-purple-900/50';
    if (temp < 20) return 'from-purple-900/50 to-pink-900/50';
    return 'from-orange-900/50 to-red-900/50';
  };

  // Загрузка карточек
  useEffect(() => {
    if (!userId) return;

    const fetchCards = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cloth/userCards/${userId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            navigate('/login', { replace: true });
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('Загруженные карточки:', data);
        setCards(data || []);
        
        if (data && data.length > 0) {
          Object.values(imageUrls).forEach(url => {
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
          
          const newImageUrls = {};
          await Promise.all(data.map(async (card) => {
            if (card.id) {
              try {
                const imgRes = await fetch(`${API_BASE}/cloth/image/${card.id}`, {
                  credentials: 'include',
                });
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  if (blob.size > 0) {
                    newImageUrls[card.id] = URL.createObjectURL(blob);
                  }
                }
              } catch (err) {
                console.error(`Ошибка загрузки изображения для карточки ${card.id}:`, err);
              }
            }
          }));
          setImageUrls(newImageUrls);
        }
      } catch (err) {
        console.error('Ошибка загрузки карточек:', err);
        alert('Не удалось загрузить вещи');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [userId, navigate]);

  // Предпросмотр
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
  }, [selectedFile]);

  // Очистка URL при размонтировании
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const openCreate = () => {
    setEditingCard(null);
    setForm({ 
      clothName: '', 
      category: 'TOP_BASE', 
      style: 'CASUAL',
      color: '', 
      season: 'SUMMER', 
      warmthLevel: 3 
    });
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

    if (!userId) {
      alert('Не удалось определить пользователя');
      return;
    }

    const clothData = {
      userId,
      clothName: form.clothName.trim(),
      category: form.category,
      style: form.style,
      color: form.color,
      season: form.season,
      warmthLevel: Number(form.warmthLevel),
    };

    if (!clothData.clothName) {
      alert('Название вещи обязательно!');
      return;
    }

    const formData = new FormData();
    formData.append('clothData', new Blob([JSON.stringify(clothData)], { type: 'application/json' }));

    if (selectedFile) {
      formData.append('image', selectedFile);
    } else if (!editingCard) {
      alert('Для новой вещи выберите изображение!');
      return;
    }

    try {
      const url = editingCard
        ? `${API_BASE}/cloth/edit/${editingCard.id}`
        : `${API_BASE}/cloth/create`;

      const method = editingCard ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log('Card saved:', result);

      alert(editingCard ? 'Карточка обновлена!' : 'Карточка создана!');
      setIsModalOpen(false);
      setSelectedFile(null);
      setEditingCard(null);

      // Обновляем список карточек
      const cardsRes = await fetch(`${API_BASE}/cloth/userCards/${userId}`, {
        credentials: 'include',
      });
      
      if (cardsRes.ok) {
        const updatedCards = await cardsRes.json();
        setCards(updatedCards);
        
        Object.values(imageUrls).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        
        const newImageUrls = {};
        if (updatedCards && updatedCards.length > 0) {
          await Promise.all(updatedCards.map(async (card) => {
            if (card.id) {
              try {
                const imgRes = await fetch(`${API_BASE}/cloth/image/${card.id}`, {
                  credentials: 'include',
                });
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  if (blob.size > 0) {
                    newImageUrls[card.id] = URL.createObjectURL(blob);
                  }
                }
              } catch (err) {
                console.error(`Ошибка загрузки изображения для карточки ${card.id}:`, err);
              }
            }
          }));
        }
        setImageUrls(newImageUrls);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setEditingCard(null);
    setShowColorPicker(false);
  };

  const getCategoryLabel = (category) => {
    const labels = { 
      'HEAD': 'Головной убор',
      'TOP_BASE': 'База (нижний слой)', 
      'TOP_MID': 'Средний слой',
      'TOP_OUTER': 'Верхняя одежда',
      'BOTTOM': 'Низ',
      'SHOES': 'Обувь',
      'ACCESSORY': 'Аксессуар'
    };
    return labels[category] || category;
  };

  const getStyleLabel = (style) => {
    const labels = { 
      'BUSINESS': 'Деловой', 
      'CASUAL': 'Повседневный', 
      'SPORT': 'Спортивный' 
    };
    return labels[style] || style;
  };

  const getSeasonLabel = (season) => {
    const labels = { 'SUMMER': 'Лето', 'AUTUMN': 'Осень', 'WINTER': 'Зима', 'SPRING': 'Весна' };
    return labels[season] || season;
  };

  const getColorFromName = (colorName) => {
    const color = COLOR_PALETTE.find(c => c.name === colorName);
    return color ? color.value : '#CCCCCC';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500">
        <div className="bg-purple-950/80 backdrop-blur-xl px-8 py-6 rounded-2xl border-4 border-purple-700">
          <p className="text-2xl text-purple-200 animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500">
      {/* Хедер */}
      <header className="sticky top-0 z-40 bg-purple-950/90 backdrop-blur-md border-b border-purple-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-purple-200 whitespace-nowrap">
                Wear & Shoot
              </h1>
              {userName && (
                <span className="text-purple-300 text-sm sm:text-base bg-purple-900/50 px-3 py-1 rounded-full">
                  Привет, {userName}!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={openStyleModal}
                disabled={outfitLoading || cards.length < 3}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outfitLoading ? 'Генерация...' : '✨ Сгенерировать образ'}
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutLoading ? 'Выход...' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Блок погоды */}
        <div className={`mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br ${getWeatherGradient()} rounded-2xl border border-white/20 backdrop-blur-lg shadow-2xl`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🌤️</span> Погода сейчас
            </h2>
            <button
              onClick={loadWeather}
              disabled={weatherLoading}
              className="w-full sm:w-auto px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{weatherLoading ? '⏳' : '🔄'}</span>
              <span className="sm:hidden">{weatherLoading ? 'Загрузка...' : 'Обновить'}</span>
              <span className="hidden sm:inline">{weatherLoading ? 'Обновление...' : 'Обновить'}</span>
            </button>
          </div>

          {weatherError ? (
            <p className="text-white/80 text-center text-sm sm:text-base">{weatherError}</p>
          ) : weather ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <img
                src={`https:${weather.current.condition.icon}`}
                alt={weather.current.condition.text}
                className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                  <p className="text-4xl sm:text-5xl font-extrabold text-white">
                    {Math.round(weather.current.temp_c)}°
                  </p>
                  <p className="text-lg sm:text-xl text-white/90 capitalize">
                    {weather.current.condition.text}
                  </p>
                </div>
                <p className="text-sm sm:text-base text-white/80 mt-1">
                  Ощущается: {Math.round(weather.current.feelslike_c)}° • 
                  {weather.location.name}, {weather.location.country}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/80 text-center italic text-sm sm:text-base">Загрузка погоды...</p>
          )}
        </div>

        {/* Заголовок и кнопка */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-purple-950 drop-shadow-lg">
              Мой гардероб
            </h2>
            <p className="text-purple-900 text-sm sm:text-base mt-1">
              {cards.length} {cards.length === 1 ? 'вещь' : cards.length >= 2 && cards.length <= 4 ? 'вещи' : 'вещей'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>➕</span> Добавить вещь
          </button>
        </div>

        {/* Сетка карточек */}
        {cards.length === 0 ? (
          <div className="text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl">
            <p className="text-2xl text-purple-900 mb-2">У тебя пока нет вещей 😢</p>
            <p className="text-purple-800">Нажми кнопку "Добавить вещь" чтобы создать первую карточку!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-gradient-to-b from-purple-950 to-indigo-950 backdrop-blur-xl rounded-xl border-4 border-purple-700/60 shadow-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col"
              >
                {/* Изображение */}
                <div className="relative w-full pt-[75%] bg-purple-900/50">
                  {imageUrls[card.id] ? (
                    <img
                      src={imageUrls[card.id]}
                      alt={card.clothName}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Error loading image for card ${card.id}`);
                        e.target.onerror = null;
                        setImageUrls(prev => ({ ...prev, [card.id]: null }));
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400/50">
                      {loadingImages[card.id] ? (
                        <>
                          <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-xs">Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl mb-1">📸</span>
                          <span className="text-xs">Нет фото</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-purple-200 mb-2 line-clamp-1">
                    {card.clothName || 'Без названия'}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs flex-1">
                    <p className="text-purple-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Категория:</span> 
                      <span>{getCategoryLabel(card.category)}</span>
                    </p>
                    
                    <p className="text-purple-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Стиль:</span> 
                      <span>{getStyleLabel(card.style)}</span>
                    </p>
                    
                    <p className="text-purple-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Цвет:</span>
                      {card.color && (
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getColorFromName(card.color) }}
                        />
                      )}
                      <span className="truncate max-w-[100px]">{card.color || '—'}</span>
                    </p>
                    
                    <p className="text-purple-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Сезон:</span> 
                      <span>{getSeasonLabel(card.season)}</span>
                    </p>
                    
                    <p className="text-purple-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Теплота:</span>
                      <span className="flex">
                        {'❤️'.repeat(card.warmthLevel || 0)}
                        {'🤍'.repeat(5 - (card.warmthLevel || 0))}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => openEdit(card)}
                    className="mt-3 w-full bg-amber-400 hover:bg-amber-500 text-purple-950 font-bold py-2 px-3 rounded-lg text-sm transition-all hover:scale-105"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модалка создания/редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-purple-950 to-indigo-950 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-4 border-purple-700/60 my-8">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-200 mb-4">
              {editingCard ? 'Редактировать вещь' : 'Новая вещь'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(previewUrl || selectedFile) && (
                <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 border-4 border-purple-700 rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-purple-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-700 file:text-white file:text-sm file:cursor-pointer hover:file:bg-purple-600"
              />

              <input
                type="text"
                placeholder="Название вещи *"
                value={form.clothName}
                onChange={(e) => setForm({ ...form, clothName: e.target.value })}
                className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-lg px-3 py-2 text-sm sm:text-base text-purple-200 placeholder:text-purple-400 focus:border-amber-400 outline-none"
                required
              />

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-1">Категория</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-lg px-3 py-2 text-sm sm:text-base text-purple-200 focus:border-amber-400 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-1">Стиль</label>
                <select
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-lg px-3 py-2 text-sm sm:text-base text-purple-200 focus:border-amber-400 outline-none"
                >
                  {STYLES.map(style => (
                    <option key={style} value={style}>{getStyleLabel(style)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-1">Цвет</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-lg px-3 py-2 text-sm sm:text-base text-purple-200 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {form.color ? (
                        <>
                          <span 
                            className="inline-block w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getColorFromName(form.color) }}
                          />
                          <span className="truncate">{form.color}</span>
                        </>
                      ) : 'Выберите цвет'}
                    </span>
                    <span className="text-purple-400 flex-shrink-0">▼</span>
                  </button>
                  
                  {showColorPicker && (
                    <div className="absolute z-10 mt-1 w-full bg-purple-900 border-2 border-purple-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-1">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className="flex items-center gap-2 p-1.5 hover:bg-purple-800 rounded-lg text-left"
                            onClick={() => {
                              setForm({ ...form, color: color.name });
                              setShowColorPicker(false);
                            }}
                          >
                            <span 
                              className="inline-block w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="text-purple-200 text-xs truncate">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-1">Сезон</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-lg px-3 py-2 text-sm sm:text-base text-purple-200 focus:border-amber-400 outline-none"
                >
                  {SEASONS.map(season => (
                    <option key={season} value={season}>{getSeasonLabel(season)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-1">
                  Теплота: {form.warmthLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.warmthLevel}
                  onChange={(e) => setForm({ ...form, warmthLevel: parseInt(e.target.value) })}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-purple-300 text-xs mt-1">
                  <span>❄️ Холодно</span>
                  <span>🔥 Жарко</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-2.5 rounded-lg font-bold text-white text-sm sm:text-base transition-all"
                >
                  {editingCard ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-purple-900/50 hover:bg-purple-800/50 py-2.5 rounded-lg font-bold text-white border-2 border-purple-700 text-sm sm:text-base transition-all"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка выбора стиля для генерации */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-950 to-indigo-950 rounded-xl max-w-md w-full p-6 shadow-2xl border-4 border-purple-700/60">
            <h2 className="text-2xl font-bold text-purple-200 mb-4 text-center">
              Выберите стиль образа
            </h2>
            
            <div className="space-y-3 mb-6">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all ${
                    selectedStyle === style
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-purple-950 shadow-lg scale-105'
                      : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800/70 border-2 border-purple-700'
                  }`}
                >
                  {getStyleLabel(style)}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={generateOutfits}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-3 rounded-xl font-bold text-white transition-all"
              >
                Сгенерировать
              </button>
              <button
                onClick={() => setIsStyleModalOpen(false)}
                className="flex-1 bg-purple-900/50 hover:bg-purple-800/50 py-3 rounded-xl font-bold text-white border-2 border-purple-700 transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка с результатами генерации */}
      {isOutfitModalOpen && generatedOutfits.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-purple-950 to-indigo-950 rounded-xl max-w-4xl w-full p-6 shadow-2xl border-4 border-purple-700/60 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-200">
                Сгенерированные образы (Стиль: {getStyleLabel(selectedStyle)})
              </h2>
              <button
                onClick={() => setIsOutfitModalOpen(false)}
                className="text-purple-400 hover:text-purple-200 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {outfitError && (
              <div className="bg-red-900/70 border border-red-600 rounded-lg p-4 mb-4 text-red-100">
                {outfitError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedOutfits.map((outfit) => (
                <div key={outfit.id} className="bg-purple-900/50 rounded-lg p-4 border border-purple-700">
                  <h3 className="text-lg font-bold text-purple-200 mb-2">{outfit.outfitName}</h3>
                  <p className="text-purple-300 text-sm">Стиль: {getStyleLabel(outfit.style)}</p>
                  {outfit.temperatureC && (
                    <p className="text-purple-300 text-sm">Температура: {outfit.temperatureC}°C</p>
                  )}
                  {outfit.weatherCondition && (
                    <p className="text-purple-300 text-sm">Погода: {outfit.weatherCondition}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-purple-200 font-semibold text-sm mb-2">Предметы:</p>
                    <div className="space-y-1">
                      {outfit.items?.map((item) => (
                        <div key={item.id} className="text-purple-300 text-xs flex items-center gap-2">
                          <span>{item.clothName}</span>
                          <span className="text-purple-400">({getCategoryLabel(item.category)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
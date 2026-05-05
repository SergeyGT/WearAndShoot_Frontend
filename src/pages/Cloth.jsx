// Cloth.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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

const SEASONS = ['SUMMER', 'AUTUMN', 'WINTER', 'SPRING'];

// Палитра цветов (мягкие оттенки)
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
  
  // Защита от повторных запросов
  const isGeneratingRef = useRef(false);
  
  // Модалка выбора стиля для генерации
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('CASUAL');
  const [outfitName, setOutfitName] = useState(''); // ДОБАВЛЕНО: имя образа
  const [outfitImages, setOutfitImages] = useState({}); // ДОБАВЛЕНО: изображения вещей в образах

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
  const [likedOutfitImages, setLikedOutfitImages] = useState({}); // ДОБАВЛЕНО: изображения для избранного

  // Удаленные 
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Кэш погоды
  const WEATHER_CACHE_KEY = 'weather_cache';
  const CACHE_TTL = 15 * 60 * 1000;

  // Функция для загрузки изображений вещей в образе
  const loadOutfitItemImages = async (items) => {
    const imageMap = {};
    if (!items || items.length === 0) return imageMap;
    
    await Promise.all(items.map(async (item) => {
      if (item.id) {
        // Проверяем, есть ли уже загруженное изображение в кэше карточек
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

  // Удаление образа
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

  // Функция для открытия модалки выбора стиля
  const openStyleModal = () => {
    if (cards.length < 3) {
      setOutfitError('Недостаточно вещей для генерации образов (нужно минимум 3)');
      return;
    }
    setOutfitError(null);
    setOutfitName(''); // Сбрасываем имя
    setSelectedStyle('CASUAL'); // Сбрасываем стиль на дефолтный
    setIsStyleModalOpen(true);
  };

  // Генерация образов с выбранным стилем
  const generateOutfits = async () => {
    if (isGeneratingRef.current || outfitLoading) {
      console.log('Генерация уже выполняется');
      return;
    }
    
    const hasTopBase = cards.some(c => c.category === 'TOP_BASE');
    const hasBottom = cards.some(c => c.category === 'BOTTOM');
    const missingCategories = [];
    if (!hasTopBase) missingCategories.push('Верх (футболка/рубашка)');
    if (!hasBottom) missingCategories.push('Низ (брюки/юбка/шорты)');
    
    if (missingCategories.length > 0) {
        setOutfitError(
            `Для создания образа нужны: ${missingCategories.join(' и ')}. Добавьте недостающие вещи.`
        );
        return; // не отправляем запрос
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
          outfitName: outfitName.trim() || null // Отправляем имя образа
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include',
          });
          if (!meRes.ok) {
            navigate('/login');
            return;
          }
          throw new Error('Ошибка авторизации. Попробуйте перезагрузить страницу.');
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка генерации');
      }

      const outfits = await res.json();
      console.log('Получены образы:', outfits);
      
      // Загружаем изображения для всех образов
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

  // Функция лайка образа
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
        
        // Обновляем в сгенерированных образах
        setGeneratedOutfits(prev => 
          prev.map(outfit => 
            outfit.id === outfitId ? updatedOutfit : outfit
          )
        );
        
        // Обновляем в лайкнутых
        if (updatedOutfit.isLiked) {
          setLikedOutfits(prev => [...prev, updatedOutfit]);
          // Копируем изображения если есть
          if (outfitImages[outfitId]) {
            setLikedOutfitImages(prev => ({
              ...prev,
              [outfitId]: outfitImages[outfitId]
            }));
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

  // Загрузка лайкнутых образов
  const loadLikedOutfits = async () => {
    try {
      const res = await fetch(`${API_BASE}/cloth/outfits/liked/${userId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setLikedOutfits(data);
        
        // Загружаем изображения для избранных образов
        const allImages = {};
        for (const outfit of data) {
          if (outfit.items && outfit.items.length > 0) {
            const images = await loadOutfitItemImages(outfit.items);
            allImages[outfit.id] = images;
          }
        }
        setLikedOutfitImages(allImages);
        setShowLikedOutfits(true);
      }
    } catch (err) {
      console.error('Ошибка загрузки лайкнутых образов:', err);
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
        // Очищаем все blob URLs
        Object.values(imageUrls).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        Object.values(outfitImages).forEach(imgMap => {
          Object.values(imgMap).forEach(url => {
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
        });
        Object.values(likedOutfitImages).forEach(imgMap => {
          Object.values(imgMap).forEach(url => {
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
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

  // Градиент для погоды (мягкие тона)
  const getWeatherGradient = () => {
    if (!weather) return 'from-indigo-500/30 to-amber-500/30';
    const temp = weather.current.temp_c;
    if (temp < -10) return 'from-indigo-400/40 to-slate-500/40';
    if (temp < 0) return 'from-slate-400/40 to-indigo-500/40';
    if (temp < 10) return 'from-indigo-300/40 to-purple-400/40';
    if (temp < 20) return 'from-amber-300/40 to-indigo-400/40';
    return 'from-orange-300/40 to-amber-400/40';
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
          // Очищаем старые blob URLs
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
      Object.values(outfitImages).forEach(imgMap => {
        Object.values(imgMap).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
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
    const labels = { 'SUMMER': 'Лето', 'AUTUMN': 'Осень', 'WINTER': 'Зима', 'SPRING': 'Весна' };
    return labels[season] || season;
  };

  const getColorFromName = (colorName) => {
    const color = COLOR_PALETTE.find(c => c.name === colorName);
    return color ? color.value : '#CCCCCC';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-amber-50">
        <div className="bg-slate-800/80 backdrop-blur-xl px-8 py-6 rounded-2xl border border-indigo-500/30">
          <p className="text-2xl text-indigo-200 animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-slate-100 to-amber-50">
      {/* Хедер */}
      <header className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-md border-b border-indigo-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
                Wear & Shoot
              </h1>
              {userName && (
                <span className="text-indigo-600 text-sm sm:text-base bg-indigo-100/80 px-3 py-1 rounded-full">
                  Привет, {userName}!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadLikedOutfits}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all"
              >
                ❤️ Избранное
              </button>
              <button
                onClick={openStyleModal}
                disabled={outfitLoading || cards.length < 3}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outfitLoading ? 'Генерация...' : '✨ Сгенерировать образ'}
              </button>
              {outfitError && (
              <div className="mt-2 bg-red-900/50 border border-red-400 rounded-lg p-2 text-red-200 text-sm text-center">
                  ⚠️ {outfitError}
              </div>
          )}
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutLoading ? 'Выход...' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Блок погоды */}
        <div className={`mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br ${getWeatherGradient()} rounded-2xl border border-indigo-300/40 backdrop-blur-sm shadow-md`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
              <span>🌤️</span> Погода сейчас
            </h2>
            <button
              onClick={loadWeather}
              disabled={weatherLoading}
              className="w-full sm:w-auto px-4 py-2 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{weatherLoading ? '⏳' : '🔄'}</span>
              <span className="sm:hidden">{weatherLoading ? 'Загрузка...' : 'Обновить'}</span>
              <span className="hidden sm:inline">{weatherLoading ? 'Обновление...' : 'Обновить'}</span>
            </button>
          </div>

          {weatherError ? (
            <p className="text-slate-600 text-center text-sm sm:text-base">{weatherError}</p>
          ) : weather ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <img
                src={`https:${weather.current.condition.icon}`}
                alt={weather.current.condition.text}
                className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                  <p className="text-4xl sm:text-5xl font-extrabold text-slate-800">
                    {Math.round(weather.current.temp_c)}°
                  </p>
                  <p className="text-lg sm:text-xl text-slate-700 capitalize">
                    {weather.current.condition.text}
                  </p>
                </div>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  Ощущается: {Math.round(weather.current.feelslike_c)}° • 
                  {weather.location.name}, {weather.location.country}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-center italic text-sm sm:text-base">Загрузка погоды...</p>
          )}
        </div>

        {/* Заголовок и кнопка */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 drop-shadow-sm">
              Мой гардероб
            </h2>
            <p className="text-indigo-600 text-sm sm:text-base mt-1">
              {cards.length} {cards.length === 1 ? 'вещь' : cards.length >= 2 && cards.length <= 4 ? 'вещи' : 'вещей'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>➕</span> Добавить вещь
          </button>
        </div>

        {/* Сетка карточек */}
        {cards.length === 0 ? (
          <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-indigo-200">
            <p className="text-2xl text-slate-700 mb-2">У тебя пока нет вещей 😢</p>
            <p className="text-indigo-600">Нажми кнопку "Добавить вещь" чтобы создать первую карточку!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-gradient-to-b from-slate-800 to-indigo-900 backdrop-blur-sm rounded-xl border border-indigo-500/30 shadow-lg overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col"
              >
                {/* Изображение */}
                <div className="relative w-full pt-[75%] bg-indigo-900/30">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400/50">
                      {loadingImages[card.id] ? (
                        <>
                          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
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
                  <h3 className="text-lg font-bold text-indigo-200 mb-2 line-clamp-1">
                    {card.clothName || 'Без названия'}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs flex-1">
                    <p className="text-indigo-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Категория:</span> 
                      <span>{getCategoryLabel(card.category)}</span>
                    </p>
                    
                    <p className="text-indigo-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Стиль:</span> 
                      <span>{getStyleLabel(card.style)}</span>
                    </p>
                    
                    <p className="text-indigo-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Цвет:</span>
                      {card.color && (
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getColorFromName(card.color) }}
                        />
                      )}
                      <span className="truncate max-w-[100px]">{card.color || '—'}</span>
                    </p>
                    
                    <p className="text-indigo-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Сезон:</span> 
                      <span>{getSeasonLabel(card.season)}</span>
                    </p>
                    
                    <p className="text-indigo-300/80 flex flex-wrap items-center gap-1">
                      <span className="font-semibold">Теплота:</span>
                      <span className="flex">
                        {'❤️'.repeat(card.warmthLevel || 0)}
                        {'🤍'.repeat(5 - (card.warmthLevel || 0))}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => openEdit(card)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all hover:scale-105">
                      ✏️
                    </button>
                    <button onClick={() => confirmDelete('card', card.id, card.clothName)}
                      disabled={deletingCardId === card.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all hover:scale-105 disabled:opacity-50">
                      {deletingCardId === card.id ? '⏳' : '🗑️'}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-800 to-indigo-900 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-indigo-500/30 my-8">
            <h2 className="text-xl sm:text-2xl font-bold text-indigo-200 mb-4">
              {editingCard ? 'Редактировать вещь' : 'Новая вещь'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(previewUrl || selectedFile) && (
                <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 border-2 border-indigo-500/50 rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-indigo-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:cursor-pointer hover:file:bg-indigo-500"
              />

              <input
                type="text"
                placeholder="Название вещи *"
                value={form.clothName}
                onChange={(e) => setForm({ ...form, clothName: e.target.value })}
                className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm sm:text-base text-indigo-100 placeholder:text-indigo-400/60 focus:border-amber-500 outline-none"
                required
              />

              <div>
                <label className="block text-indigo-200 text-sm font-semibold mb-1">Категория</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm sm:text-base text-indigo-100 focus:border-amber-500 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-indigo-200 text-sm font-semibold mb-1">Стиль</label>
                <select
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm sm:text-base text-indigo-100 focus:border-amber-500 outline-none"
                >
                  {OUTFIT_STYLES.map(style => (
                    <option key={style} value={style}>{getStyleLabel(style)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-indigo-200 text-sm font-semibold mb-1">Цвет</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm sm:text-base text-indigo-100 flex items-center justify-between"
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
                    <span className="text-indigo-400 flex-shrink-0">▼</span>
                  </button>
                  
                  {showColorPicker && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-indigo-500/30 rounded-lg p-2 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-1">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className="flex items-center gap-2 p-1.5 hover:bg-indigo-800/50 rounded-lg text-left"
                            onClick={() => {
                              setForm({ ...form, color: color.name });
                              setShowColorPicker(false);
                            }}
                          >
                            <span 
                              className="inline-block w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="text-indigo-200 text-xs truncate">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-indigo-200 text-sm font-semibold mb-1">Сезон</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm sm:text-base text-indigo-100 focus:border-amber-500 outline-none"
                >
                  {SEASONS.map(season => (
                    <option key={season} value={season}>{getSeasonLabel(season)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-indigo-200 text-sm font-semibold mb-1">
                  Теплота: {form.warmthLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.warmthLevel}
                  onChange={(e) => setForm({ ...form, warmthLevel: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-indigo-300 text-xs mt-1">
                  <span>❄️ Холодно</span>
                  <span>🔥 Жарко</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg font-bold text-white text-sm sm:text-base transition-all"
                >
                  {editingCard ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 py-2.5 rounded-lg font-bold text-indigo-200 border border-indigo-500/30 text-sm sm:text-base transition-all"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* МОДАЛКА ВЫБОРА СТИЛЯ И ИМЕНИ ОБРАЗА (ИСПРАВЛЕНО) */}
      {/* ============================================ */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-indigo-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-indigo-500/30">
            <h2 className="text-2xl font-bold text-indigo-200 mb-4 text-center">
              Создание образа
            </h2>
            
            {/* ДОБАВЛЕНО: Поле для имени образа */}
            <div className="mb-4">
              <label className="block text-indigo-200 text-sm font-semibold mb-2">
                Название образа (необязательно)
              </label>
              <input
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="Например: Вечерний выход"
                className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-indigo-100 placeholder:text-indigo-400/60 focus:border-amber-500 outline-none"
              />
              <p className="text-indigo-400 text-xs mt-1">
                Оставьте пустым для автоматического названия
              </p>
            </div>
            
            <h3 className="text-lg font-semibold text-indigo-200 mb-3">Выберите стиль:</h3>
            
            <div className="space-y-3 mb-6">
              {OUTFIT_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all ${
                    selectedStyle === style
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                      : 'bg-slate-700/50 text-indigo-200 hover:bg-indigo-800/50 border border-indigo-500/30'
                  }`}
                >
                  {getStyleLabel(style)}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={generateOutfits}
                disabled={outfitLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outfitLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Генерация...
                  </span>
                ) : '✨ Создать'}
              </button>
              <button
                onClick={() => {
                  setIsStyleModalOpen(false);
                  setOutfitName('');
                }}
                className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 py-3 rounded-xl font-bold text-indigo-200 border border-indigo-500/30 transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* МОДАЛКА С РЕЗУЛЬТАТАМИ ГЕНЕРАЦИИ (ИСПРАВЛЕНО) */}
      {/* ============================================ */}
      {isOutfitModalOpen && generatedOutfits.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-800 to-indigo-900 rounded-xl max-w-6xl w-full p-6 shadow-xl border border-indigo-500/30 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-200">
                {outfitName || 'Сгенерированные образы'}
              </h2>
              <button
                onClick={() => setIsOutfitModalOpen(false)}
                className="text-indigo-400 hover:text-indigo-200 text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            {outfitError && (
              <div className="bg-rose-900/50 border border-rose-600 rounded-lg p-4 mb-4 text-rose-100">
                {outfitError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedOutfits.map((outfit) => (
                <div key={outfit.id} className="bg-slate-700/50 rounded-xl p-4 border border-indigo-500/30 relative hover:border-indigo-400/50 transition-all">
                  {/* Кнопка лайка */}
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <button onClick={() => toggleLike(outfit.id)}
                      className="text-2xl transition-all hover:scale-125"
                      title={outfit.isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}>
                      {outfit.isLiked ? '❤️' : '🤍'}
                    </button>
                    <button onClick={() => confirmDelete('outfit', outfit.id, outfit.outfitName)}
                      disabled={deletingOutfitId === outfit.id}
                      className="text-xl transition-all hover:scale-125 disabled:opacity-50" title="Удалить образ">
                      {deletingOutfitId === outfit.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-indigo-200 mb-3 pr-10">
                    {outfit.outfitName}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 rounded-full text-sm">
                      {getStyleLabel(outfit.style)}
                    </span>
                    {outfit.temperatureC && (
                      <span className="px-3 py-1 bg-slate-600/30 text-indigo-200 rounded-full text-sm">
                        🌡️ {Math.round(outfit.temperatureC)}°C
                      </span>
                    )}
                    {outfit.weatherCondition && (
                      <span className="px-3 py-1 bg-slate-600/30 text-indigo-200 rounded-full text-sm">
                        🌤️ {outfit.weatherCondition}
                      </span>
                    )}
                  </div>
                  
                  {/* ДОБАВЛЕНО: Отображение вещей с фото */}
                  <div className="space-y-3">
                    <p className="text-indigo-200 font-semibold text-sm">Состав образа:</p>
                    {outfit.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                        {/* Фото вещи */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-indigo-900/30 flex-shrink-0 border border-indigo-500/20">
                          {outfitImages[outfit.id]?.[item.id] ? (
                            <img
                              src={outfitImages[outfit.id][item.id]}
                              alt={item.clothName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              👕
                            </div>
                          )}
                        </div>
                        
                        {/* Инфо о вещи */}
                        <div className="flex-1 min-w-0">
                          <p className="text-indigo-200 font-semibold truncate">
                            {item.clothName}
                          </p>
                          <p className="text-indigo-400 text-xs">
                            {getCategoryLabel(item.category)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* МОДАЛКА С ИЗБРАННЫМИ ОБРАЗАМИ (ИСПРАВЛЕНО) */}
      {/* ============================================ */}
      {showLikedOutfits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-800 to-indigo-900 rounded-xl max-w-6xl w-full p-6 shadow-xl border border-indigo-500/30 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-200">
                ❤️ Избранные образы
              </h2>
              <button
                onClick={() => setShowLikedOutfits(false)}
                className="text-indigo-400 hover:text-indigo-200 text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            {likedOutfits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">🤍</p>
                <p className="text-indigo-300 text-lg">Нет избранных образов</p>
                <p className="text-indigo-400 text-sm mt-2">
                  Лайкните понравившиеся образы, чтобы они появились здесь
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedOutfits.map((outfit) => (
                  <div key={outfit.id} className="bg-slate-700/50 rounded-xl p-4 border border-indigo-500/30 hover:border-rose-400/50 transition-all">
                        <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-indigo-200">{outfit.outfitName}</h3>
                      <div className="flex gap-1">
                        <span className="text-2xl">❤️</span>
                        <button onClick={() => confirmDelete('liked_outfit', outfit.id, outfit.outfitName)}
                          disabled={deletingOutfitId === outfit.id}
                          className="text-xl transition-all hover:scale-125 disabled:opacity-50" title="Удалить образ">
                          {deletingOutfitId === outfit.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 rounded-full text-sm">
                        {getStyleLabel(outfit.style)}
                      </span>
                    </div>
                    
                    {/* ДОБАВЛЕНО: Фото вещей в избранном */}
                    <div className="space-y-3">
                      <p className="text-indigo-200 font-semibold text-sm">Состав образа:</p>
                      {outfit.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-indigo-900/30 flex-shrink-0 border border-indigo-500/20">
                            {likedOutfitImages[outfit.id]?.[item.id] ? (
                              <img
                                src={likedOutfitImages[outfit.id][item.id]}
                                alt={item.clothName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                👕
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-indigo-200 font-semibold truncate">
                              {item.clothName}
                            </p>
                            <p className="text-indigo-400 text-xs">
                              {getCategoryLabel(item.category)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-b from-slate-800 to-indigo-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-red-500/30">
            <h3 className="text-xl font-bold text-red-400 mb-3">Подтверждение удаления</h3>
            <p className="text-indigo-200 mb-2">
              {deleteTarget?.type === 'card' ? 'Удалить вещь?' : 'Удалить образ?'}
            </p>
            <p className="text-amber-400 font-semibold mb-4">"{deleteTarget?.name}"?</p>
            {deleteTarget?.type === 'card' && (
              <p className="text-red-400/80 text-sm mb-4">⚠️ Вещь удалится из всех образов!</p>
            )}
            <div className="flex gap-3">
              <button onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg font-bold text-white transition-all">
                Удалить
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 py-2.5 rounded-lg font-bold text-indigo-200 border border-indigo-500/30 transition-all">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
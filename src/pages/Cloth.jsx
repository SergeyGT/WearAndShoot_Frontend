// src/pages/Cloth.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

// Константы для Enum
const CATEGORIES = ['UP', 'DOWN', 'SHOES'];
const SEASONS = ['SUMMER', 'AUTUMN', 'SPRING', 'WINTER'];

// Палитра цветов (название цвета и его hex-код)
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

  // Модалка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState({
    clothName: '',
    category: 'UP',
    color: '',
    season: 'SUMMER',
    warmthLevel: 3,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Функция для выхода
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        // Очищаем все URL изображений перед выходом
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

  // Получаем текущего пользователя
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (!res.ok) {
          console.warn('Не авторизован → редирект на логин');
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

  // Функция для загрузки изображения карточки
  const fetchCardImage = async (cardId) => {
    if (loadingImages[cardId]) return;
    
    try {
      setLoadingImages(prev => ({ ...prev, [cardId]: true }));
      
      const res = await fetch(`${API_BASE}/cloth/image/${cardId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setImageUrls(prev => ({ ...prev, [cardId]: url }));
        console.log(`Image loaded for card ${cardId}`);
      } else {
        console.log(`No image for card ${cardId}, status: ${res.status}`);
        setImageUrls(prev => ({ ...prev, [cardId]: null }));
      }
    } catch (err) {
      console.error(`Ошибка загрузки изображения для карточки ${cardId}:`, err);
      setImageUrls(prev => ({ ...prev, [cardId]: null }));
    } finally {
      setLoadingImages(prev => ({ ...prev, [cardId]: false }));
    }
  };

  // Загружаем карточки
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
        
        // Загружаем изображения для каждой карточки
        if (data && data.length > 0) {
          data.forEach(card => {
            if (card.id) {
              fetchCardImage(card.id);
            }
          });
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

  // Предпросмотр изображения
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
  }, [selectedFile]);

  // Очищаем URL объектов при размонтировании
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  const openCreate = () => {
    setEditingCard(null);
    setForm({ 
      clothName: '', 
      category: 'UP', 
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
      category: card.category || 'UP',
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
      alert('Не удалось определить пользователя. Попробуйте войти заново.');
      return;
    }

    const clothData = {
      userId,
      clothName: form.clothName.trim(),
      category: form.category,
      color: form.color, // Сохраняем как строку (название цвета или hex)
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
        
        // Очищаем старые URL изображений
        Object.values(imageUrls).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        
        // Загружаем новые изображения
        const newImageUrls = {};
        if (updatedCards && updatedCards.length > 0) {
          for (const card of updatedCards) {
            if (card.id) {
              try {
                const imgRes = await fetch(`${API_BASE}/cloth/image/${card.id}`, {
                  credentials: 'include',
                });
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  newImageUrls[card.id] = URL.createObjectURL(blob);
                }
              } catch (err) {
                console.error(`Ошибка загрузки изображения для карточки ${card.id}:`, err);
              }
            }
          }
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

  // Функция для перевода Enum в читаемый текст
  const getCategoryLabel = (category) => {
    const labels = {
      'UP': 'Верх',
      'DOWN': 'Низ',
      'SHOES': 'Обувь'
    };
    return labels[category] || category;
  };

  const getSeasonLabel = (season) => {
    const labels = {
      'SUMMER': 'Лето',
      'AUTUMN': 'Осень',
      'SPRING': 'Весна',
      'WINTER': 'Зима'
    };
    return labels[season] || season;
  };

  // Функция для получения цвета фона из названия цвета
  const getColorFromName = (colorName) => {
    const color = COLOR_PALETTE.find(c => c.name === colorName);
    return color ? color.value : '#CCCCCC';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl text-purple-200">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500">
      {/* Хедер с логаутом */}
      <div className="bg-purple-950/80 backdrop-blur-sm border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-purple-200">
                Wear & Shoot
              </h2>
              {userName && (
                <span className="text-purple-300">
                  Привет, {userName}!
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className={`
                px-6 py-2 rounded-xl font-semibold text-white
                transition-all duration-300
                ${logoutLoading 
                  ? 'bg-red-800/50 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105'
                }
              `}
            >
              {logoutLoading ? 'Выход...' : 'Выйти'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
              Мой гардероб
            </h1>
            <p className="mt-2 text-purple-900/90 text-lg sm:text-xl font-medium">
              {cards.length} {cards.length === 1 ? 'вещь' : cards.length >= 2 && cards.length <= 4 ? 'вещи' : 'вещей'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105"
          >
            + Добавить вещь
          </button>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-purple-900/70 text-2xl mb-4">
                У тебя пока нет вещей 😢
              </p>
              <p className="text-purple-800/60 text-lg">
                Нажми кнопку "Добавить вещь" чтобы создать первую карточку!
              </p>
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="bg-gradient-to-b from-purple-950 to-indigo-950 backdrop-blur-xl rounded-2xl border-4 border-purple-700/60 shadow-2xl shadow-purple-900/70 overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col h-[450px]"
              >
                <div className="h-48 bg-purple-900/50 relative overflow-hidden">
                  {imageUrls[card.id] ? (
                    <img
                      src={imageUrls[card.id]}
                      alt={card.clothName}
                      className="w-full h-full object-cover"
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
                          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-sm">Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-6xl mb-2">📸</span>
                          <span className="text-sm">Нет фото</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-purple-200 mb-2 line-clamp-1">
                      {card.clothName || 'Без названия'}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-purple-300/80">
                        <span className="font-semibold">Категория:</span> {getCategoryLabel(card.category)}
                      </p>
                      <p className="text-purple-300/80 flex items-center">
                        <span className="font-semibold mr-1">Цвет:</span>
                        {card.color && (
                          <span 
                            className="inline-block w-4 h-4 rounded-full mr-1" 
                            style={{ backgroundColor: getColorFromName(card.color) }}
                          ></span>
                        )}
                        {card.color || '—'}
                      </p>
                      <p className="text-purple-300/80">
                        <span className="font-semibold">Сезон:</span> {getSeasonLabel(card.season)}
                      </p>
                      <p className="text-purple-300/80">
                        <span className="font-semibold">Теплота:</span> {'❤️'.repeat(card.warmthLevel || 0)}{'🤍'.repeat(5 - (card.warmthLevel || 0))}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openEdit(card)}
                    className="mt-4 bg-amber-400 hover:bg-amber-500 text-purple-950 font-bold py-2.5 px-4 rounded-xl transition-all hover:scale-105"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-950 to-indigo-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-4 border-purple-700/60">
            <h2 className="text-2xl font-black text-purple-200 mb-4">
              {editingCard ? 'Редактировать вещь' : 'Новая вещь'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(previewUrl || selectedFile) && (
                <div className="mx-auto w-40 h-40 border-4 border-purple-700 rounded-xl overflow-hidden">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-700 file:text-white file:cursor-pointer file:hover:bg-purple-600"
              />

              <input
                type="text"
                placeholder="Название вещи *"
                value={form.clothName}
                onChange={(e) => setForm({ ...form, clothName: e.target.value })}
                className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-xl px-4 py-3 text-purple-200 placeholder:text-purple-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none"
                required
              />

              {/* Выбор категории */}
              <div>
                <label className="block text-purple-200 mb-1 font-semibold">Категория</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-xl px-4 py-3 text-purple-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-purple-900">
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор цвета из палитры */}
              <div>
                <label className="block text-purple-200 mb-1 font-semibold">Цвет</label>
                <div className="relative">
                  <div 
                    className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-xl px-4 py-3 text-purple-200 cursor-pointer flex items-center justify-between"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    <span className="flex items-center">
                      {form.color ? (
                        <>
                          <span 
                            className="inline-block w-5 h-5 rounded-full mr-2" 
                            style={{ backgroundColor: getColorFromName(form.color) }}
                          ></span>
                          {form.color}
                        </>
                      ) : (
                        'Выберите цвет'
                      )}
                    </span>
                    <span className="text-purple-400">▼</span>
                  </div>
                  
                  {showColorPicker && (
                    <div className="absolute z-10 mt-1 w-full bg-purple-900 border-2 border-purple-700 rounded-xl p-2 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <div
                            key={color.value}
                            className="flex items-center p-2 hover:bg-purple-800 rounded-lg cursor-pointer"
                            onClick={() => {
                              setForm({ ...form, color: color.name });
                              setShowColorPicker(false);
                            }}
                          >
                            <span 
                              className="inline-block w-5 h-5 rounded-full mr-2" 
                              style={{ backgroundColor: color.value }}
                            ></span>
                            <span className="text-purple-200 text-sm">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Выбор сезона */}
              <div>
                <label className="block text-purple-200 mb-1 font-semibold">Сезон</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full bg-purple-900/50 border-2 border-purple-700 rounded-xl px-4 py-3 text-purple-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none"
                >
                  {SEASONS.map(season => (
                    <option key={season} value={season} className="bg-purple-900">
                      {getSeasonLabel(season)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ползунок теплоты */}
              <div>
                <label className="block text-purple-200 mb-1 font-semibold">
                  Теплота: {form.warmthLevel} / 5
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

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                >
                  {editingCard ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-purple-900/50 hover:bg-purple-800/50 py-3 rounded-xl font-bold text-white border-2 border-purple-700 transition-all hover:scale-105"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
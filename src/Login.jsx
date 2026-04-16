// Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Проверяем, авторизован ли пользователь уже
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:8080/auth/me', {
          credentials: 'include',
        });

        if (res.ok) {
          navigate('/cloth', { replace: true });
        }
      } catch {
        // остаёмся на странице логина
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Неверный логин или пароль');
      }

      setStatus({
        type: 'success',
        message: 'Вход выполнен! Перенаправляем...',
      });

      setTimeout(() => {
        navigate('/cloth', { replace: true });
      }, 1200);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Ошибка входа',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-amber-50 p-4 sm:p-6">
      <div className="
        w-full max-w-xl 
        bg-gradient-to-b from-slate-800 to-indigo-900 
        backdrop-blur-sm 
        rounded-3xl 
        border border-indigo-500/30 
        shadow-xl 
        overflow-hidden
        animate-fade-in-up opacity-0 translate-y-8
      " style={{ animationDelay: '0.3s', animationDuration: '0.9s' }}>
        
        <div className="px-10 pt-14 pb-10 text-center">
          <h1 className="
            text-5xl sm:text-6xl font-black 
            bg-gradient-to-r from-indigo-300 via-indigo-200 to-amber-300 
            bg-clip-text text-transparent 
            drop-shadow-sm tracking-tight
          ">
            Вход в Wear & Shoot
          </h1>
          <p className="mt-4 text-indigo-200/80 text-xl sm:text-2xl font-medium">
            Войди и продолжи творить
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 sm:px-12 pb-14 space-y-7">
          <div>
            <label className="block text-base sm:text-lg font-semibold text-indigo-200 mb-3">
              Никнейм или Email
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="
                w-full px-6 py-5 
                bg-slate-700/50 
                border border-indigo-500/30 
                rounded-2xl 
                text-indigo-100 
                placeholder-indigo-400/50 
                focus:border-amber-500 
                focus:ring-4 focus:ring-amber-500/20 
                focus:bg-slate-700/70 
                transition-all duration-300 
                outline-none 
                shadow-inner
              "
              placeholder="cool_guy_228 или you@example.com"
            />
          </div>

          <div>
            <label className="block text-base sm:text-lg font-semibold text-indigo-200 mb-3">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="
                w-full px-6 py-5 
                bg-slate-700/50 
                border border-indigo-500/30 
                rounded-2xl 
                text-indigo-100 
                placeholder-indigo-400/50 
                focus:border-amber-500 
                focus:ring-4 focus:ring-amber-500/20 
                focus:bg-slate-700/70 
                transition-all duration-300 
                outline-none 
                shadow-inner
              "
              placeholder="••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-6 rounded-2xl font-bold text-xl sm:text-2xl tracking-wide
              transition-all duration-300 shadow-md
              ${loading 
                ? 'bg-amber-600/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 hover:shadow-amber-500/30 hover:-translate-y-0.5 active:scale-95 text-white'
              }
            `}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>

          {status.message && (
            <div className={`mt-6 p-6 rounded-2xl text-center font-medium text-lg border shadow-md ${
              status.type === 'success' ? 'bg-emerald-900/50 border-emerald-600 text-emerald-100' :
                                          'bg-rose-900/50 border-rose-600 text-rose-100'
            }`}>
              {status.message}
            </div>
          )}
        </form>

        <div className="px-10 pb-12 text-center text-indigo-300/70 text-lg">
          Нет аккаунта?{' '}
          <a href="/register" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
            Зарегистрироваться
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
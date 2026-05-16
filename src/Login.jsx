// Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

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
        if (res.status === 401) {
          if (data.message?.toLowerCase().includes('user') || 
              data.message?.toLowerCase().includes('not found')) {
            throw new Error('Пользователь с таким именем не найден');
          } else if (data.message?.toLowerCase().includes('password')) {
            throw new Error('Неверный пароль');
          } else {
            throw new Error('Неверный логин или пароль');
          }
        } else if (res.status === 404) {
          throw new Error('Пользователь не найден');
        } else if (res.status === 400) {
          throw new Error('Некорректные данные. Проверьте логин и пароль');
        } else {
          throw new Error(data.message || 'Ошибка при входе. Попробуйте позже');
        }
      }

      setStatus({
        type: 'success',
        message: 'Вход выполнен! Перенаправляем...',
      });

      setTimeout(() => {
        navigate('/cloth', { replace: true });
      }, 1200);
    } catch (err) {
      let errorMessage = err.message || 'Ошибка входа';
      
      if (errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте соединение';
      } else if (errorMessage.toLowerCase().includes('json')) {
        errorMessage = 'Ошибка обработки ответа от сервера';
      }
      
      setStatus({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card--login">
          <div className="auth-header">
            <h1 className="auth-title">Добро пожаловать</h1>
            <p className="auth-subtitle">Войдите в аккаунт Wear & Shoot</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Никнейм или Email</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="cool_guy_228 или you@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-submit ${loading ? 'btn-submit--loading' : ''}`}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            {status.message && (
              <div className={`auth-message auth-message--${status.type}`}>
                {status.type === 'error' && (
                  <svg className="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {status.type === 'success' && (
                  <svg className="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {status.message}
              </div>
            )}
          </form>

          <div className="auth-footer">
            Нет аккаунта?{' '}
            <a href="/register" className="auth-link">
              Зарегистрироваться
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
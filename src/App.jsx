import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Проверяем, залогинен ли пользователь уже
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
        // если ошибка сети — остаёмся на странице
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Пароли не совпадают' });
      return;
    }

    if (formData.password.length < 6) {
      setStatus({ type: 'error', message: 'Пароль должен содержать минимум 6 символов' });
      return;
    }

    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.message?.toLowerCase().includes('уже существует')) {
          setStatus({
            type: 'info',
            message: 'Аккаунт уже существует. Войдите в систему.',
          });
        } else {
          throw new Error(data.message || 'Ошибка регистрации');
        }
        return;
      }

      setStatus({
        type: 'success',
        message: 'Аккаунт создан! Перенаправляем на каталог...',
      });

      setTimeout(() => {
        navigate('/cloth', { replace: true });
      }, 1500);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Что-то пошло не так',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card--register">
          <div className="auth-header">
            <h1 className="auth-title">Wear & Shoot</h1>
            <p className="auth-subtitle">Создайте аккаунт и начните творить</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Никнейм</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="cool_guy_228"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="you@example.com"
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
                placeholder="минимум 6 символов"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Повторите пароль</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? 'Создание...' : 'Зарегистрироваться'}
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
                {status.type === 'info' && (
                  <svg className="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {status.message}
                {status.type === 'info' && (
                  <div className="message-action">
                    <a href="/login" className="auth-link">Перейти к входу →</a>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="auth-footer">
            Уже есть аккаунт?{' '}
            <a href="/login" className="auth-link">
              Войти
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
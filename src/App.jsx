import { useState } from 'react'

function App() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка сервера')
      }

      setStatus({
        type: 'success',
        message: `Аккаунт создан! ID: ${data.id || '—'}`,
      })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Что-то пошло не так',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 p-4 sm:p-6">
      {/* карточка */}
      <div className="
        w-full max-w-xl 
        bg-gradient-to-b from-purple-950 to-indigo-950 
        backdrop-blur-xl 
        rounded-3xl 
        border-4 border-purple-700/60 
        shadow-2xl shadow-purple-900/70 
        overflow-hidden
        animate-fade-in-up opacity-0 translate-y-8
      " style={{ animationDelay: '0.3s', animationDuration: '0.9s' }}>
        
        {/* Заголовок */}
        <div className="px-10 pt-14 pb-10 text-center">
          <h1 className="
            text-5xl sm:text-6xl font-black 
            bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 
            bg-clip-text text-transparent 
            drop-shadow-lg tracking-tight
          ">
            Wear & Shoot
          </h1>
          <p className="mt-4 text-purple-200/90 text-xl sm:text-2xl font-medium">
            Создай аккаунт и начни творить
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="px-8 sm:px-12 pb-14 space-y-7">
          {['username', 'email', 'password'].map((field) => (
            <div key={field}>
              <label className="block text-base sm:text-lg font-semibold text-purple-200 mb-3 capitalize">
                {field === 'username' ? 'Никнейм' : field === 'email' ? 'Email' : 'Пароль'}
              </label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                className="
                  w-full px-6 py-5 
                  bg-purple-950/70 
                  border-2 border-purple-600/60 
                  rounded-2xl 
                  text-purple-100 
                  placeholder-purple-400/70 
                  focus:border-amber-400 
                  focus:ring-4 focus:ring-amber-400/30 
                  focus:bg-purple-950/90 
                  transition-all duration-300 
                  outline-none 
                  shadow-inner
                "
                placeholder={
                  field === 'username' ? 'cool_guy_228' :
                  field === 'email' ? 'you@example.com' : '••••••••••'
                }
              />
            </div>
          ))}

          {/* Кнопка */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-6 rounded-2xl font-bold text-xl sm:text-2xl tracking-wide
              transition-all duration-400 shadow-xl
              ${loading 
                ? 'bg-amber-600/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 hover:shadow-amber-500/60 hover:-translate-y-1 active:scale-95 text-purple-950'
              }
            `}
          >
            {loading ? 'Создаём...' : 'Зарегистрироваться'}
          </button>

          {/* Сообщение */}
          {status.message && (
            <div className={`mt-6 p-6 rounded-2xl text-center font-medium text-lg border-2 shadow-lg ${
              status.type === 'success'
                ? 'bg-green-900/70 border-green-600 text-green-100'
                : 'bg-red-900/70 border-red-600 text-red-100'
            }`}>
              {status.message}
            </div>
          )}
        </form>

        {/* Футер */}
        <div className="px-10 pb-12 text-center text-purple-300/90 text-lg">
          Уже есть аккаунт?{' '}
          <a href="#" className="text-amber-300 hover:text-amber-200 font-bold transition-colors">
            Войти
          </a>
        </div>
      </div>

      {/* Анимация */}
      <style jsx global>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default App
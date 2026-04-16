// Home.jsx
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-amber-50">
      <div className="text-center px-4">
        <h1 className="text-6xl sm:text-8xl font-black bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-600 bg-clip-text text-transparent drop-shadow-md">
          Wear & Shoot
        </h1>
        
        <p className="mt-6 text-xl sm:text-3xl text-slate-700 font-medium max-w-3xl mx-auto">
          Платформа для создания и продажи уникальных вещей
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/register"
            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-md transition-all hover:scale-105"
          >
            Зарегистрироваться
          </Link>
          
          <Link
            to="/login"
            className="px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xl rounded-2xl shadow-md transition-all hover:scale-105"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  )
}
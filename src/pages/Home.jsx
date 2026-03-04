// src/pages/Home.jsx
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500">
      <div className="text-center px-4">
        <h1 className="text-6xl sm:text-8xl font-black bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 bg-clip-text text-transparent drop-shadow-2xl">
          Wear & Shoot
        </h1>
        
        <p className="mt-6 text-xl sm:text-3xl text-purple-900/90 font-medium max-w-3xl mx-auto">
          Платформа для создания и продажи уникальных вещей
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/register"
            className="px-10 py-5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-xl transition-all hover:scale-105"
          >
            Зарегистрироваться
          </Link>
          
          <Link
            to="/login"
            className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-purple-950 font-bold text-xl rounded-2xl shadow-xl transition-all hover:scale-105"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  )
}
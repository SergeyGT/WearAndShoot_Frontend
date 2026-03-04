// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'           // регистрация
import Login from './Login.jsx'       // логин
import Cloth from './pages/Cloth.jsx' // каталог
import Home from './pages/Home.jsx'   // ← новая главная страница
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/register" element={<App />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/cloth"    element={<Cloth />} />
        <Route path="*"         element={<div className="min-h-screen flex items-center justify-center text-4xl text-red-600">
          404 — Страница не найдена
        </div>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
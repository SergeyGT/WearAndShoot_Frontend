// Home.jsx
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Home.css'

export default function Home() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <div className="home">
      {/* Декоративные элементы */}
      <div className="home__decoration home__decoration--1">👗</div>
      <div className="home__decoration home__decoration--2">👔</div>
      <div className="home__decoration home__decoration--3">👟</div>
      <div className="home__decoration home__decoration--4">🧥</div>
      <div className="home__decoration home__decoration--5">👜</div>
      
      <div className={`home__content ${visible ? 'home__content--visible' : ''}`}>
        {/* Логотип */}
        
        {/* Заголовок */}
        <h1 className="home__title">
          <span className="home__title-gradient">Wear & Shoot</span>
        </h1>
        
        {/* Подзаголовок */}
        <p className="home__subtitle">
          Создавайте стильные образы из вашего гардероба
        </p>
        
        {/* Описание */}
        <div className="home__features">
          <div className="home__feature">
            <span className="home__feature-icon"></span>
            <span className="home__feature-text">Добавляйте вещи</span>
          </div>
          <div className="home__feature">
            <span className="home__feature-icon"></span>
            <span className="home__feature-text">Учитывайте погоду</span>
          </div>
          <div className="home__feature">
            <span className="home__feature-icon"></span>
            <span className="home__feature-text">Подбирайте цвета</span>
          </div>
        </div>

        {/* Кнопки */}
        <div className="home__actions">
          <Link to="/register" className="home__btn home__btn--primary">
            <span></span>
            <span>Зарегистрироваться</span>
          </Link>
          
          <Link to="/login" className="home__btn home__btn--secondary">
            <span></span>
            <span>Войти</span>
          </Link>
        </div>
        
        {/* Нижний текст */}
        <p className="home__footer-text">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="home__link">
            Войдите
          </Link>
        </p>
      </div>
    </div>
  )
}
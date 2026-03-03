import { useState } from 'react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Ошибка регистрации')
      }

      const data = await response.json()
      setMessage(`Успех! Пользователь создан с ID: ${data.id}`)
    } catch (err) {
      setMessage('Ошибка: ' + err.message)
    }
  }

  return (
    <div className="App" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>Регистрация</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя:</label><br/>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Email:</label><br/>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Пароль:</label><br/>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" style={{ marginTop: '20px' }}>
          Зарегистрироваться
        </button>
      </form>

      {message && <p style={{ marginTop: '20px', color: message.includes('Ошибка') ? 'red' : 'green' }}>
        {message}
      </p>}
    </div>
  )
}

export default App
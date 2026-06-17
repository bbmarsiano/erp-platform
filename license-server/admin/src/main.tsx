import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/design-system.css'
import App from './App'
import { PasswordGate } from './components/PasswordGate'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PasswordGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PasswordGate>
  </React.StrictMode>
)


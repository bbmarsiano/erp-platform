import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/design-system.css'
import App from './App'
import { AuthGate } from './components/AuthGate'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthGate>
  </React.StrictMode>
)


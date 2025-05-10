import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  // Create the root element if it doesn't exist (happens in some environments)
  const rootDiv = document.createElement('div')
  rootDiv.id = 'root'
  document.body.appendChild(rootDiv)
  
  console.warn('Root element not found, created a new one. Check your index.html file.')
  
  // Now use the newly created element
  const root = createRoot(rootDiv)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  // Use the existing root element
  const root = createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
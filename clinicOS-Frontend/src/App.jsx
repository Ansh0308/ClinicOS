import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

function App() {
  

  return (
    <BrowserRouter>
      <Navbar/>
      <main>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
      </Routes>
      </main>
      <Footer/>

    </BrowserRouter>
  )
}

export default App

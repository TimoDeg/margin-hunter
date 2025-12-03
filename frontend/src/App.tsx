import './App.css'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/Dashboard'
import { OffersPage } from './pages/Offers'
import { ProductsPage } from './pages/Products'
import { ScraperPage } from './pages/Scraper'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <aside className="App-sidebar">
          <div className="App-logo">Margin Hunter</div>
          <nav className="App-nav">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/offers">Offers</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/scraper">Scraper</NavLink>
          </nav>
        </aside>
        <header className="App-header">
          <div className="App-title">Margin Hunter – Arbitrage Dashboard</div>
        </header>
        <main className="App-main">
          <div className="Page">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/scraper" element={<ScraperPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App

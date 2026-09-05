import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import VerificationPage from './pages/VerificationPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import DashboardPage from './pages/DashboardPage'
import AdminProductPage from './pages/AdminProductPage'
import ProductDetailPage from './pages/ProductDetailPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerificationPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/admin/products" element={<AdminProductPage />} />
      </Routes>
    </Router>
  )
}

export default App

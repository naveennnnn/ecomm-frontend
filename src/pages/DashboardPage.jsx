import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, getCurrentUser } from '../firebase/authService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const categories = ['All', 'Earrings', 'Bangles', 'Necklaces', 'Rings', 'Bracelets', 'Pendants', 'Anklets']

function DashboardPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verify the session on load (silently refreshes an expired access token).
    // If there is no valid session, send the user back to login.
    getCurrentUser().then((user) => {
      if (!user) {
        navigate('/', { replace: true })
        return
      }
      if (user.role === 'ADMIN') setIsAdmin(true)
    })
  }, [navigate])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let url = `${BACKEND_URL}/api/products`
      if (selectedCategory !== 'All') {
        url = `${BACKEND_URL}/api/products/category/${selectedCategory}`
      }
      const response = await fetch(url, { credentials: 'include' })
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchProducts()
      return
    }
    setLoading(true)
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/products/search?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100)
  }

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      {/* Header */}
      <header className="bg-white text-gray-800 sticky top-0 z-50 shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <h1 className="text-xl font-bold whitespace-nowrap tracking-wide">
              <span className="text-amber-500">OM</span>{' '}
              <span className="text-gray-700">Jewelleries</span>
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jewellery, collections and more..."
                  className="w-full px-4 py-2 rounded-l-md text-gray-800 bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-400 text-white font-medium rounded-r-md hover:bg-amber-500 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/products')}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors whitespace-nowrap"
                >
                  + Add Product
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar */}
      <nav className="bg-white text-gray-600 shadow-sm border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-11 overflow-x-auto text-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap hover:text-amber-500 transition-colors ${
                  selectedCategory === cat
                    ? 'text-amber-600 font-semibold border-b-2 border-amber-400'
                    : 'text-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer group overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-square p-4 flex items-center justify-center bg-amber-50/50 overflow-hidden">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/200'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-3 space-y-1">
                  <p className="text-xs text-amber-500 uppercase tracking-wide">{product.brand}</p>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded font-medium">
                      {product.rating.toFixed(1)} ★
                    </span>
                    <span className="text-xs text-gray-400">
                      ({product.reviewCount})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-amber-600 font-medium">
                          {getDiscount(product.originalPrice, product.price)}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage

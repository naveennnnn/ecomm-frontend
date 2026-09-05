import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, getCurrentUser } from '../firebase/authService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const categories = ['All', 'Earrings', 'Bangles', 'Necklaces', 'Rings', 'Bracelets', 'Pendants', 'Anklets']

function DashboardPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [slide, setSlide] = useState(0)

  // Show the full product grid only when the user is browsing a specific
  // category (not "All") or has performed a search. Otherwise show the
  // "latest uploads" carousel on the home view.
  const isBrowsing = selectedCategory !== 'All' || activeSearch !== ''

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

  // Load the latest 10 products once for the home carousel.
  useEffect(() => {
    const loadLatest = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/products/latest`, {
          credentials: 'include',
        })
        const data = await response.json()
        setLatest(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch latest products:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLatest()
  }, [])

  // Fetch the grid products only when browsing a category.
  useEffect(() => {
    if (selectedCategory === 'All') return
    const fetchByCategory = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/products/category/${selectedCategory}`,
          { credentials: 'include' }
        )
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchByCategory()
  }, [selectedCategory])

  // Keep the slide index in range if the latest list changes.
  useEffect(() => {
    setSlide(0)
  }, [latest.length])

  // Auto-advance the carousel while on the home view.
  useEffect(() => {
    if (isBrowsing || latest.length <= 1) return
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % latest.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [isBrowsing, latest.length])

  const nextSlide = () => setSlide((prev) => (prev + 1) % latest.length)
  const prevSlide = () => setSlide((prev) => (prev - 1 + latest.length) % latest.length)

  // Touch/swipe support for the carousel.
  const [touchStartX, setTouchStartX] = useState(null)
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const delta = e.changedTouches[0].clientX - touchStartX
    if (delta > 50) prevSlide()
    else if (delta < -50) nextSlide()
    setTouchStartX(null)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      // Empty search returns to the home carousel view.
      setActiveSearch('')
      setSelectedCategory('All')
      return
    }
    setActiveSearch(query)
    setLoading(true)
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/products/search?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (cat) => {
    setActiveSearch('')
    setSearchQuery('')
    setSelectedCategory(cat)
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
                onClick={() => handleCategorySelect(cat)}
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
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        ) : isBrowsing ? (
          /* Full product grid — shown only when searching or browsing a category */
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {activeSearch ? `Results for "${activeSearch}"` : selectedCategory}
            </h2>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    getDiscount={getDiscount}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        ) : latest.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products yet</p>
          </div>
        ) : (
          /* Home view — auto-playing carousel of the latest 10 uploads */
          <section>
            <h2 className="text-center text-2xl font-semibold text-gray-700 tracking-wide mb-1">
              New Arrivals
            </h2>
            <p className="text-center text-sm text-gray-400 mb-6">
              Our latest handpicked pieces
            </p>

            <div className="relative max-w-4xl mx-auto">
              {/* Track */}
              <div
                className="overflow-hidden rounded-2xl border border-amber-100 shadow-sm bg-white"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${slide * 100}%)` }}
                >
                  {latest.map((product) => (
                    <div
                      key={product.id}
                      className="w-full flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="aspect-[16/9] flex items-center justify-center bg-amber-50/50 p-6">
                        <img
                          src={product.imageUrl || 'https://via.placeholder.com/400'}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="p-4 text-center border-t border-amber-100">
                        <p className="text-xs text-amber-500 uppercase tracking-wide">
                          {product.brand}
                        </p>
                        <h3 className="text-base font-medium text-gray-800">{product.name}</h3>
                        <p className="text-lg font-bold text-gray-800 mt-1">
                          ₹{product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrows */}
              <button
                onClick={prevSlide}
                aria-label="Previous"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-amber-200 text-amber-600 shadow hover:bg-amber-100 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-amber-200 text-amber-600 shadow hover:bg-amber-100 transition-colors"
              >
                ›
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {latest.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === slide ? 'w-6 bg-amber-400' : 'w-2 bg-amber-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function ProductCard({ product, getDiscount, onClick }) {
  return (
    <div
      onClick={onClick}
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
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded font-medium">
            {product.rating.toFixed(1)} ★
          </span>
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
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
  )
}

export default DashboardPage

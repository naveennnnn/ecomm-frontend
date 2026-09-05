import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../firebase/authService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const categories = ['Earrings', 'Bangles', 'Necklaces', 'Rings', 'Bracelets', 'Pendants', 'Anklets']

function AdminProductPage() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Earrings',
    brand: '',
    stock: '',
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const user = await getCurrentUser()
    if (!user) {
      navigate('/')
      return
    }
    if (user.role !== 'ADMIN') {
      setIsAdmin(false)
      setAuthChecked(true)
      return
    }
    setIsAdmin(true)
    setAuthChecked(true)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setImages(files)
      setImagePreviews(files.map((file) => URL.createObjectURL(file)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!images.length) {
      setError('Please select at least one product image')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      formData.append('originalPrice', form.originalPrice)
      formData.append('category', form.category)
      formData.append('brand', form.brand)
      formData.append('stock', form.stock)
      images.forEach((file) => formData.append('images', file))

      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // don't set Content-Type — browser sets multipart boundary
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to add product' }))
        throw new Error(err.message || 'Failed to add product')
      }

      setSuccess('Product added successfully!')
      setForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'Earrings',
        brand: '',
        stock: '',
      })
      setImages([])
      setImagePreviews([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
          <p className="mt-2 text-gray-500">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      {/* Header */}
      <header className="bg-white text-gray-800 shadow-sm border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold tracking-wide">
              <span className="text-amber-500">OM</span>{' '}
              <span className="text-gray-700">Jewelleries</span>
              <span className="ml-2 text-sm font-normal text-gray-400">Admin</span>
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-amber-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Add New Product</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Gold Jhumka Earrings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                placeholder="22K gold-plated jhumka earrings with pearl drops"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="2999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                <input
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  required
                  value={form.originalPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="4999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  name="brand"
                  type="text"
                  value={form.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Tanishq"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  name="stock"
                  type="number"
                  required
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images <span className="text-gray-400 font-normal">(select one or more)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
              />
              {imagePreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="h-24 w-24 object-contain border border-amber-200 rounded-lg bg-amber-50/50"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                The first image is used as the thumbnail.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 text-white font-medium rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default AdminProductPage

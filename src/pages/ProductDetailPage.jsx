import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          setNotFound(true)
          return
        }
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // Prefer the gallery; fall back to the single primary image.
  const gallery =
    product && Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : product && product.imageUrl
        ? [product.imageUrl]
        : []

  const getDiscount = (original, current) =>
    Math.round(((original - current) / original) * 100)

  const nextImage = () =>
    setActiveImage((prev) => (gallery.length ? (prev + 1) % gallery.length : 0))
  const prevImage = () =>
    setActiveImage((prev) =>
      gallery.length ? (prev - 1 + gallery.length) % gallery.length : 0
    )

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const delta = e.changedTouches[0].clientX - touchStartX
    if (delta > 50) prevImage()
    else if (delta < -50) nextImage()
    setTouchStartX(null)
  }

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxOpen])

  // Keyboard navigation for the lightbox (arrows + Esc).
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, gallery.length])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Product not found</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      {/* Header */}
      <header className="bg-white text-gray-800 sticky top-0 z-50 shadow-sm border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold tracking-wide">
              <span className="text-amber-500">OM</span>{' '}
              <span className="text-gray-700">Jewelleries</span>
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors"
            >
              ‹ Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            {/* Enlarged main image */}
            <div
              className="relative bg-white rounded-2xl border border-amber-100 shadow-sm aspect-square flex items-center justify-center p-6 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={gallery[activeImage] || 'https://via.placeholder.com/500'}
                alt={product.name}
                onClick={() => setLightboxOpen(true)}
                className="max-h-full max-w-full object-contain cursor-zoom-in"
              />

              {gallery.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-amber-200 text-amber-600 shadow hover:bg-amber-100 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-amber-200 text-amber-600 shadow hover:bg-amber-100 transition-colors"
                  >
                    ›
                  </button>
                  <span className="absolute bottom-3 right-3 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full">
                    {activeImage + 1} / {gallery.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 rounded-lg border overflow-hidden bg-amber-50/50 flex items-center justify-center transition-all ${
                      i === activeImage
                        ? 'border-amber-400 ring-2 ring-amber-300'
                        : 'border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm text-amber-500 uppercase tracking-wide">{product.brand}</p>
            )}
            <h2 className="text-2xl font-semibold text-gray-800">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded font-medium">
                {product.rating.toFixed(1)} ★
              </span>
              <span className="text-sm text-gray-400">
                {product.reviewCount} reviews
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-800">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-base text-amber-600 font-medium">
                    {getDiscount(product.originalPrice, product.price)}% off
                  </span>
                </>
              )}
            </div>

            {/* Category & stock */}
            <div className="flex items-center gap-3 text-sm">
              {product.category && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {product.category}
                </span>
              )}
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
              </span>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxOpen && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl hover:bg-white/20 transition-colors"
          >
            ✕
          </button>

          {/* Image (stop propagation so clicking the image doesn't close) */}
          <img
            src={gallery[activeImage]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="max-h-[90vh] max-w-[92vw] object-contain select-none"
          />

          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 transition-colors"
              >
                ›
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full">
                {activeImage + 1} / {gallery.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage

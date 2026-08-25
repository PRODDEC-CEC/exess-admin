import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, LayoutGrid, Aperture } from 'lucide-react'
import { useFirebaseData } from '../hooks/useFirebase'

/**
 * Gallery — Dual Mode (Bento Grid & Cinematic 3D Rotating Wheel)
 * Allows the user to toggle between:
 *   1. Bento Grid: Apple-style custom grid spans.
 *   2. 3D Wheel: 3D rotating cylinder of images with drag controls.
 */
const Gallery = () => {
  const { gallery } = useFirebaseData()
  const galleryItems = gallery && gallery.length > 0 ? gallery : [];

  const [viewMode, setViewMode] = useState('bento') // 'bento' or '3d'
  const [selectedIdx, setSelectedIdx] = useState(null)
  
  // 3D Wheel States
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, rotation: 0 })
  const imageCount = galleryItems.length
  const angleStep = imageCount > 0 ? (360 / imageCount) : 0

  // Responsive 3D ring radius (mobile: 300px, tablet: 420px, desktop: 500px)
  const [radius, setRadius] = useState(500)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setRadius(mobile ? 300 : window.innerWidth < 1024 ? 420 : 500)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 3D Auto-rotation Loop
  useEffect(() => {
    if (viewMode !== '3d' || isDragging || selectedIdx !== null || imageCount === 0) return
    const interval = setInterval(() => {
      setRotation((prev) => (prev - 0.25) % 360)
    }, 16) // ~60fps smooth loop
    return () => clearInterval(interval)
  }, [viewMode, isDragging, selectedIdx, imageCount])

  const handlePrev = (e) => {
    e.stopPropagation()
    if (imageCount === 0) return
    setSelectedIdx((prev) => (prev === 0 ? imageCount - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    if (imageCount === 0) return
    setSelectedIdx((prev) => (prev === imageCount - 1 ? 0 : prev + 1))
  }

  // Custom Mouse/Touch drag controls for 3D wheel
  const handleDragStart = (clientX) => {
    setIsDragging(true)
    dragStartRef.current = { x: clientX, rotation: rotation }
  }

  const handleDragMove = (clientX) => {
    if (!isDragging) return
    const deltaX = clientX - dragStartRef.current.x
    setRotation((dragStartRef.current.rotation + deltaX * 0.45) % 360)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }


  // Predefined Bento layout configs
  const getBentoSpans = (index) => {
    const configs = [
      { span: 'col-span-2 row-span-2 h-[260px] sm:h-[340px] md:col-span-2 md:row-span-2 md:h-[420px]' }, // Card 0: Big Featured
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-1 md:row-span-1 md:h-[200px]' },  // Card 1: Small square
      { span: 'col-span-1 row-span-2 h-[260px] sm:h-[340px] md:col-span-1 md:row-span-2 md:h-[420px]' },   // Card 2: Tall vertical
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-1 md:row-span-1 md:h-[200px]' },   // Card 3: Small landscape
      { span: 'col-span-2 row-span-1 h-[120px] sm:h-[160px] md:col-span-2 md:row-span-1 md:h-[200px]' },  // Card 4: Wide banner
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-1 md:row-span-1 md:h-[200px]' },  // Card 5: Small square
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-1 md:row-span-1 md:h-[200px]' },   // Card 6: Small landscape
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-1 md:row-span-1 md:h-[200px]' },   // Card 7: Small square
      { span: 'col-span-1 row-span-1 h-[120px] sm:h-[160px] md:col-span-2 md:row-span-1 md:h-[200px]' },   // Card 8: Wide landscape / banner
    ]
    return configs[index % configs.length]
  }

  if (imageCount === 0) {
    return null; // Don't render Gallery section if database is empty and fallback is missing
  }

  return (
    <section
      id="gallery"
      className="relative w-full min-h-screen bg-white overflow-hidden px-8 sm:px-16 lg:px-24 py-16 sm:py-24"
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col justify-between gap-12 relative z-10">
        
        {/* Top: Centered Title Block with Electric Glow Sweep */}
        <div className="w-full relative flex flex-col items-center select-none py-2 pb-6 border-b border-slate-100/60 gap-4">
          <h2 className="font-grotesk font-black text-5xl sm:text-6xl lg:text-7xl leading-none uppercase relative">
            {/* Ambient radial glow matching Hero's glaze-glow */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 rounded-full bg-[radial-gradient(circle,rgba(94,216,242,0.22)_0%,rgba(30,107,147,0.06)_50%,transparent_70%)] blur-2xl pointer-events-none z-0 animate-pulse" />
            
            <span className="flex relative z-10 text-light-sweep-dark filter drop-shadow-[0_0_15px_rgba(94,216,242,0.8)]">
              {['G', 'A', 'L', 'L', 'E', 'R', 'Y'].map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </h2>

          {/* View Mode Toggle Switch (Frameless Sliding Underline) */}
          <div className="flex gap-6 items-center z-20 sm:absolute sm:right-0 sm:bottom-2">
            <button
              onClick={() => setViewMode('bento')}
              className="relative py-1.5 focus:outline-none cursor-pointer group"
              title="Bento Grid"
            >
              <LayoutGrid 
                className={`w-5 h-5 transition-colors duration-300 ${
                  viewMode === 'bento' ? 'text-[#1E6B93]' : 'text-slate-400 group-hover:text-slate-600'
                }`} 
              />
              {viewMode === 'bento' && (
                <motion.div
                  layoutId="activeGalleryModeLine"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1E6B93] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className="relative py-1.5 focus:outline-none cursor-pointer group"
              title="3D Wheel"
            >
              <Aperture 
                className={`w-5 h-5 transition-colors duration-300 ${
                  viewMode === '3d' ? 'text-[#1E6B93]' : 'text-slate-400 group-hover:text-slate-600'
                }`} 
              />
              {viewMode === '3d' && (
                <motion.div
                  layoutId="activeGalleryModeLine"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1E6B93] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* ── VIEW MODE 1: APPLE-STYLE BENTO GRID LAYOUT ── */}
        {viewMode === 'bento' && (
          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {galleryItems.map((item, idx) => {
              const { span } = getBentoSpans(idx)
              return (
                <motion.div
                  key={item.id}
                  layoutId={`gal-card-${item.id}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative group overflow-hidden border border-slate-100/60 shadow-sm cursor-pointer ${span}`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Subtle dark overlay details on hover */}
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/40 transition-colors duration-300 flex flex-col justify-end p-4 sm:p-6 opacity-0 group-hover:opacity-100">
                    <span className="font-mono text-[9px] text-[#5EF2F8] tracking-widest font-bold uppercase">{item.category}</span>
                    <h4 className="font-grotesk text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight mt-1">{item.title}</h4>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── VIEW MODE 2: CINEMATIC 3D ROTATING CYLINDER WHEEL ── */}
        {viewMode === '3d' && (
          <div className="w-full h-[360px] sm:h-[480px] md:h-[580px] flex items-center justify-center relative select-none">
            {/* Visual drag hints */}
            <div className="absolute top-2 text-[10px] font-mono text-slate-400 tracking-widest uppercase">
              DRAG RADIUS WHEEL TO ROTATE
            </div>

            <div
              className="relative w-48 sm:w-56 lg:w-64 h-64 sm:h-72 lg:h-80"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d',
              }}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
              onTouchEnd={handleDragEnd}
            >
              <motion.div
                className="w-full h-full relative"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                animate={{ rotateY: rotation }}
                transition={{ type: 'tween', ease: 'linear', duration: 0 }}
              >
                {galleryItems.map((item, idx) => {
                  const itemAngle = idx * angleStep
                  return (
                    <div
                      key={`wheel-${item.id}`}
                      onClick={() => !isDragging && setSelectedIdx(idx)}
                      className="absolute inset-0 cursor-pointer border border-slate-200/50 shadow-lg overflow-hidden bg-slate-50 transition-shadow duration-300 hover:shadow-2xl"
                      style={{
                        transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                        backfaceVisibility: 'hidden',
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  )
                })}
              </motion.div>
            </div>
          </div>
        )}

      </div>

      {/* ── CINEMATIC FULLSCREEN DETAILED MEDIA MODAL ── */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIdx(null)}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 sm:p-12"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center w-full z-10">
              <span className="font-mono text-xs sm:text-sm text-slate-500 tracking-widest">
                {selectedIdx + 1} / {imageCount} // {galleryItems[selectedIdx].category}
              </span>
              <button
                onClick={() => setSelectedIdx(null)}
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Interactive Carousel Viewport */}
            <div className="flex-grow flex items-center justify-between gap-6 max-h-[70vh]">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full border border-slate-800 hidden sm:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                className="flex-grow flex justify-center items-center h-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.img
                  key={galleryItems[selectedIdx].id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  src={galleryItems[selectedIdx].image}
                  alt={galleryItems[selectedIdx].title}
                  className="max-w-full max-h-full object-contain shadow-2xl border border-slate-900"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full border border-slate-800 hidden sm:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Footer Description */}
            <div className="w-full text-center max-w-2xl mx-auto space-y-2 z-10" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-grotesk text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {galleryItems[selectedIdx].title}
              </h3>
              <p className="font-inter text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                {galleryItems[selectedIdx].caption}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Gallery

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Send, CheckCircle, MapPin } from 'lucide-react'
import { FaInstagram, FaLinkedinIn, FaGithub, FaEnvelope } from 'react-icons/fa6'
import Logo from './Logo'
import { db } from '../lib/firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'

const essentialNavLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Events', href: '#events' },
  { name: 'Projects', href: '#projects' },
  { name: 'Gallery', href: '#gallery' },
]

/**
 * Footer — Minimalist Inline Row-Form Design (with Colored Social Icons)
 * 1. Bold header: "TRANSMIT INPUT" with inline email link.
 * 2. Ultra-minimal inline contact form (single row fields backed by bottom underlines, no cards).
 * 3. Segmented clean directory sitemaps + address details.
 * 4. Faded operational status logs + colored social buttons at the bottom.
 */
const Footer = () => {
  const [formData, setFormData] = useState({ email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Dynamic Contact details state
  const [contactInfo, setContactInfo] = useState({
    email: 'exess@ceconline.edu',
    address: 'Dept. of ECE, College of Engineering Chengannur, Kerala - 689121',
    instagram: 'https://instagram.com/exess.cec',
    linkedin: 'https://linkedin.com/company/exess-cec',
    github: '#'
  })

  // Load Contact config from database
  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'contact_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo({
            email: data.email || 'exess@ceconline.edu',
            address: data.address || 'Dept. of ECE, College of Engineering Chengannur, Kerala - 689121',
            instagram: data.instagram || 'https://instagram.com/exess.cec',
            linkedin: data.linkedin || 'https://linkedin.com/company/exess-cec',
            github: data.github || '#'
          });
        }
      } catch (err) {
        console.warn("Failed to load footer settings, using default text values.");
      }
    };
    fetchContactConfig();
  }, []);

  // Submit contact message directly to Firestore messages collection
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'messages'), {
        email: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString(),
        read: false
      });
      setIsSuccess(true)
      setFormData({ email: '', message: '' })
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (err) {
      console.error("Message send failure:", err);
      alert("Failed to submit message: " + err.message);
    } finally {
      setIsSubmitting(false)
    }
  }

  const SOCIAL_LINKS = [
    { icon: <FaInstagram className="w-4 h-4 text-[#E4405F]" />, hoverBg: 'hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30', href: contactInfo.instagram, label: 'Instagram' },
    { icon: <FaLinkedinIn className="w-4 h-4 text-[#0A66C2]" />, hoverBg: 'hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30', href: contactInfo.linkedin, label: 'LinkedIn' },
    { icon: <FaGithub className="w-4 h-4 text-[#181717]" />, hoverBg: 'hover:bg-[#181717]/10 hover:border-[#181717]/30', href: contactInfo.github, label: 'GitHub' },
    { icon: <FaEnvelope className="w-4 h-4 text-[#EA4335]" />, hoverBg: 'hover:bg-[#EA4335]/10 hover:border-[#EA4335]/30', href: `mailto:${contactInfo.email}`, label: 'Email' },
  ]

  return (
    <footer id="contact" className="relative bg-white text-slate-800 overflow-hidden z-10 border-t border-slate-100 px-8 sm:px-16 lg:px-24 py-16">
      <div className="max-w-7xl mx-auto relative z-20 space-y-16">
        
        {/* ── TOP SECTION: EDITORIAL HEADER & INLINE ROW FORM ── */}
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <h2 className="font-grotesk font-black text-3xl sm:text-4xl uppercase tracking-tight text-slate-850">
                GET IN TOUCH
              </h2>
            </div>
            <a 
              href={`mailto:${contactInfo.email}`} 
              className="group flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
            >
              {contactInfo.email} <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {/* Ultra-Minimal Horizontal Form */}
          <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-4 relative">
              <input
                type="email"
                required
                placeholder="YOUR EMAIL ADDRESS"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-b border-slate-200 focus:border-[#1E6B93] rounded-none py-3 text-xs sm:text-sm text-slate-800 font-inter focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
              />
            </div>
            <div className="md:col-span-6 relative">
              <input
                type="text"
                required
                placeholder="YOUR MESSAGE OR SIGNAL PACKET..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-transparent border-b border-slate-200 focus:border-[#1E6B93] rounded-none py-3 text-xs sm:text-sm text-slate-800 font-inter focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 border-b-2 border-slate-800 text-slate-800 hover:text-primary hover:border-primary transition-colors duration-300 font-mono text-xs tracking-widest font-black uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'SENDING...' : 'SEND SIGNAL'} <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 text-emerald-600 font-inter text-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold">Packet transmitted successfully. Executive board notified.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── MIDDLE SECTION: SITEMAP & ADDRESS DETAILS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="space-y-4">
            <a href="#home" className="flex items-center gap-2 group w-max">
              <Logo size={28} color="#1E6B93" />
              <span className="font-brand text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                Ex<span className="text-primary">ESS</span>
              </span>
            </a>
            <p className="font-inter text-xs text-slate-400 font-light leading-relaxed max-w-xs">
              Electronics Forum of College of Engineering Chengannur. Fostering hardware technology and embedded design.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-grotesk text-[10px] sm:text-xs font-black tracking-wider text-slate-800 uppercase">DIRECTORY</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-inter text-xs text-slate-500 font-medium">
              {essentialNavLinks.map((link) => (
                <a key={link.name} href={link.href} className="hover:text-primary transition-colors">{link.name}</a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-grotesk text-[10px] sm:text-xs font-black tracking-wider text-slate-800 uppercase">WORKSPACE</h4>
            <div className="font-inter text-xs text-slate-500 leading-relaxed font-light flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{contactInfo.address}</span>
            </div>
            
            {/* Embedded Google Map */}
            <div className="w-full h-32 rounded-2xl overflow-hidden mt-3 border border-slate-100 shadow-sm relative z-20">
              <iframe
                src="https://maps.google.com/maps?q=9.317325,76.617486&z=15&output=embed"
                className="w-full h-full border-none transition-all duration-300"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: COPYRIGHT & COLORED SOCIALS ── */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>&copy; {new Date().getFullYear()} EXESS CEC</span>
            <span className="hidden sm:inline text-slate-200">//</span>
            <div className="flex items-center gap-1.5 normal-case sm:uppercase">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                MADE WITH <span className="text-amber-500 animate-pulse">⚡</span> BY
              </span>
              <a 
                href="https://proddec.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#1E6B93] font-bold relative group py-0.5"
              >
                PRODDEC
                <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#1E6B93] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </a>
            </div>
          </div>

          {/* Colored Social Media Buttons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={`w-8 h-8 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow hover:-translate-y-0.5 hover:scale-105 cursor-pointer ${link.hoverBg}`}
                title={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer

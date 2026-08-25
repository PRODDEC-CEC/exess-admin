import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaLinkedin } from 'react-icons/fa6'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ImagePlaceholder from './ImagePlaceholder'
import { useFirebaseData } from '../hooks/useFirebase'

/**
 * Timeline Stagger Animation Component
 * Animates elements sequentially as they enter the viewport
 */
const TimelineAnimation = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 25, filter: 'blur(4px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: false, margin: '-10%' }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

/**
 * Vertical PCB Team Card — Executive Team & Committee Members
 * Dark PCB avatar box, initials, badge, name, role & LinkedIn
 */
const TeamMemberCard = ({ person, badge = null }) => {
  const linkedinUrl = person.socials?.linkedin || 'https://linkedin.com/company/exess-cec'

  return (
    <div className="relative group bg-white border border-border/80 border-t-2 border-t-primary rounded-none p-5 shadow-soft hover:shadow-soft-lg hover:border-primary/40 transition-all duration-300 flex flex-col h-full select-none">
      {/* Dark PCB Image / Avatar Area */}
      <div className="relative mb-5 rounded-none overflow-hidden border border-border/60">
        <ImagePlaceholder
          src={person.image}
          alt={person.name}
          type="avatar"
          aspectRatio="aspect-[4/5]"
          initials={person.initials || person.name?.split(' ').map(n=>n[0]).join('') || 'EX'}
          className="group-hover:scale-105 transition-transform duration-500 rounded-none"
        />
      </div>

      {/* Name, Role & LinkedIn Connect Link */}
      <div className="flex items-end justify-between gap-3 pt-2 mt-auto">
        <div className="overflow-hidden">
          <h4 className="font-brand font-bold text-heading text-base sm:text-lg group-hover:text-primary transition-colors leading-snug truncate">
            {person.name}
          </h4>
          <p className="font-inter text-[11px] sm:text-xs font-semibold text-primary/90 uppercase tracking-wide mt-0.5 truncate">
            {person.role}
          </p>
        </div>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-[#0A66C2] transition-colors p-1 flex-shrink-0"
          aria-label={`Connect with ${person.name} on LinkedIn`}
        >
          <FaLinkedin className="w-6 h-6 sm:w-7 sm:h-7 hover:scale-110 transition-transform text-[#0A66C2]" />
        </a>
      </div>
    </div>
  )
}


const Team = () => {
  const { team, loading } = useFirebaseData()
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    if (team.currentYear) {
      setSelectedYear(team.currentYear)
    } else if (team.allYears && team.allYears.length > 0) {
      setSelectedYear(team.allYears[0])
    }
  }, [team.currentYear, team.allYears])

  // Faculty Coordinator has 'faculty' in their role (e.g. Faculty Coordinator)
  const facultyCoordinator = team.rawMembers
    ? (team.rawMembers.find(m => m.committeeYear === selectedYear && m.role?.toLowerCase().includes('faculty')) || team.facultyCoordinator)
    : team.facultyCoordinator;

  // The committee list contains everyone else except the Faculty Coordinator
  const committeeList = team.rawMembers
    ? team.rawMembers.filter(m => m.committeeYear === selectedYear && !m.role?.toLowerCase().includes('faculty'))
    : [...team.executiveCommittee, ...team.officeBearers, ...team.committeeMembers];

  const totalCount = committeeList.length || 1
  const displayItems = [...committeeList, ...committeeList, ...committeeList]

  const [currentIndex, setCurrentIndex] = useState(totalCount)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  // Card Width + Gap: 260px + 24px gap = 284px
  const [cardWidth, setCardWidth] = useState(284)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640
      setCardWidth(isMobile ? 244 : 284)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      handleNext()
    }, 3800)
    return () => clearInterval(timer)
  }, [currentIndex, isPaused])

  const handleNext = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }

  const handlePrev = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }

  // Seamless invisible reset when reaching boundary sets
  const handleTransitionEnd = () => {
    if (currentIndex >= totalCount * 2) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex - totalCount)
    } else if (currentIndex < totalCount) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex + totalCount)
    }
  }

  // Reset carousel index when switching years
  useEffect(() => {
    setCurrentIndex(totalCount)
    setIsTransitioning(false)
  }, [selectedYear, totalCount])

  return (
    <section id="team" className="relative section-gap overflow-hidden bg-slate-50/50">
      <div className="section-padding max-w-7xl mx-auto relative z-10">

        {/* ── 1. TIMELINE ANIMATION — SECTION HEADING ─────────────────────── */}
        <div className="mb-14 border-b border-border/60 pb-10 text-center">
          <TimelineAnimation delay={0.1}>
            <span className="text-[10px] font-brand uppercase tracking-[0.24em] text-primary font-bold block mb-2">
              CORE SYSTEM ARCHITECTS
            </span>
          </TimelineAnimation>

          <TimelineAnimation delay={0.2}>
            <h2 className="font-brand text-heading text-4xl sm:text-6xl font-bold tracking-tight leading-[1.0] text-light-sweep-dark">
              EXECUTIVE <span className="text-primary">TEAM</span>
            </h2>
          </TimelineAnimation>

          <TimelineAnimation delay={0.3}>
            <p className="font-inter text-body text-sm sm:text-base text-gray-600 mt-4 max-w-2xl mx-auto">
              The driving force behind ExESS. Our leadership structure facilitates technical events, hardware mentorship, and organisational growth.
            </p>
          </TimelineAnimation>

          {team.allYears && team.allYears.length > 1 && (
            <TimelineAnimation delay={0.35} className="mt-6 flex justify-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-700 focus:outline-none focus:border-primary rounded-none shadow-sm cursor-pointer"
              >
                {team.allYears.map(yr => (
                  <option key={yr} value={yr}>YEAR: {yr}</option>
                ))}
              </select>
            </TimelineAnimation>
          )}
        </div>

        {/* ── 2. FACULTY COORDINATOR (CENTERED TOP) ─────────────────────────── */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <div className="flex justify-center">
            <TimelineAnimation delay={0.4} className="w-full max-w-xs">
              <TeamMemberCard person={facultyCoordinator} badge="FACULTY" />
            </TimelineAnimation>
          </div>
        </div>

        {/* ── 3. COMMITTEE & OFFICE BEARERS — INFINITE CIRCULAR STEP CAROUSEL (NEVER BLANKS) ── */}
        <div className="relative pt-12 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <TimelineAnimation delay={0.2}>
              <h3 className="font-brand text-2xl sm:text-3xl font-bold text-heading uppercase tracking-tight">
                COMMITTEE &amp; OFFICE BEARERS
              </h3>
              <p className="text-xs font-inter text-gray-500 mt-1">
                The operational nodes maintaining ExESS systems across all domains
              </p>
            </TimelineAnimation>

            {/* Top Right Scroll Navigation Arrows */}
            <div className="flex items-center gap-2 self-end">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-none bg-white border border-border/80 flex items-center justify-center text-slate-700 hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer"
                aria-label="Previous Committee Member"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-none bg-white border border-border/80 flex items-center justify-center text-slate-700 hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer"
                aria-label="Next Committee Member"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Continuous Circular Carousel Viewport */}
          <div
            className="relative overflow-hidden w-full py-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`flex gap-6 ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
              style={{
                transform: `translateX(-${currentIndex * cardWidth}px)`
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {displayItems.map((person, idx) => (
                <div
                  key={`ext-${person.id}-${idx}`}
                  className="w-56 sm:w-64 lg:w-72 flex-shrink-0"
                >
                  <TeamMemberCard person={person} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Team

'use client';

import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const youtubeEmbedUrl = (source: string) => {
  try {
    const url = new URL(source);
    const id =
      url.searchParams.get('v') ||
      url.pathname.split('/').filter(Boolean).at(-1) ||
      '';

    if (!id) return source;

    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&controls=0&rel=0&modestbranding=1&playlist=${id}`;
  } catch {
    return source;
  }
};

/**
 * A full-screen media hero that grows with the visitor's scroll input.  It
 * intentionally owns scrolling until the media has expanded, then reveals its
 * children as the rest of the landing page.
 */
export default function ScrollExpandMedia({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title = '',
  date,
  scrollToExpand = 'Scroll to explore',
  textBlend = false,
  children,
}: ScrollExpandMediaProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const progressRef = useRef(0);
  const expandedRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const setExpansion = useCallback((value: number) => {
    const nextProgress = clamp(value, 0, 1);
    const isExpanded = nextProgress >= 0.995;

    progressRef.current = nextProgress;
    expandedRef.current = isExpanded;
    setScrollProgress(nextProgress);
    setMediaFullyExpanded(isExpanded);
  }, []);

  useEffect(() => {
    const setViewportMode = () => setIsMobile(window.innerWidth < 768);
    setViewportMode();
    window.addEventListener('resize', setViewportMode);
    return () => window.removeEventListener('resize', setViewportMode);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setExpansion(1);
    }
  }, [prefersReducedMotion, setExpansion]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const atTop = window.scrollY <= 4;

      if (expandedRef.current && event.deltaY < 0 && atTop) {
        event.preventDefault();
        setExpansion(0.94);
        return;
      }

      if (!expandedRef.current) {
        event.preventDefault();
        setExpansion(progressRef.current + event.deltaY * 0.00115);
      }
    };

    const handleScroll = () => {
      if (!expandedRef.current && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartY.current === null) return;

      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined) return;

      const deltaY = touchStartY.current - currentY;
      const atTop = window.scrollY <= 4;

      if (expandedRef.current && deltaY < -16 && atTop) {
        event.preventDefault();
        setExpansion(0.94);
      } else if (!expandedRef.current) {
        event.preventDefault();
        const sensitivity = deltaY < 0 ? 0.0075 : 0.0055;
        setExpansion(progressRef.current + deltaY * sensitivity);
      }

      touchStartY.current = currentY;
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setExpansion]);

  const words = title.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0] ?? '';
  const remainingWords = words.slice(1).join(' ');
  const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobile ? 200 : 400);
  const titleShift = scrollProgress * (isMobile ? 34 : 18);
  const showContent = mediaFullyExpanded;

  return (
    <div className="relative overflow-x-hidden">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-0 h-[100dvh]"
          initial={false}
          animate={{ opacity: 1 - scrollProgress }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
        >
          <Image
            src={bgImageSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#050807]/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.15)_35%,rgba(0,0,0,0.72)_100%)]" />
        </motion.div>

        <div className="relative z-10 flex min-h-[100dvh] w-full max-w-[1800px] flex-col items-center justify-center px-4 sm:px-8">
          <div
            className="absolute left-1/2 top-1/2 overflow-hidden rounded-[1.65rem] border border-white/20 bg-black shadow-canopy"
            style={{
              width: `min(${mediaWidth}px, 95vw)`,
              height: `min(${mediaHeight}px, 84dvh)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {mediaType === 'video' ? (
              mediaSrc.includes('youtube.com') || mediaSrc.includes('youtu.be') ? (
                <iframe
                  className="h-full w-full"
                  src={youtubeEmbedUrl(mediaSrc)}
                  title={title || 'Hero video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={posterSrc}
                  src={mediaSrc}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <Image
                src={mediaSrc}
                alt={title || 'Hero media'}
                fill
                priority
                sizes="(max-width: 768px) 95vw, 1550px"
                className="object-cover"
              />
            )}

            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-black"
              initial={false}
              animate={{ opacity: 0.62 - scrollProgress * 0.4 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
            />

            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-7">
              {date && (
                <p className="max-w-[15rem] text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/85 sm:max-w-none sm:text-xs">
                  {date}
                </p>
              )}
              {!mediaFullyExpanded && (
                <button
                  type="button"
                  onClick={() => setExpansion(1)}
                  className="group ml-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3.5 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:border-[#FCD106] hover:bg-[#FCD106] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#FCD106] focus:ring-offset-2 focus:ring-offset-black sm:px-4 sm:text-xs"
                >
                  <span>{scrollToExpand}</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                </button>
              )}
            </div>
          </div>

          <h1
            aria-label={title}
            className={`relative z-20 flex w-full flex-col items-center gap-1 px-3 text-center text-5xl font-black uppercase leading-[0.82] tracking-[-0.075em] text-white sm:text-7xl lg:text-9xl ${
              textBlend ? 'mix-blend-difference' : ''
            }`}
          >
            <motion.span
              initial={false}
              animate={{ x: `-${titleShift}vw`, opacity: 1 - scrollProgress * 0.28 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.1 }}
            >
              {firstWord}
            </motion.span>
            {remainingWords && (
              <motion.span
                initial={false}
                animate={{ x: `${titleShift}vw`, opacity: 1 - scrollProgress * 0.28 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.1 }}
              >
                {remainingWords}
              </motion.span>
            )}
          </h1>

          <p className="absolute bottom-7 z-20 text-[0.6rem] font-bold uppercase tracking-[0.26em] text-white/65 sm:bottom-9 sm:text-[0.65rem]">
            {mediaFullyExpanded ? 'Follow the field notes below' : 'Use your scroll wheel or swipe'}
          </p>
        </div>
      </section>

      <motion.section
        id="explore"
        aria-hidden={!showContent}
        initial={false}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 36 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
        className={showContent ? 'relative z-10' : 'pointer-events-none relative z-10'}
      >
        {children}
      </motion.section>
    </div>
  );
}

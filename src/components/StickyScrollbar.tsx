import React, { useEffect, useRef, useState } from 'react';

interface StickyScrollbarProps {
  targetSelector: string;
}

export function StickyScrollbar({ targetSelector }: StickyScrollbarProps) {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  useEffect(() => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement || !scrollbarRef.current) return;

    const updateScrollbar = () => {
      const { scrollWidth: sw, clientWidth: cw, scrollLeft } = targetElement;
      setScrollWidth(sw);
      setClientWidth(cw);
      setIsVisible(sw > cw);
      
      if (scrollbarRef.current) {
        const thumbWidth = (cw / sw) * 100;
        const thumbPosition = (scrollLeft / (sw - cw)) * (100 - thumbWidth);
        
        const thumb = scrollbarRef.current.querySelector('.scrollbar-thumb') as HTMLElement;
        if (thumb) {
          thumb.style.width = `${thumbWidth}%`;
          thumb.style.left = `${thumbPosition}%`;
        }
      }
    };

    const handleScroll = () => updateScrollbar();
    const handleResize = () => updateScrollbar();

    targetElement.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    updateScrollbar();

    return () => {
      targetElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [targetSelector]);

  const handleScrollbarClick = (e: React.MouseEvent) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement || !scrollbarRef.current) return;

    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const maxScrollLeft = scrollWidth - clientWidth;
    
    targetElement.scrollLeft = clickPosition * maxScrollLeft;
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={scrollbarRef}
      className="absolute bottom-0 left-0 right-0 h-4 bg-gray-100 border-t border-gray-200 cursor-pointer z-50"
      onClick={handleScrollbarClick}
    >
      <div className="scrollbar-thumb absolute top-1 bottom-1 bg-gray-400 rounded hover:bg-gray-500 transition-colors duration-200"></div>
    </div>
  );
}
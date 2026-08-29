'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animateNotificationEntrance } from '@/animations/notifications';

interface AlertNotificationProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export default function AlertNotification({ title, message, onClose }: AlertNotificationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Trigger Anime.js spring-based slide & scale entrance
    animateNotificationEntrance(el);

    const timer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-surface/95 backdrop-blur-md border border-primary/30 shadow-2xl rounded-lg p-4 flex gap-3 select-none transition-all duration-300"
      style={{ opacity: 0 }}
    >
      <div className="text-xl shrink-0">🔔</div>
      <div className="flex-grow min-w-0">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide truncate">
          {title}
        </h4>
        <p className="text-xs text-muted-text mt-1 leading-relaxed font-semibold">
          {message}
        </p>
      </div>
      <button 
        onClick={handleClose}
        className="text-muted-light hover:text-foreground text-xs font-bold self-start cursor-pointer px-1.5 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

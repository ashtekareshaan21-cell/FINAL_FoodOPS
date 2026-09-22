'use client';

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { prefersReducedMotion } from './accessibility';

interface DeliveryRouteTrackerProps {
  status: string; // e.g. 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'TRAVELING', 'PICKUP_IN_PROGRESS', 'ARRIVED', 'PICKED_UP', 'DELIVERING', 'DELIVERY_IN_PROGRESS', 'DELIVERED', 'COMPLETED'
  className?: string;
}

export function DeliveryRouteTracker({ status, className = '' }: DeliveryRouteTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const riderRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const pathEl = pathRef.current;
    const riderEl = riderRef.current;
    if (!pathEl || !riderEl) return;

    // Map business statuses to percentage progress
    let startPercent = 0;
    let endPercent = 0;
    let isActive = false;

    switch (status) {
      case 'ACCEPTED':
      case 'ASSIGNED':
      case 'VOLUNTEER_ASSIGNED':
        startPercent = 0;
        endPercent = 0;
        isActive = false;
        break;
      case 'TRAVELING':
      case 'PICKUP_IN_PROGRESS':
        startPercent = 0;
        endPercent = 0.5; // halfway to donor
        isActive = true;
        break;
      case 'ARRIVED':
      case 'PICKED_UP':
        startPercent = 0.5;
        endPercent = 0.5;
        isActive = false;
        break;
      case 'DELIVERING':
      case 'DELIVERY_IN_PROGRESS':
        startPercent = 0.5;
        endPercent = 1.0; // all the way to NGO
        isActive = true;
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        startPercent = 1.0;
        endPercent = 1.0;
        isActive = false;
        break;
      default:
        startPercent = 0;
        endPercent = 0;
        isActive = false;
    }

    const totalLength = pathEl.getTotalLength();

    const updatePosition = (percent: number) => {
      const point = pathEl.getPointAtLength(percent * totalLength);
      // Calculate rotation angle relative to delta steps
      const delta = 1;
      const nextPoint = pathEl.getPointAtLength(Math.min(totalLength, percent * totalLength + delta));
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      
      if (riderEl) {
        riderEl.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
      }
    };

    if (prefersReducedMotion()) {
      updatePosition(endPercent);
      return;
    }

    const obj = { progress: startPercent };
    const anim = animate(obj, {
      progress: endPercent,
      duration: isActive ? 5000 : 1500,
      ease: 'inOutQuad',
      loop: isActive,
      onRender: () => {
        updatePosition(obj.progress);
      }
    });

    return () => {
      anim.revert();
    };
  }, [status]);

  return (
    <div ref={containerRef} className={`w-full max-w-lg mx-auto bg-surface-muted border border-border rounded-lg p-5 shadow-inner select-none ${className}`}>
      <div className="flex justify-between items-center text-[10px] font-bold text-muted-light uppercase tracking-wider mb-4">
        <span>🏨 Donor / Kitchen</span>
        <span className="text-primary font-black">
          {status === 'DELIVERED' || status === 'COMPLETED' ? '✓ Safe NGO Handover' : '🛰️ In Transit'}
        </span>
        <span>🌍 NGO Base</span>
      </div>

      <div className="relative h-24 w-full flex items-center justify-center">
        <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
          {/* Background route path */}
          <path
            d="M 30,50 C 130,10 270,90 370,50"
            fill="none"
            stroke="var(--color-border, #e4e4e7)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Active dash path */}
          <path
            ref={pathRef}
            d="M 30,50 C 130,10 270,90 370,50"
            fill="none"
            stroke="var(--color-primary, #10b981)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 6"
            className={status.includes('PROGRESS') || status === 'TRAVELING' || status === 'DELIVERING' ? 'animate-pulse' : ''}
          />

          {/* Start Point */}
          <circle cx="30" cy="50" r="7" fill="var(--color-primary, #10b981)" />
          <circle cx="30" cy="50" r="11" fill="none" stroke="var(--color-primary, #10b981)" strokeWidth="1.5" className="animate-ping opacity-35" />

          {/* End Point */}
          <circle cx="370" cy="50" r="7" fill="var(--color-primary, #10b981)" />

          {/* Rider Icon */}
          <g ref={riderRef} style={{ transformOrigin: 'center' }}>
            <circle cx="0" cy="0" r="12" fill="var(--color-primary, #10b981)" className="shadow-lg" />
            <text x="-6" y="4" fontSize="11" fill="white" fontWeight="bold">🚴</text>
          </g>
        </svg>
      </div>

      <div className="mt-2 text-center">
        <p className="text-[11px] font-bold text-foreground">
          {status === 'ACCEPTED' || status === 'ASSIGNED' || status === 'VOLUNTEER_ASSIGNED'
            ? 'Rider assigned, planning collection journey.'
            : status === 'TRAVELING' || status === 'PICKUP_IN_PROGRESS'
            ? 'Rider is traveling to the donor kitchen.'
            : status === 'ARRIVED' || status === 'PICKED_UP'
            ? 'Rider arrived. Securing food items and packing.'
            : status === 'DELIVERING' || status === 'DELIVERY_IN_PROGRESS'
            ? 'Rider en route to NGO base with cargo.'
            : 'Food cargo successfully received and logged.'}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface ClientDateTimeProps {
  date: Date | string;
}

export default function ClientDateTime({ date }: ClientDateTimeProps) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    if (!date) return;
    const d = new Date(date);
    const formattedStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
      ' (' + 
      d.toLocaleDateString() + 
      ')';
    const timer = setTimeout(() => {
      setFormatted(formattedStr);
    }, 0);
    return () => clearTimeout(timer);
  }, [date]);

  return <>{formatted}</>;
}

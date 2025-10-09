// app/films/components/StyledSelect.tsx

'use client';
import { ChevronDown } from 'lucide-react';

export default function StyledSelect({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full bg-transparent border border-white text-white px-4 py-2 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-white font-gotham"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
    </div>
  );
}

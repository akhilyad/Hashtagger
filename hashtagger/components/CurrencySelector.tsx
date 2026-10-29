'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Coins } from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  CurrencyConfig,
  getCurrency,
} from '@/lib/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function CurrencySelector({
  value,
  onChange,
  className = '',
  size = 'md',
  showLabel = true,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeCurrency = getCurrency(value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (curr: CurrencyConfig) => {
    onChange(curr.code);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {showLabel && (
        <span className="block text-[11px] font-medium text-slate-500 mb-1">
          Pay in Currency
        </span>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 bg-white border border-slate-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-slate-900 transition-all cursor-pointer font-medium shadow-xs ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 font-sans">
          <span className="text-base leading-none">{activeCurrency.flag}</span>
          <span className="font-semibold text-slate-950 font-mono">
            {activeCurrency.code}
          </span>
          <span className="text-slate-500 font-mono">({activeCurrency.symbol})</span>
          {activeCurrency.code === 'EUR' && (
            <span className="ml-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60 hidden sm:inline-block">
              Primary
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-50 mt-1.5 w-64 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 border border-slate-200 py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Checkout Currency</span>
            </span>
            <span className="text-emerald-700 font-mono font-semibold">
              EUR is primary
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected =
                curr.code.toUpperCase() === activeCurrency.code.toUpperCase();
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleSelect(curr)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 text-indigo-950 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{curr.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-950 font-mono">
                          {curr.code}
                        </span>
                        <span className="text-slate-400 font-mono">
                          ({curr.symbol})
                        </span>
                        {curr.code === 'EUR' && (
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        {curr.name}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


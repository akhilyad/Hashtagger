'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Check, Coins } from 'lucide-react';
import { SUPPORTED_CURRENCIES, getCurrency } from '@/lib/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  /**
   * Extra classes for the root. The root defaults to `inline-block`; if this
   * contains any display utility (e.g. `block`, `hidden`, `sm:flex`), the default
   * is dropped so the caller fully owns display. Prefer wrapping the selector in
   * an element that owns responsive visibility.
   */
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  variant?: 'light' | 'dark';
  /** Preferred side the panel aligns to. It flips/clamps automatically to stay on screen. */
  align?: 'left' | 'right';
}

/** Desired panel width; clamped to the viewport minus a 16px gutter on each side. */
const PANEL_WIDTH = 288;
const VIEWPORT_GUTTER = 16;
const PANEL_OFFSET = 6;
const PANEL_HEADER_HEIGHT = 44;
const MAX_LIST_HEIGHT = 288;
const MIN_LIST_HEIGHT = 144;
/** Matches Tailwind display utilities, with or without variant prefixes (e.g. "sm:hidden"). */
const DISPLAY_CLASS_PATTERN =
  /(^|\s)(?:[\w-]+:)*(?:block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|hidden|table)(?=\s|$)/;

interface Placement {
  /** Left offset relative to the component's own container (px). */
  left: number;
  width: number;
  listMaxHeight: number;
  dropUp: boolean;
}

export default function CurrencySelector({
  value,
  onChange,
  className = '',
  size = 'md',
  showLabel = true,
  variant = 'light',
  align = 'right',
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });

  const prefersReducedMotion = useReducedMotion();
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-listbox`;
  const headerId = `${baseId}-header`;
  const optionId = (index: number) => `${baseId}-option-${SUPPORTED_CURRENCIES[index]?.code ?? index}`;

  const activeCurrency = getCurrency(value);
  const selectedIndex = Math.max(
    0,
    SUPPORTED_CURRENCIES.findIndex((c) => c.code === activeCurrency.code)
  );
  const isDark = variant === 'dark';
  const isSmall = size === 'sm';
  const lastIndex = SUPPORTED_CURRENCIES.length - 1;

  /** Measures the trigger and keeps the panel fully inside the viewport. */
  const computePlacement = useCallback((): Placement | null => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    if (!container || !trigger || typeof window === 'undefined') return null;

    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, viewportWidth - VIEWPORT_GUTTER * 2);
    const triggerRect = trigger.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const preferredLeft = align === 'left' ? triggerRect.left : triggerRect.right - width;
    const clampedLeft = Math.min(
      Math.max(preferredLeft, VIEWPORT_GUTTER),
      viewportWidth - VIEWPORT_GUTTER - width
    );

    const spaceBelow = viewportHeight - triggerRect.bottom - PANEL_OFFSET - VIEWPORT_GUTTER;
    const spaceAbove = triggerRect.top - PANEL_OFFSET - VIEWPORT_GUTTER;
    const dropUp = spaceBelow < MIN_LIST_HEIGHT + PANEL_HEADER_HEIGHT && spaceAbove > spaceBelow;
    const available = (dropUp ? spaceAbove : spaceBelow) - PANEL_HEADER_HEIGHT;

    return {
      left: clampedLeft - containerRect.left,
      width,
      listMaxHeight: Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, available)),
      dropUp,
    };
  }, [align]);

  const openList = useCallback(
    (startIndex: number) => {
      setPlacement(computePlacement());
      setActiveIndex(startIndex);
      setIsOpen(true);
    },
    [computePlacement]
  );

  const closeList = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const selectIndex = (index: number) => {
    const curr = SUPPORTED_CURRENCIES[index];
    if (!curr) return;
    if (curr.code !== activeCurrency.code) onChange(curr.code);
    closeList(true);
  };

  // Move focus into the listbox once it is rendered, keep the active option in view.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const code = SUPPORTED_CURRENCIES[activeIndex]?.code ?? activeIndex;
    const el = document.getElementById(`${baseId}-option-${code}`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeIndex, baseId]);

  // Outside click / tap closes; viewport changes re-measure the panel.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleResize = () => setPlacement(computePlacement());
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, computePlacement]);

  useEffect(() => {
    const typeahead = typeaheadRef.current;
    return () => {
      if (typeahead.timer) clearTimeout(typeahead.timer);
    };
  }, []);

  const handleTypeahead = (char: string) => {
    const state = typeaheadRef.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += char.toLowerCase();
    state.timer = setTimeout(() => {
      state.buffer = '';
      state.timer = null;
    }, 600);

    const matches = (i: number) => {
      const c = SUPPORTED_CURRENCIES[i];
      return (
        c.code.toLowerCase().startsWith(state.buffer) ||
        c.name.toLowerCase().startsWith(state.buffer)
      );
    };
    // Repeating the same letter cycles through matches; otherwise search from the current option.
    const isRepeat = state.buffer.length > 1 && state.buffer.split('').every((ch) => ch === state.buffer[0]);
    if (isRepeat) state.buffer = state.buffer[0];
    const start = isRepeat || state.buffer.length === 1 ? activeIndex + 1 : activeIndex;
    for (let step = 0; step < SUPPORTED_CURRENCIES.length; step++) {
      const i = (start + step) % SUPPORTED_CURRENCIES.length;
      if (matches(i)) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList(selectedIndex);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeList(true);
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(lastIndex, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
      case 'PageUp':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
      case 'PageDown':
        e.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectIndex(activeIndex);
        break;
      case 'Escape':
        // Keep a parent dialog (e.g. the paywall modal) open: only this popup closes.
        e.preventDefault();
        e.stopPropagation();
        closeList(true);
        break;
      case 'Tab':
        // Let Tab continue from the trigger's position in the page.
        triggerRef.current?.focus();
        setIsOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleTypeahead(e.key);
        }
    }
  };

  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    const next = e.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) return;
    if (next) setIsOpen(false);
  };

  const triggerClasses = [
    'group inline-flex items-center justify-between gap-2 rounded-lg font-medium cursor-pointer select-none',
    'transition-[border-color,box-shadow,background-color,color,transform] duration-150',
    'motion-safe:active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    isDark
      ? 'bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus-visible:ring-emerald-400 focus-visible:ring-offset-slate-950 px-2.5 py-1.5 text-xs'
      : `bg-white border border-slate-200 hover:border-indigo-300 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_-1px_rgba(79,70,229,0.15)] focus-visible:ring-indigo-500 focus-visible:ring-offset-white ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
        }`,
    isOpen ? (isDark ? 'border-slate-500 text-white' : 'border-indigo-400') : '',
  ].join(' ');

  const panelMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 },
      }
    : {
        initial: { opacity: 0, y: placement?.dropUp ? 6 : -6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: placement?.dropUp ? 4 : -4, scale: 0.98 },
        transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const },
      };

  const panelStyle: React.CSSProperties = placement
    ? { left: placement.left, width: placement.width }
    : {};
  const fallbackAlign = align === 'left' ? 'left-0' : 'right-0';
  // A caller-supplied display utility (e.g. "block", "hidden", "sm:flex") must not
  // be fought by our default, so only fall back to inline-block when none is given.
  const hasDisplayClass = DISPLAY_CLASS_PATTERN.test(className);

  return (
    <div
      ref={containerRef}
      className={`relative ${hasDisplayClass ? '' : 'inline-block'} text-left ${className}`}
      onBlur={handleContainerBlur}
    >
      {showLabel && (
        <span id={labelId} className="block text-[11px] font-medium text-slate-600 mb-1">
          Pay in Currency
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeList(true) : openList(selectedIndex))}
        onMouseDown={(e) => {
          // Keep focus inside the listbox while toggling it closed (Safari focus quirk).
          if (isOpen) e.preventDefault();
        }}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={`${showLabel ? 'Pay in currency' : 'Currency'}: ${activeCurrency.name} (${activeCurrency.code})`}
      >
        <span className="flex items-center gap-1.5 font-sans">
          <span className="text-base leading-none" aria-hidden="true">
            {activeCurrency.flag}
          </span>
          <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {activeCurrency.code}
          </span>
          <span
            className={`hidden sm:inline font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            aria-hidden="true"
          >
            ({activeCurrency.symbol})
          </span>
          {activeCurrency.code === 'EUR' && (
            <span
              className={`ml-0.5 hidden sm:inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-300 ring-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              }`}
            >
              Primary
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 ${
            isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-indigo-600'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="currency-panel"
            {...panelMotion}
            style={panelStyle}
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute z-50 ${placement ? '' : `${fallbackAlign} w-72`} ${
              placement?.dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
            } max-w-[calc(100vw-2rem)] rounded-xl p-px bg-gradient-to-b from-indigo-200/90 via-slate-200 to-slate-200 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28),0_4px_12px_-4px_rgba(15,23,42,0.08)]`}
          >
            <div className="rounded-[11px] bg-white overflow-hidden">
              <div
                className="px-3 py-2.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-between gap-2 text-[11px] font-medium"
              >
                <span id={headerId} className="flex items-center gap-1.5 text-slate-600">
                  <Coins className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>Select checkout currency</span>
                </span>
                <span className="text-emerald-700 font-mono font-semibold whitespace-nowrap">
                  EUR is primary
                </span>
              </div>

              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                tabIndex={-1}
                aria-labelledby={headerId}
                aria-activedescendant={optionId(activeIndex)}
                onKeyDown={handleListKeyDown}
                style={{ maxHeight: placement?.listMaxHeight ?? MAX_LIST_HEIGHT }}
                className="overflow-y-auto overscroll-contain p-1.5 space-y-0.5 focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((curr, index) => {
                  const isSelected = index === selectedIndex;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={curr.code}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectIndex(index)}
                      onMouseMove={() => {
                        if (activeIndex !== index) setActiveIndex(index);
                      }}
                      className={`relative flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-colors duration-100 ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-950' : 'text-slate-700'
                      } ${
                        isActive
                          ? `${isSelected ? 'bg-indigo-50' : 'bg-slate-100'} shadow-[inset_0_0_0_1.5px_rgba(99,102,241,0.6)]`
                          : ''
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="text-base leading-none shrink-0" aria-hidden="true">
                          {curr.flag}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-950 font-mono">{curr.code}</span>
                            <span className="text-slate-500 font-mono" aria-hidden="true">
                              ({curr.symbol})
                            </span>
                            {curr.code === 'EUR' && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                Primary
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-slate-600 font-normal">
                            {curr.name}
                          </span>
                        </span>
                      </span>

                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

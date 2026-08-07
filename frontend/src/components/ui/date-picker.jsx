import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/**
 * Parse input string (DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY) into a Date object or null.
 */
function parseDateString(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Match YYYY/MM/DD or YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Format Date object to DD/MM/YYYY string.
 */
function formatDateToDDMMYYYY(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Pilih tanggal...',
  disabled = false,
  variant = 'light', // 'light' | 'dark'
  position = 'bottom', // 'bottom' | 'top'
  className = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Selected date object
  const initialParsed = parseDateString(value);
  const [selectedDate, setSelectedDate] = useState(initialParsed);

  // Viewport month & year inside the calendar grid
  const today = new Date();
  const [viewYear, setViewYear] = useState(initialParsed ? initialParsed.getFullYear() : today.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(initialParsed ? initialParsed.getMonth() : 0);

  useEffect(() => {
    const parsed = parseDateString(value);
    setSelectedDate(parsed);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    const formatted = formatDateToDDMMYYYY(newDate);
    if (onChange) onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    if (onChange) onChange('');
  };

  // Generate days in viewMonth/viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  // Generate Year Options (1940 to Current Year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1940; y--) {
    yearOptions.push(y);
  }

  const isDark = variant === 'dark';
  const isTop = position === 'top';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-between cursor-pointer transition-all select-none',
          isDark
            ? 'h-12 px-3.5 bg-white/5 border border-white/10 rounded-xl text-white hover:border-brand/60 focus:border-brand'
            : 'h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-gray-900 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className={cn('w-4 h-4 shrink-0', isDark ? 'text-brand/80' : 'text-gray-400')} />
          {value ? (
            <span className={cn('font-mono font-medium text-xs truncate', isDark ? 'text-white' : 'text-gray-900')}>
              {value}
            </span>
          ) : (
            <span className={cn('text-xs truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {placeholder}
            </span>
          )}
        </div>

        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className={cn('p-0.5 rounded-full hover:bg-gray-500/20 transition-colors', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 sm:right-auto z-[999] p-4 rounded-2xl shadow-2xl border w-full sm:w-72 backdrop-blur-xl animate-in fade-in-50 zoom-in-95',
            isTop ? 'bottom-full mb-2' : 'top-full mt-2',
            isDark
              ? 'bg-[#191C21] border-white/15 text-white shadow-black/80'
              : 'bg-white border-[#E5E7EB] text-gray-900 shadow-xl'
          )}
        >
          {/* Header Controls: Month & Year Selectors */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className={cn(
                  'text-xs font-bold px-1.5 py-1 rounded-md border focus:outline-none cursor-pointer',
                  isDark
                    ? 'bg-[#23272F] border-white/10 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                )}
              >
                {MONTH_NAMES_ID.map((name, index) => (
                  <option key={name} value={index} className={isDark ? 'bg-[#191C21] text-white' : 'bg-white text-gray-900'}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className={cn(
                  'text-xs font-bold px-1.5 py-1 rounded-md border focus:outline-none cursor-pointer',
                  isDark
                    ? 'bg-[#23272F] border-white/10 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                )}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className={isDark ? 'bg-[#191C21] text-white' : 'bg-white text-gray-900'}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center mb-1">
            {DAY_NAMES_ID.map((day) => (
              <span key={day} className={cn('text-[10px] font-bold uppercase py-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getFullYear() === viewYear;

              const isToday =
                today.getDate() === day &&
                today.getMonth() === viewMonth &&
                today.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'h-7 text-xs rounded-lg font-medium transition-all flex items-center justify-center',
                    isSelected
                      ? 'bg-brand text-white font-bold shadow-md shadow-orange-600/30'
                      : isToday
                      ? isDark
                        ? 'border border-brand/50 text-brand hover:bg-brand/20'
                        : 'border border-brand/50 text-brand hover:bg-orange-50'
                      : isDark
                      ? 'hover:bg-white/10 text-gray-200'
                      : 'hover:bg-gray-100 text-gray-800'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

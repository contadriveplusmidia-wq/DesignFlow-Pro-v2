import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  title?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  title,
  placeholder = 'Selecione uma data'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDark, setIsDark] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Detectar tema
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Inicializar mês atual com base na data selecionada ou usar mês atual
  useEffect(() => {
    if (value) {
      // Parse manual para evitar problemas de timezone
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      // Se não há valor, usar mês atual
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, [value]);

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    // IMPORTANTE: Parse manual da string YYYY-MM-DD para evitar problemas de timezone
    // new Date("2025-12-02") interpreta como UTC, causando deslocamento de -1 dia no Brasil (UTC-3)
    // Solução: fazer parse manual e criar data no timezone local
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Formato: DD/MM/YY (igual ao DateRangePicker)
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year).slice(-2); // Últimos 2 dígitos do ano
    
    return `${dayStr}/${monthStr}/${yearStr}`;
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // getDay() retorna: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
    // Agora incluímos domingo no calendário (7 dias por semana)
    const startDay = firstDay.getDay(); // 0-6 (Domingo-Sábado)
    
    // Adicionar dias do mês anterior para completar a primeira semana (começando no domingo)
    if (startDay > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      // Adicionar dias do mês anterior começando do último dia
      for (let i = startDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        days.push(new Date(prevYear, prevMonth, day));
      }
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Adicionar dias do próximo mês para completar a última semana (até sábado)
    // Calcular quantos dias faltam para completar múltiplos de 7 (7 dias por semana)
    const totalDays = days.length;
    const remainder = totalDays % 7;
    const daysNeeded = remainder === 0 ? 0 : 7 - remainder;
    
    if (daysNeeded > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      
      for (let day = 1; day <= daysNeeded; day++) {
        days.push(new Date(nextYear, nextMonth, day));
      }
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDateForInput(date);
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!value) return false;
    const dateStr = formatDateForInput(date);
    return dateStr === value;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(formatDateForInput(date));
    setIsOpen(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = formatDateForInput(today);
    if (!isDateDisabled(today)) {
      onChange(todayStr);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative inline-flex items-center gap-1 whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 min-w-fit h-[40px]" ref={pickerRef}>
      {/* Ícone de Calendário */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-0.5 rounded transition-all duration-200 flex-shrink-0 ${
          isOpen
            ? 'text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30 ring-1 ring-brand-200 dark:ring-brand-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        title={title || placeholder}
      >
        <Calendar size={16} />
      </button>

      {/* Texto Central - Mostra a data */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="text-center text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap px-1 cursor-pointer"
      >
        {value ? formatDisplayDate(value) : placeholder}
      </div>

      {isOpen && (
        <div className={`
          absolute top-full mt-1.5 z-[100]
          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl
          p-3 min-w-[260px] max-w-[300px]
        `}
        style={{ left: 0 }}>
          {/* Header do Calendário */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className={`text-[10px] sm:text-xs font-semibold text-center py-0.5 ${
                  day === 'Dom' 
                    ? 'text-slate-300 dark:text-slate-600' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((date, idx) => {
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);
              const currentMonthDay = isCurrentMonth(date);
              const isSunday = date.getDay() === 0; // 0 = Domingo

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(date)}
                  disabled={disabled || isSunday}
                  className={`
                    aspect-square text-xs sm:text-sm font-medium rounded-md transition-all duration-200
                    ${isSunday
                      ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed opacity-30'
                      : disabled
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : selected
                      ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                      : today
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-slate-300 hover:bg-brand-100 dark:hover:bg-brand-900/40'
                      : currentMonthDay
                      ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-50'
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between gap-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleClear}
              className="flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <X size={12} />
              Limpar
            </button>
            <button
              onClick={handleToday}
              className="flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-brand-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


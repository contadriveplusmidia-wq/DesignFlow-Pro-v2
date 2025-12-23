import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  title?: string;
  placeholder?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  title,
  placeholder = 'Selecione um período'
}) => {
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [startCurrentMonth, setStartCurrentMonth] = useState(new Date());
  const [endCurrentMonth, setEndCurrentMonth] = useState(new Date());
  const startPickerRef = useRef<HTMLDivElement>(null);
  const endPickerRef = useRef<HTMLDivElement>(null);

  // Inicializar mês atual com base na data selecionada
  useEffect(() => {
    if (startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setStartCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setEndCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [endDate]);

  // Fechar pickers ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startPickerRef.current && !startPickerRef.current.contains(event.target as Node)) {
        setIsStartPickerOpen(false);
      }
      if (endPickerRef.current && !endPickerRef.current.contains(event.target as Node)) {
        setIsEndPickerOpen(false);
      }
    };
    
    if (isStartPickerOpen || isEndPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isStartPickerOpen, isEndPickerOpen]);

  // Formatar data para exibição numérica (ex: "17/12/25")
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Formato: DD/MM/YY
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year).slice(-2); // Últimos 2 dígitos do ano
    
    return `${dayStr}/${monthStr}/${yearStr}`;
  };

  // Formatar texto central do componente
  const getDisplayText = (): string => {
    if (!startDate && !endDate) {
      return placeholder;
    }
    
    // Quando apenas uma data está selecionada: mostrar no formato numérico
    if (startDate && !endDate) {
      return formatDateForDisplay(startDate);
    }
    
    // Quando duas datas estão selecionadas: mostrar ambas no formato numérico
    if (startDate && endDate) {
      const startFormatted = formatDateForDisplay(startDate);
      const endFormatted = formatDateForDisplay(endDate);
      
      return `${startFormatted} – ${endFormatted}`;
    }
    
    return placeholder;
  };

  // Funções auxiliares para o calendário
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    const startDay = firstDay.getDay();
    
    if (startDay > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = startDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        days.push(new Date(prevYear, prevMonth, day));
      }
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

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

  const isDateSelected = (date: Date, isStart: boolean): boolean => {
    const dateStr = formatDateForInput(date);
    return isStart ? dateStr === startDate : dateStr === endDate;
  };

  // Verificar se a data está selecionada no outro calendário (para mostrar indicador)
  const isDateSelectedInOther = (date: Date, isStart: boolean): boolean => {
    const dateStr = formatDateForInput(date);
    // Se estou no calendário da data inicial, verificar se esta data está selecionada como final
    // Se estou no calendário da data final, verificar se esta data está selecionada como inicial
    return isStart ? dateStr === endDate : dateStr === startDate;
  };

  // Verificar se a data está dentro do intervalo selecionado (entre startDate e endDate)
  const isDateInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDateForInput(date);
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isDateDisabled = (date: Date, isStart: boolean): boolean => {
    const dateStr = formatDateForInput(date);
    if (isStart) {
      // Data inicial não pode ser maior que a final (se existir)
      return endDate ? dateStr > endDate : false;
    } else {
      // Data final não pode ser menor que a inicial (se existir)
      return startDate ? dateStr < startDate : false;
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date, currentMonth: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const handleDateClick = (date: Date, isStart: boolean) => {
    const dateStr = formatDateForInput(date);
    
    if (isStart) {
      onStartDateChange(dateStr);
      setIsStartPickerOpen(false);
      // Se a data inicial for maior que a final (e a final existir), ajustar a final
      if (endDate && dateStr > endDate) {
        onEndDateChange(dateStr);
      }
    } else {
      // Data final só é definida quando o usuário interage com o ícone da direita
      onEndDateChange(dateStr);
      setIsEndPickerOpen(false);
      // Se a data final for menor que a inicial, ajustar a inicial
      if (startDate && dateStr < startDate) {
        onStartDateChange(dateStr);
      }
    }
  };

  const handleClear = (isStart: boolean) => {
    const today = new Date();
    const todayStr = formatDateForInput(today);
    
    if (isStart) {
      // Quando limpar a data inicial: definir para hoje e limpar a data final
      onStartDateChange(todayStr);
      onEndDateChange(''); // Limpar a data final
      setIsStartPickerOpen(false);
    } else {
      // Quando limpar a data final: apenas limpar a data final
      onEndDateChange('');
      setIsEndPickerOpen(false);
    }
  };

  const handleToday = (isStart: boolean) => {
    const today = new Date();
    const todayStr = formatDateForInput(today);
    
    if (isStart) {
      onStartDateChange(todayStr);
      setIsStartPickerOpen(false);
      // Não sincronizar automaticamente a data final
    } else {
      onEndDateChange(todayStr);
      setIsEndPickerOpen(false);
    }
  };

  // Função para encontrar a segunda-feira da semana de uma data
  const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Função para navegar para semana anterior (segunda a sábado)
  const handlePreviousWeek = (isStart: boolean) => {
    let currentDate: Date;
    if (isStart && startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      currentDate = new Date(year, month - 1, day);
    } else if (!isStart && endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      currentDate = new Date(year, month - 1, day);
    } else {
      currentDate = new Date();
    }
    
    const monday = getMondayOfWeek(currentDate);
    monday.setDate(monday.getDate() - 7); // Semana anterior
    
    const mondayStr = formatDateForInput(monday);
    const saturday = new Date(monday);
    saturday.setDate(saturday.getDate() + 5); // Sábado (5 dias após segunda)
    const saturdayStr = formatDateForInput(saturday);
    
    onStartDateChange(mondayStr);
    onEndDateChange(saturdayStr);
    if (isStart) {
      setStartCurrentMonth(new Date(monday.getFullYear(), monday.getMonth(), 1));
    } else {
      setEndCurrentMonth(new Date(monday.getFullYear(), monday.getMonth(), 1));
    }
  };

  // Função para navegar para semana seguinte (segunda a sábado)
  const handleNextWeek = (isStart: boolean) => {
    let currentDate: Date;
    if (isStart && startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      currentDate = new Date(year, month - 1, day);
    } else if (!isStart && endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      currentDate = new Date(year, month - 1, day);
    } else {
      currentDate = new Date();
    }
    
    const monday = getMondayOfWeek(currentDate);
    monday.setDate(monday.getDate() + 7); // Semana seguinte
    
    const mondayStr = formatDateForInput(monday);
    const saturday = new Date(monday);
    saturday.setDate(saturday.getDate() + 5); // Sábado (5 dias após segunda)
    const saturdayStr = formatDateForInput(saturday);
    
    onStartDateChange(mondayStr);
    onEndDateChange(saturdayStr);
    if (isStart) {
      setStartCurrentMonth(new Date(monday.getFullYear(), monday.getMonth(), 1));
    } else {
      setEndCurrentMonth(new Date(monday.getFullYear(), monday.getMonth(), 1));
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const renderCalendar = (isStart: boolean) => {
    const currentMonth = isStart ? startCurrentMonth : endCurrentMonth;
    const setCurrentMonth = isStart ? setStartCurrentMonth : setEndCurrentMonth;
    const selectedDate = isStart ? startDate : endDate;
    const days = getDaysInMonth(currentMonth);

    return (
      <div className="absolute top-full mt-1.5 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 min-w-[260px] max-w-[300px]"
           style={isStart ? { left: 0 } : { right: 0 }}>
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Botões de Navegação de Semana */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <button
            onClick={() => handlePreviousWeek(isStart)}
            className="px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Semana anterior (Seg-Sáb)"
          >
            ← Semana
          </button>
          <button
            onClick={() => handleNextWeek(isStart)}
            className="px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Semana seguinte (Seg-Sáb)"
          >
            Semana →
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
            const disabled = isDateDisabled(date, isStart);
            const selected = isDateSelected(date, isStart);
            const selectedInOther = isDateSelectedInOther(date, isStart);
            const inRange = isDateInRange(date);
            const today = isToday(date);
            const currentMonthDay = isCurrentMonth(date, currentMonth);
            const isSunday = date.getDay() === 0;

            return (
              <button
                key={idx}
                onClick={() => !disabled && !isSunday && handleDateClick(date, isStart)}
                disabled={disabled || isSunday}
                className={`
                  aspect-square text-xs sm:text-sm font-medium rounded-md transition-all duration-200 relative
                  ${isSunday
                    ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed opacity-30'
                    : disabled
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : selected
                    ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                    : selectedInOther
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-2 border-brand-400 dark:border-brand-600'
                    : inRange
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50'
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
            onClick={() => handleClear(isStart)}
            className="flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <X size={12} />
            Limpar
          </button>
          <button
            onClick={() => handleToday(isStart)}
            className="flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-brand-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors"
          >
            Hoje
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative inline-flex items-center gap-1 whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 min-w-fit h-[40px]">
      {/* Ícone 1 - Data Inicial */}
      <div ref={startPickerRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsStartPickerOpen(!isStartPickerOpen);
            setIsEndPickerOpen(false);
          }}
          className={`p-0.5 rounded transition-all duration-200 ${
            isStartPickerOpen
              ? 'text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30 ring-1 ring-brand-200 dark:ring-brand-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title="Selecionar data inicial"
        >
          <Calendar size={16} />
        </button>
        
        {isStartPickerOpen && renderCalendar(true)}
      </div>

      {/* Texto Central - Apenas Informativo - Expande conforme conteúdo */}
      <div className="text-center text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap px-1">
        {getDisplayText()}
      </div>

      {/* Ícone 2 - Data Final */}
      <div ref={endPickerRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsEndPickerOpen(!isEndPickerOpen);
            setIsStartPickerOpen(false);
          }}
          className={`p-0.5 rounded transition-all duration-200 ${
            isEndPickerOpen
              ? 'text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30 ring-1 ring-brand-200 dark:ring-brand-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title="Selecionar data final"
        >
          <Calendar size={16} />
        </button>
        
        {isEndPickerOpen && renderCalendar(false)}
      </div>
    </div>
  );
};

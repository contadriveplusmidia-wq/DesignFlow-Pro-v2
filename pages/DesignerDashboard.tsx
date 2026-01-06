import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Minus, Clock, Zap, TrendingUp, Trash2, ClipboardList, Target, CheckCircle, AlertTriangle, Edit2, X, Upload } from 'lucide-react';
import { DemandItem, DailyPerformanceResult, PerformanceStatus, Demand } from '../types';
import { autoFocus } from '../utils/autoFocus';
import { getArtsCountForGoal, getAdjustmentsCount, filterDemandsForGoal } from '../utils/demandHelpers';
import { convertImageToWebP } from '../utils/imageConverter';

// Função centralizada para calcular status de performance diária
const getDailyPerformanceStatus = (artsToday: number, dailyGoal: number): DailyPerformanceResult => {
  const goal = dailyGoal || 10;
  const percentage = Math.round((artsToday / goal) * 100);
  
  let status: PerformanceStatus;
  let message: string;
  let colors: DailyPerformanceResult['colors'];
  
  if (percentage >= 100) {
    status = 'success';
    message = 'Meta alcançada! Excelente trabalho!';
    colors = {
      bg: 'bg-green-500',
      bgDark: 'bg-green-500/20',
      border: 'border-green-500',
      borderDark: 'border-green-500/50',
      text: 'text-white',
      textDark: 'text-green-400',
      accent: 'text-green-200',
      accentDark: 'text-green-300'
    };
  } else if (percentage >= 70) {
    status = 'warning';
    message = 'Você está quase lá, continue!';
    colors = {
      bg: 'bg-yellow-400',
      bgDark: 'bg-yellow-400/20',
      border: 'border-yellow-400',
      borderDark: 'border-yellow-400/50',
      text: 'text-yellow-900',
      textDark: 'text-yellow-400',
      accent: 'text-yellow-700',
      accentDark: 'text-yellow-300'
    };
  } else {
    status = 'neutral';
    message = 'Continue produzindo!';
    colors = {
      bg: 'bg-white',
      bgDark: 'bg-slate-900',
      border: 'border-slate-200',
      borderDark: 'border-slate-800',
      text: 'text-slate-900',
      textDark: 'text-white',
      accent: 'text-slate-600',
      accentDark: 'text-slate-400'
    };
  }
  
  return { status, percentage, message, colors };
};

export const DesignerDashboard: React.FC = () => {
  const { currentUser, artTypes, demands, addDemand, updateDemand, deleteDemand, startWorkSession, getTodaySession, settings, addCalendarObservation, updateCalendarObservation, deleteCalendarObservation, calendarObservations, addDemandAdjustment, getDemandAdjustments } = useApp();
  const [items, setItems] = useState<DemandItem[]>([]);
  const [selectedArtType, setSelectedArtType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [variationQty, setVariationQty] = useState(0);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [editItems, setEditItems] = useState<DemandItem[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedDemandForAdjustment, setSelectedDemandForAdjustment] = useState<{ demandId: string; itemIndex: number } | null>(null);
  const [managerName, setManagerName] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentImage, setAdjustmentImage] = useState<string | null>(null);
  const [adjustmentsMap, setAdjustmentsMap] = useState<Record<string, boolean>>({});
  const [showAllArtTypes, setShowAllArtTypes] = useState(false);

  const todaySession = currentUser ? getTodaySession(currentUser.id) : undefined;
  
  // Calcular todayDemands antes de usar nos useEffects
  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  today.setHours(0, 0, 0, 0);
  
  const todayDemands = demands.filter(d => 
    d.userId === currentUser?.id && d.timestamp >= today.getTime()
  );

  // Buscar observações de "sem demanda" do dia atual
  const todayNoDemandObservations = calendarObservations.filter(obs => 
    obs.designerId === currentUser?.id && 
    obs.date === today.toISOString().split('T')[0] &&
    obs.type === 'no_demand'
  );

  // Combinar demandas e observações e ordenar por timestamp (mais antigo primeiro)
  const todayHistoryItems = [
    ...todayDemands.map(d => ({ type: 'demand' as const, timestamp: d.timestamp, data: d })),
    ...todayNoDemandObservations.map(o => ({ type: 'no_demand' as const, timestamp: o.createdAt, data: o }))
  ].sort((a, b) => a.timestamp - b.timestamp);
  
  useEffect(() => {
    if (currentUser && !todaySession) {
      startWorkSession(currentUser.id);
    }
  }, [currentUser, todaySession, startWorkSession]);

  // Carregar ajustes para verificar quais já foram preenchidos
  useEffect(() => {
    const loadAdjustments = async () => {
      const map: Record<string, boolean> = {};
      for (const demand of todayDemands) {
        try {
          const adjustments = await getDemandAdjustments(demand.id);
          for (const adj of adjustments) {
            const key = `${demand.id}-${adj.demandItemIndex}`;
            map[key] = true;
          }
        } catch (error) {
          console.error(`Erro ao buscar ajustes da demanda ${demand.id}:`, error);
        }
      }
      setAdjustmentsMap(map);
    };

    if (todayDemands.length > 0) {
      loadAdjustments();
    }
  }, [todayDemands, getDemandAdjustments]);

  // Filtrar demandas que contam (excluir apenas "Ajustes")
  const todayDemandsForGoal = filterDemandsForGoal(todayDemands);
  
  // Calcular total de artes excluindo "Ajustes" da contagem da meta
  const totalArtsToday = todayDemandsForGoal.reduce((acc, d) => acc + getArtsCountForGoal(d), 0);
  const totalPointsToday = todayDemandsForGoal.reduce((acc, d) => acc + d.totalPoints, 0);

  // Calcular status de performance usando meta configurável
  const dailyGoal = settings.dailyArtGoal || 8;
  const performanceStatus = useMemo(() => 
    getDailyPerformanceStatus(totalArtsToday, dailyGoal), 
    [totalArtsToday, dailyGoal]
  );

  // Detectar tema dark/light
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Calcular performance da semana
  const weekPerformance = useMemo(() => {
    if (!currentUser) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    
    // Calcular segunda-feira da semana atual
    // getDay(): 0=Domingo, 1=Segunda, 2=Terça, ..., 6=Sábado
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const performance = [];

    for (let i = 0; i < 6; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayStr = dayDate.toISOString().split('T')[0];
      
      // Buscar demandas do dia
      const dayDemands = demands.filter(d => 
        d.userId === currentUser.id && 
        d.timestamp >= dayStart.getTime() && 
        d.timestamp <= dayEnd.getTime()
      );
      
      // Calcular artes e ajustes do dia
      const dayArts = dayDemands.reduce((acc, d) => acc + getArtsCountForGoal(d), 0);
      const dayAdjustments = dayDemands.reduce((acc, d) => acc + getAdjustmentsCount(d), 0);
      
      // Verificar se tem observação de "sem demanda"
      const hasNoDemandObservation = calendarObservations.some(
        obs => obs.designerId === currentUser.id && 
                obs.date === dayStr && 
                obs.type === 'no_demand'
      );
      
      // Determinar status do dia
      let status: 'success' | 'warning' | 'danger' = 'danger';
      if (dayArts >= dailyGoal) {
        status = 'success';
      } else if (hasNoDemandObservation) {
        status = 'warning';
      }
      
      const isToday = dayStr === today.toISOString().split('T')[0];
      const isPast = dayDate.getTime() < today.getTime();
      const isFuture = dayDate.getTime() > today.getTime();
      
      performance.push({
        day: weekDays[i],
        date: dayDate,
        dateStr: dayStr,
        arts: dayArts,
        adjustments: dayAdjustments,
        status,
        isToday,
        isPast,
        isFuture
      });
    }

    return performance;
  }, [currentUser, demands, calendarObservations, dailyGoal]);

  const selectedArt = artTypes.find(a => a.id === selectedArtType);
  const variationPoints = variationQty * (settings.variationPoints || 5);
  const subtotal = selectedArt ? (selectedArt.points * quantity) + variationPoints : 0;

  const handleAddItem = () => {
    if (!selectedArt) return;

    const itemPoints = (selectedArt.points * quantity) + variationPoints;

    const newItem: DemandItem = {
      artTypeId: selectedArt.id,
      artTypeLabel: selectedArt.label,
      pointsPerUnit: selectedArt.points,
      quantity,
      variationQuantity: variationQty,
      variationPoints,
      totalPoints: itemPoints
    };

    setItems([...items, newItem]);
    setSelectedArtType('');
    setQuantity(1);
    setVariationQty(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || !currentUser) return;

    const totalQuantity = items.reduce((acc, item) => {
      const isVariation = item.artTypeLabel.toLowerCase().includes('variação');
      return acc + (isVariation ? 0 : item.quantity);
    }, 0);
    
    const totalPoints = items.reduce((acc, item) => acc + item.totalPoints, 0);

    await addDemand({
      userId: currentUser.id,
      userName: currentUser.name,
      items,
      totalQuantity,
      totalPoints
    });

    setItems([]);
  };

  const formRef = useRef<HTMLDivElement>(null);

  // AutoFocus quando a página carregar (para o formulário de nova demanda)
  useEffect(() => {
    if (formRef.current) {
      autoFocus(formRef.current, 300);
    }
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAvatarBg = () => {
    if (currentUser?.avatarColor) return currentUser.avatarColor;
    const avatarUrl = currentUser?.avatarUrl || '';
    const bgMatch = avatarUrl.match(/background=([a-fA-F0-9]{6})/);
    if (bgMatch) return `#${bgMatch[1]}`;
    return '#4F46E5';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-md"
            style={{ backgroundColor: getAvatarBg() }}
          >
            {currentUser ? getInitials(currentUser.name) : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
              Olá, {currentUser?.name?.split(' - ')[1] || currentUser?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {dayName}, {dateStr}
            </p>
          </div>
        </div>
        {/* Tag de Nível */}
        {currentUser?.level && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${
            currentUser.level === 'senior' 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
              : currentUser.level === 'pleno'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
          }`}>
            {currentUser.level === 'senior' ? 'Senior' : currentUser.level === 'pleno' ? 'Pleno' : 'Junior'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
        {/* Card dinâmico de Performance do Dia */}
        <div className={`rounded-2xl p-4 sm:p-5 relative overflow-visible transition-all duration-300 shadow-sm flex flex-col ${
          isDark 
            ? `${performanceStatus.colors.bgDark} border ${performanceStatus.colors.borderDark}` 
            : performanceStatus.status === 'neutral'
            ? `${performanceStatus.colors.bg} border ${performanceStatus.colors.border}`
            : `bg-gradient-to-br ${
                performanceStatus.status === 'success' ? 'from-green-500 to-green-600' :
                'from-yellow-400 to-yellow-500'
              }`
        }`}>
          <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full -ml-6 -mb-6 ${
            isDark ? 'bg-white/3' : 'bg-white/5'
          }`}></div>
          
          <div className="relative flex-1 flex flex-col">
            <div className={`flex items-center gap-2 text-xs sm:text-sm mb-3 ${
              isDark ? performanceStatus.colors.accentDark : performanceStatus.colors.accent
            }`}>
              {performanceStatus.status === 'success' ? <CheckCircle size={14} /> :
               performanceStatus.status === 'warning' ? <AlertTriangle size={14} /> :
               <Zap size={14} />}
              <span className="uppercase tracking-wider font-medium">Performance do Dia</span>
            </div>
            
            <div className={`border-t ${
              isDark ? 'border-white/10' : 'border-white/20'
            } mb-4 pt-4`}></div>
            
            <div className="flex gap-6 sm:gap-8 lg:gap-10 mb-3">
              <div>
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${
                  isDark ? performanceStatus.colors.textDark : performanceStatus.colors.text
                }`}>{totalArtsToday}</div>
                <div className={`text-sm uppercase ${
                  isDark ? performanceStatus.colors.accentDark : performanceStatus.colors.accent
                }`}>Artes</div>
              </div>
              <div>
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${
                  isDark ? performanceStatus.colors.textDark : performanceStatus.colors.text
                }`}>{todayDemandsForGoal.length}</div>
                <div className={`text-sm uppercase ${
                  isDark ? performanceStatus.colors.accentDark : performanceStatus.colors.accent
                }`}>Demandas</div>
              </div>
            </div>
            
            <div className={`mt-auto flex items-center gap-2 sm:gap-3 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm ${
              isDark ? 'bg-white/10' : 'bg-white/20'
            }`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0 ${
                isDark ? 'bg-white/10' : 'bg-white/30'
              }`}>
                <Target size={16} className={isDark ? performanceStatus.colors.textDark : performanceStatus.colors.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs sm:text-sm font-semibold ${
                  isDark ? performanceStatus.colors.textDark : performanceStatus.colors.text
                }`}>
                  Meta: {totalArtsToday}/{dailyGoal} artes ({performanceStatus.percentage}%)
                </div>
                <div className={`text-xs ${
                  isDark ? performanceStatus.colors.accentDark : performanceStatus.colors.accent
                }`}>{performanceStatus.message}</div>
              </div>
            </div>
            {/* Performance da Semana */}
            <div className={`mt-4 pt-4 border-t ${
              isDark ? 'border-white/10' : 'border-white/20'
            } overflow-visible`}>
              <div className={`flex items-center gap-2 mb-4 text-xs sm:text-sm ${
                isDark ? performanceStatus.colors.accentDark : performanceStatus.colors.accent
              }`}>
                <TrendingUp size={14} />
                <span className="uppercase tracking-wider font-medium">Performance da Semana</span>
              </div>
              <div className="flex items-center justify-between gap-2 overflow-visible">
                {weekPerformance.map((day, index) => {
                  const getStatusColor = () => {
                    if (day.status === 'success') {
                      return isDark ? 'bg-green-400' : 'bg-green-500';
                    } else if (day.status === 'warning') {
                      return isDark ? 'bg-yellow-400' : 'bg-yellow-500';
                    } else {
                      return isDark ? 'bg-red-400' : 'bg-red-500';
                    }
                  };

                  const getBorderColor = () => {
                    if (day.status === 'success') {
                      return isDark ? 'border-green-400' : 'border-green-500';
                    } else if (day.status === 'warning') {
                      return isDark ? 'border-yellow-400' : 'border-yellow-500';
                    } else {
                      return isDark ? 'border-red-400' : 'border-red-500';
                    }
                  };

                  // Todas as bolinhas são preenchidas, mas com opacidades diferentes:
                  // Dias passados: opacidade 100%
                  // Dia atual: opacidade 100%
                  // Dias futuros: opacidade 30%
                  const fillOpacity = day.isFuture ? 'opacity-30' : 'opacity-100';

                  return (
                    <div
                      key={index}
                      className="relative group flex-1 flex flex-col items-center cursor-pointer overflow-visible"
                      title={`${day.day}: ${day.arts} artes${day.adjustments > 0 ? `, ${day.adjustments} ajustes` : ''}`}
                    >
                      <div className={`text-[10px] font-medium mb-2 ${
                        isDark ? 'text-white/80' : 'text-white/95'
                      }`}>
                        {day.day}
                      </div>
                      <div className="relative w-7 h-7 flex items-center justify-center">
                        {/* Bolinha preenchida (todos os dias) */}
                        <div 
                          className={`w-5 h-5 rounded-full ${getStatusColor()} ${fillOpacity} transition-all duration-200 group-hover:scale-110 shadow-sm`}
                        />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] pointer-events-none">
                        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg py-2.5 px-3.5 shadow-2xl backdrop-blur-sm relative min-w-max">
                          <div className="font-semibold mb-1.5 text-sm whitespace-nowrap">{day.day}</div>
                          <div className="text-slate-300 text-xs whitespace-nowrap">
                            {day.arts} arte{day.arts !== 1 ? 's' : ''}
                            {day.adjustments > 0 && (
                              <span className="ml-2">
                                • {day.adjustments} ajuste{day.adjustments !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1.5 whitespace-nowrap">
                            {day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Botão Sem Demanda */}
            {totalArtsToday < dailyGoal && (
              <div className="mt-3">
                <button
                  onClick={async () => {
                    if (!currentUser) return;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const todayStr = today.toISOString().split('T')[0];
                    
                    // Verificar se já existe observação para hoje
                    const existingObservation = calendarObservations.find(
                      obs => obs.designerId === currentUser.id && obs.date === todayStr
                    );
                    
                    try {
                      if (existingObservation) {
                        // Atualizar observação existente
                        await updateCalendarObservation(existingObservation.id, {
                          note: 'Sem demanda',
                          type: 'no_demand'
                        });
                      } else {
                        // Criar nova observação
                        await addCalendarObservation({
                          designerId: currentUser.id,
                          date: todayStr,
                          note: 'Sem demanda',
                          type: 'no_demand'
                        });
                      }
                      alert('Marcado como sem demanda para hoje!');
                    } catch (error: any) {
                      alert(error.message || 'Erro ao marcar como sem demanda');
                    }
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20'
                      : 'bg-white/30 hover:bg-white/40 text-white border border-white/30'
                  }`}
                >
                  Sem demanda no dia
                </button>
              </div>
            )}
          </div>
        </div>

        <div ref={formRef} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <ClipboardList className="text-slate-500 dark:text-slate-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nova Demanda</h2>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
              Tipo de Arte
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {artTypes.slice(0, 7).map(art => (
                <button
                  key={art.id}
                  onClick={() => setSelectedArtType(art.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium text-center ${
                    selectedArtType === art.id
                      ? 'border-brand-600 bg-brand-50 dark:bg-slate-800 dark:border-slate-600 text-brand-600 dark:text-slate-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {art.label}
                </button>
              ))}
              {artTypes.length > 7 && (
                <button
                  onClick={() => setShowAllArtTypes(!showAllArtTypes)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium text-center flex items-center justify-center gap-2 ${
                    showAllArtTypes
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-600 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {showAllArtTypes ? (
                    <>
                      <X size={18} />
                      <span>Menos</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Mais</span>
                    </>
                  )}
                </button>
              )}
              {showAllArtTypes && artTypes.slice(7).map(art => (
                <button
                  key={art.id}
                  onClick={() => setSelectedArtType(art.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium text-center ${
                    selectedArtType === art.id
                      ? 'border-brand-600 bg-brand-50 dark:bg-slate-800 dark:border-slate-600 text-brand-600 dark:text-slate-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {art.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                QTD
              </label>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full text-center py-2.5 bg-transparent outline-none text-sm"
                />
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Variações
              </label>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                <button 
                  onClick={() => setVariationQty(Math.max(0, variationQty - 1))}
                  className="px-3 py-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={variationQty}
                  onChange={(e) => setVariationQty(parseInt(e.target.value) || 0)}
                  className="w-full text-center py-2.5 bg-transparent outline-none text-sm"
                />
                <button 
                  onClick={() => setVariationQty(variationQty + 1)}
                  className="px-3 py-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {selectedArtType && (
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:border-brand-600 hover:text-brand-600 dark:hover:border-slate-400 dark:hover:text-slate-300 transition-all duration-200 hover:bg-brand-50 dark:hover:bg-brand-900/10"
              >
                <Plus size={18} />
                Adicionar Item
              </button>
            </div>
          )}

          {items.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.quantity}x {item.artTypeLabel}
                    </span>
                    {item.variationQuantity ? (
                      <span className="text-xs text-slate-500">(+{item.variationQuantity} var)</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-brand-700/30"
              >
                Registrar Demanda
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="text-slate-500 dark:text-slate-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Histórico de Hoje</h2>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {todayDemandsForGoal.length} entrega{todayDemandsForGoal.length !== 1 ? 's' : ''}
            {todayNoDemandObservations.length > 0 && ` • ${todayNoDemandObservations.length} sem demanda`}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Horário</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Artes</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {todaySession && (
                <tr className="text-slate-500 dark:text-slate-400">
                  <td className="px-6 py-4 text-sm">{formatTime(todaySession.timestamp)}</td>
                  <td className="px-6 py-4 text-sm flex items-center gap-2">
                    <Clock size={16} />
                    Início do Trabalho
                  </td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 text-center">-</td>
                </tr>
              )}
              {todayHistoryItems.map((item) => {
                if (item.type === 'demand') {
                  const demand = item.data;
                  return (
                    <tr key={demand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(demand.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            Entrega ({demand.items.length} {demand.items.length === 1 ? 'item' : 'itens'})
                          </div>
                          {demand.executionCode && (
                            <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded text-xs font-semibold">
                              {demand.executionCode}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {demand.items.map((item, idx) => {
                            const isAdjustment = item.artTypeLabel.toLowerCase().trim() === 'ajustes';
                            const adjustmentKey = `${demand.id}-${idx}`;
                            const hasAdjustment = adjustmentsMap[adjustmentKey];
                            
                            return (
                              <React.Fragment key={idx}>
                                {isAdjustment ? (
                                  <button
                                    onClick={() => {
                                      setSelectedDemandForAdjustment({ demandId: demand.id, itemIndex: idx });
                                      setManagerName('');
                                      setAdjustmentReason('');
                                      setAdjustmentImage(null);
                                      setShowAdjustmentModal(true);
                                    }}
                                    className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                                      hasAdjustment
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 border border-green-300 dark:border-green-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                    title={hasAdjustment ? 'Ajuste já preenchido - Clique para editar' : 'Clique para adicionar informações do ajuste'}
                                  >
                                    {item.quantity}x {item.artTypeLabel}
                                  </button>
                                ) : (
                                  <span 
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400"
                                  >
                                    {item.quantity}x {item.artTypeLabel}
                                  </span>
                                )}
                                {item.variationQuantity > 0 && (
                                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-600 dark:text-purple-400">
                                    +{item.variationQuantity} {item.variationQuantity === 1 ? 'variação' : 'variações'}
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">
                        {demand.totalQuantity}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingDemand(demand);
                              setEditItems([...demand.items]);
                            }}
                            className="text-slate-400 hover:text-brand-600 transition-colors"
                            title="Editar demanda"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteDemand(demand.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Excluir demanda"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  const observation = item.data;
                  return (
                    <tr key={observation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(observation.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-semibold">
                            Sem demanda
                          </span>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {observation.note}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">-</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja remover a marcação de "Sem demanda"?')) {
                              try {
                                await deleteCalendarObservation(observation.id);
                              } catch (error: any) {
                                alert(error.message || 'Erro ao remover marcação');
                              }
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Remover marcação de sem demanda"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                }
              })}
              {todayHistoryItems.length === 0 && !todaySession && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma demanda registrada hoje
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Demanda */}
      {editingDemand && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar Demanda</h3>
              <button
                onClick={() => {
                  setEditingDemand(null);
                  setEditItems([]);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editItems.map((item, idx) => {
                const artType = artTypes.find(a => a.id === item.artTypeId);
                return (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-900 dark:text-white">{item.artTypeLabel}</span>
                      <button
                        onClick={() => {
                          const newItems = editItems.filter((_, i) => i !== idx);
                          setEditItems(newItems);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newItems = [...editItems];
                              if (newItems[idx].quantity > 1) {
                                newItems[idx].quantity -= 1;
                                newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + (newItems[idx].variationQuantity * (newItems[idx].variationPoints || 0));
                                setEditItems(newItems);
                              }
                            }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + (newItems[idx].variationQuantity * (newItems[idx].variationPoints || 0));
                              setEditItems(newItems);
                            }}
                            className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-center text-sm font-medium text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newItems = [...editItems];
                              newItems[idx].quantity += 1;
                              newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + (newItems[idx].variationQuantity * (newItems[idx].variationPoints || 0));
                              setEditItems(newItems);
                            }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Variações</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newItems = [...editItems];
                              if (newItems[idx].variationQuantity > 0) {
                                newItems[idx].variationQuantity -= 1;
                                newItems[idx].variationPoints = newItems[idx].variationQuantity * (settings.variationPoints || 5);
                                newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + newItems[idx].variationPoints;
                                setEditItems(newItems);
                              }
                            }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.variationQuantity || 0}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx].variationQuantity = Math.max(0, parseInt(e.target.value) || 0);
                              newItems[idx].variationPoints = newItems[idx].variationQuantity * (settings.variationPoints || 5);
                              newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + newItems[idx].variationPoints;
                              setEditItems(newItems);
                            }}
                            className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-center text-sm font-medium text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newItems = [...editItems];
                              newItems[idx].variationQuantity = (newItems[idx].variationQuantity || 0) + 1;
                              newItems[idx].variationPoints = newItems[idx].variationQuantity * (settings.variationPoints || 5);
                              newItems[idx].totalPoints = (newItems[idx].quantity * newItems[idx].pointsPerUnit) + newItems[idx].variationPoints;
                              setEditItems(newItems);
                            }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {editItems.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Nenhum item na demanda. Adicione itens para salvar.
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setEditingDemand(null);
                    setEditItems([]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (editItems.length === 0) {
                      alert('Adicione pelo menos um item para salvar a demanda.');
                      return;
                    }
                    // Variações não contam como artes, apenas como pontos
                    const totalQuantity = editItems.reduce((acc, item) => {
                      const isVariation = item.artTypeLabel.toLowerCase().includes('variação');
                      return acc + (isVariation ? 0 : item.quantity);
                    }, 0);
                    const totalPoints = editItems.reduce((acc, item) => acc + item.totalPoints, 0);
                    try {
                      await updateDemand(editingDemand.id, {
                        items: editItems,
                        totalQuantity,
                        totalPoints
                      });
                      setEditingDemand(null);
                      setEditItems([]);
                    } catch (error) {
                      alert('Erro ao atualizar demanda. Tente novamente.');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste */}
      {showAdjustmentModal && selectedDemandForAdjustment && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Informações do Ajuste</h3>
              <button
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setSelectedDemandForAdjustment(null);
                  setManagerName('');
                  setAdjustmentReason('');
                  setAdjustmentImage(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome do Gestor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do gestor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Digite o nome do gestor"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#280FFF] focus:border-transparent"
                />
              </div>

              {/* Porque do ajuste */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Porque do ajuste <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Descreva o motivo do ajuste..."
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#280FFF] focus:border-transparent resize-none"
                />
              </div>

              {/* Upload de Print */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Print <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          // Converter para WebP
                          const webpImage = await convertImageToWebP(base64, 0.9);
                          setAdjustmentImage(webpImage);
                        };
                        reader.readAsDataURL(file);
                      } catch (error) {
                        alert('Erro ao processar imagem. Tente novamente.');
                        console.error('Erro ao processar imagem:', error);
                      }
                    }}
                    className="hidden"
                    id="adjustment-image-upload"
                  />
                  <label
                    htmlFor="adjustment-image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {adjustmentImage ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={adjustmentImage}
                          alt="Preview do ajuste"
                          className="max-h-full max-w-full object-contain rounded"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustmentImage(null);
                            const input = document.getElementById('adjustment-image-upload') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2" size={32} />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Clique para fazer upload ou arraste a imagem
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          A imagem será convertida automaticamente para WebP
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setSelectedDemandForAdjustment(null);
                    setManagerName('');
                    setAdjustmentReason('');
                    setAdjustmentImage(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!managerName.trim() || !adjustmentReason.trim() || !adjustmentImage) {
                      alert('Preencha todos os campos obrigatórios');
                      return;
                    }

                    if (!selectedDemandForAdjustment) return;

                    try {
                      await addDemandAdjustment({
                        demandId: selectedDemandForAdjustment.demandId,
                        demandItemIndex: selectedDemandForAdjustment.itemIndex,
                        managerName: managerName.trim(),
                        reason: adjustmentReason.trim(),
                        imageUrl: adjustmentImage
                      });
                      // Atualizar o mapa de ajustes
                      const key = `${selectedDemandForAdjustment.demandId}-${selectedDemandForAdjustment.itemIndex}`;
                      setAdjustmentsMap(prev => ({ ...prev, [key]: true }));
                      alert('Ajuste registrado com sucesso!');
                      setShowAdjustmentModal(false);
                      setSelectedDemandForAdjustment(null);
                      setManagerName('');
                      setAdjustmentReason('');
                      setAdjustmentImage(null);
                    } catch (error: any) {
                      alert(error.message || 'Erro ao registrar ajuste. Tente novamente.');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

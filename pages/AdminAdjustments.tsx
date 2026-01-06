import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Filter, Calendar, Users, ChevronDown, X, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';
import { DemandAdjustment } from '../types';
import { DateRangePicker } from '../components/DateRangePicker';
import { ImageModal } from '../components/ImageModal';

type DateFilterType = 'hoje' | 'semana' | 'semanaPassada' | 'mes' | 'custom';

export const AdminAdjustments: React.FC = () => {
  const { users, demands, getDemandAdjustments, deleteDemandAdjustment, refreshData } = useApp();
  const [adjustments, setAdjustments] = useState<(DemandAdjustment & { demand?: any; designerName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('hoje');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const designers = users.filter(u => u.role === 'DESIGNER' && u.active);

  // Formatar data para input
  const formatDateForInput = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obter range de datas
  const getDateRange = (): { start: number; end: number } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);
    
    let start: Date;
    let end: Date = new Date(today);
    end.setHours(23, 59, 59, 999);

    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'hoje') {
      start = new Date(today);
    } else if (dateFilter === 'semana') {
      start = new Date(today);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (dateFilter === 'semanaPassada') {
      end = new Date(today);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      start = new Date(end);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(today);
    }

    return { start: start.getTime(), end: end.getTime() };
  };

  // Carregar ajustes
  useEffect(() => {
    const loadAdjustments = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange();
        const allAdjustments: (DemandAdjustment & { demand?: any; designerName?: string })[] = [];

        // Buscar ajustes de todas as demandas no período
        for (const demand of demands) {
          // Filtrar por designer se selecionado
          if (selectedDesigner !== 'all' && demand.userId !== selectedDesigner) {
            continue;
          }

          // Filtrar por data
          if (demand.timestamp < start || demand.timestamp > end) {
            continue;
          }

          try {
            const demandAdjustments = await getDemandAdjustments(demand.id);
            const designer = users.find(u => u.id === demand.userId);
            
            for (const adj of demandAdjustments) {
              allAdjustments.push({
                ...adj,
                demand,
                designerName: designer?.name || demand.userName
              });
            }
          } catch (error) {
            console.error(`Erro ao buscar ajustes da demanda ${demand.id}:`, error);
          }
        }

        // Ordenar por data de criação (mais recente primeiro)
        allAdjustments.sort((a, b) => b.createdAt - a.createdAt);
        setAdjustments(allAdjustments);
      } catch (error) {
        console.error('Erro ao carregar ajustes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdjustments();
  }, [demands, selectedDesigner, dateFilter, customStartDate, customEndDate, getDemandAdjustments, users]);

  // Sincronizar DateRangePicker quando o período mudar
  useEffect(() => {
    if (dateFilter !== 'custom') {
      const { start, end } = getDateRange();
      setCustomStartDate(formatDateForInput(start));
      const startDateStr = formatDateForInput(start);
      const endDateStr = formatDateForInput(end);
      if (startDateStr !== endDateStr) {
        setCustomEndDate(endDateStr);
      } else {
        setCustomEndDate('');
      }
    }
  }, [dateFilter]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ajuste?')) {
      return;
    }

    try {
      await deleteDemandAdjustment(id);
      setAdjustments(prev => prev.filter(a => a.id !== id));
      await refreshData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir ajuste');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualize e gerencie as informações dos ajustes realizados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-500 dark:text-slate-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filtros</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronDown className={`text-slate-500 dark:text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* Filtro por Designer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Users className="inline mr-1" size={16} />
                Designer
              </label>
              <select
                value={selectedDesigner}
                onChange={(e) => setSelectedDesigner(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#280FFF] focus:border-transparent"
              >
                <option value="all">Todos os Designers</option>
                {designers.map(designer => (
                  <option key={designer.id} value={designer.id}>
                    {designer.name.split(' - ')[1] || designer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Data */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Calendar className="inline mr-1" size={16} />
                Período
              </label>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {(['hoje', 'semana', 'semanaPassada', 'mes'] as DateFilterType[]).map(period => (
                    <button
                      key={period}
                      onClick={() => setDateFilter(period)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        dateFilter === period
                          ? 'bg-[#280FFF] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {period === 'hoje' ? 'Hoje' :
                       period === 'semana' ? 'Semana' :
                       period === 'semanaPassada' ? 'Semana Passada' :
                       'Mês'}
                    </button>
                  ))}
                  <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      dateFilter === 'custom'
                        ? 'bg-[#280FFF] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
                {dateFilter === 'custom' && (
                  <DateRangePicker
                    startDate={customStartDate}
                    endDate={customEndDate}
                    onStartDateChange={setCustomStartDate}
                    onEndDateChange={setCustomEndDate}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Ajustes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ajustes Registrados ({adjustments.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            Carregando ajustes...
          </div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            Nenhum ajuste encontrado no período selecionado
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {adjustments.map(adjustment => (
              <div key={adjustment.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {adjustment.designerName || 'Designer'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(adjustment.createdAt)}
                        </p>
                      </div>
                      {adjustment.demand && (
                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                          {adjustment.demand.items[adjustment.demandItemIndex]?.quantity}x {adjustment.demand.items[adjustment.demandItemIndex]?.artTypeLabel}
                        </div>
                      )}
                    </div>

                    {/* Nome do Gestor */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Gestor
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {adjustment.managerName}
                      </p>
                    </div>

                    {/* Motivo */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Motivo do Ajuste
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                        {adjustment.reason}
                      </p>
                    </div>

                    {/* Print */}
                    {adjustment.imageUrl && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Print
                        </p>
                        <button
                          onClick={() => setSelectedImage(adjustment.imageUrl)}
                          className="block aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={adjustment.imageUrl}
                            alt="Print do ajuste"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleDelete(adjustment.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir ajuste"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Imagem */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};



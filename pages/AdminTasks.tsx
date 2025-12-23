import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { Plus, Check, Calendar, Flag, Trash2, Edit2, X } from 'lucide-react';

export const AdminTasks: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [showPriorityPicker, setShowPriorityPicker] = useState<string | null>(null);

  // Fechar pickers ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verificar se o clique foi fora de qualquer picker
      if (!target.closest('[data-date-picker]') && !target.closest('[data-priority-picker]')) {
        setShowDatePicker(null);
        setShowPriorityPicker(null);
      }
    };

    if (showDatePicker || showPriorityPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDatePicker, showPriorityPicker]);

  // Separar tarefas por status
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = tasks.filter(t => !t.completed).sort((a, b) => {
      // Ordenar por prioridade (high > medium > low) e depois por data
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Se tiver data, ordenar por data
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return b.createdAt - a.createdAt;
    });
    
    const completed = tasks.filter(t => t.completed).sort((a, b) => {
      return (b.completedAt || b.updatedAt) - (a.completedAt || a.updatedAt);
    });
    
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const title = newTaskTitle.trim();
    setNewTaskTitle(''); // Limpar imediatamente para melhor UX
    
    try {
      await addTask({
        title,
        completed: false,
        priority: 'low'
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      setNewTaskTitle(title); // Restaurar título em caso de erro
      alert('Erro ao adicionar tarefa. Tente novamente.');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, {
        completed: !task.completed,
        completedAt: !task.completed ? Date.now() : undefined
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) {
      setEditingTask(null);
      setEditTitle('');
      return;
    }
    
    if (!editTitle.trim()) {
      // Se o título estiver vazio, cancelar edição
      handleCancelEdit();
      return;
    }
    
    // Se o título não mudou, apenas cancelar
    if (editTitle.trim() === editingTask.title) {
      handleCancelEdit();
      return;
    }
    
    try {
      await updateTask(editingTask.id, {
        title: editTitle.trim()
      });
      setEditingTask(null);
      setEditTitle('');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa. Tente novamente.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
  };

  const handleUpdateDate = async (taskId: string, date: string | undefined) => {
    try {
      await updateTask(taskId, { dueDate: date });
      setShowDatePicker(null);
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      alert('Erro ao atualizar data. Tente novamente.');
    }
  };

  const handleUpdatePriority = async (taskId: string, priority: 'low' | 'medium' | 'high') => {
    try {
      await updateTask(taskId, { priority });
      setShowPriorityPicker(null);
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      alert('Erro ao atualizar prioridade. Tente novamente.');
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      alert('Erro ao excluir tarefa. Tente novamente.');
    }
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'text-red-500 dark:text-red-400';
      case 'medium':
        return 'text-orange-500 dark:text-orange-400';
      case 'low':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-slate-400 dark:text-slate-500';
    }
  };

  const formatDate = (dateStr: string): string => {
    // Parse manual para evitar problemas de timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const taskDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`;
    
    return taskDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (dueDate?: string, completed?: boolean): boolean => {
    if (!dueDate || completed) return false;
    // Parse manual para evitar problemas de timezone
    const [year, month, day] = dueDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(23, 59, 59, 999);
    return date.getTime() < Date.now();
  };

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div
        className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggleComplete(task)}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all ${
            task.completed
              ? 'bg-brand-600 dark:bg-brand-500 border-brand-600 dark:border-brand-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500'
          }`}
        >
          {task.completed && <Check size={14} className="text-white m-auto" />}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {editingTask?.id === task.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
                onBlur={(e) => {
                  // Aguardar um pouco para permitir cliques em botões
                  setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (!activeElement || activeElement.tagName !== 'BUTTON') {
                      if (editTitle.trim() && editTitle !== editingTask?.title) {
                        handleSaveEdit();
                      } else {
                        handleCancelEdit();
                      }
                    }
                  }, 100);
                }}
                autoFocus
                className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-brand-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm cursor-text ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-500 line-through'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
                onDoubleClick={() => {
                  if (!task.completed) {
                    handleStartEdit(task);
                  }
                }}
              >
                {task.title}
              </span>
              
              {/* Data */}
              {task.dueDate ? (
                <div className="relative" data-date-picker>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDatePicker(showDatePicker === task.id ? null : task.id);
                      setShowPriorityPicker(null);
                    }}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                      isOverdue(task.dueDate, task.completed)
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Calendar size={12} />
                    {formatDate(task.dueDate)}
                  </button>
                  
                  {showDatePicker === task.id && (
                    <div className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2" data-date-picker>
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => handleUpdateDate(task.id, e.target.value || undefined)}
                        className="text-xs w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateDate(task.id, undefined);
                        }}
                        className="mt-2 w-full text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-1 rounded transition-colors"
                      >
                        Remover data
                      </button>
                    </div>
                  )}
                </div>
              ) : !task.completed && (
                <div className="relative" data-date-picker>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDatePicker(showDatePicker === task.id ? null : task.id);
                      setShowPriorityPicker(null);
                    }}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title="Adicionar data"
                  >
                    <Calendar size={12} />
                  </button>
                  
                  {showDatePicker === task.id && (
                    <div className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2" data-date-picker>
                      <input
                        type="date"
                        onChange={(e) => handleUpdateDate(task.id, e.target.value || undefined)}
                        className="text-xs w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Prioridade */}
              {task.priority && task.priority !== 'low' && (
                <div className="relative" data-priority-picker>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPriorityPicker(showPriorityPicker === task.id ? null : task.id);
                      setShowDatePicker(null);
                    }}
                    className={`${getPriorityColor(task.priority)} transition-colors`}
                    title={`Prioridade ${task.priority === 'high' ? 'alta' : 'média'}`}
                  >
                    <Flag size={14} fill={task.priority !== 'low' ? 'currentColor' : 'none'} />
                  </button>
                  
                  {showPriorityPicker === task.id && (
                    <div className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 min-w-[120px]" data-priority-picker>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdatePriority(task.id, 'low');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                      >
                        <Flag size={12} className="text-blue-500" />
                        Baixa
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdatePriority(task.id, 'medium');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                      >
                        <Flag size={12} className="text-orange-500" fill="currentColor" />
                        Média
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdatePriority(task.id, 'high');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                      >
                        <Flag size={12} className="text-red-500" fill="currentColor" />
                        Alta
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações - Mostrar para tarefas não concluídas ou quando editando */}
        {isHovered && !task.completed && editingTask?.id !== task.id ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!task.dueDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  handleUpdateDate(task.id, todayStr);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                title="Adicionar data"
              >
                <Calendar size={14} />
              </button>
            )}
            {(!task.priority || task.priority === 'low') && (
              <div className="relative" data-priority-picker>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPriorityPicker(showPriorityPicker === task.id ? null : task.id);
                    setShowDatePicker(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  title="Definir prioridade"
                >
                  <Flag size={14} />
                </button>
                
                {showPriorityPicker === task.id && (
                  <div className="absolute top-full right-0 mt-1 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 min-w-[120px]" data-priority-picker>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePriority(task.id, 'low');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                    >
                      <Flag size={12} className="text-blue-500" />
                      Baixa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePriority(task.id, 'medium');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                    >
                      <Flag size={12} className="text-orange-500" fill="currentColor" />
                      Média
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePriority(task.id, 'high');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2 transition-colors"
                    >
                      <Flag size={12} className="text-red-500" fill="currentColor" />
                      Alta
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit(task);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(task);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : task.completed && isHovered && editingTask?.id !== task.id ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(task);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Tarefas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lembretes e tarefas internas
          </p>
        </div>

        {/* Input para nova tarefa */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {newTaskTitle.trim() && <Plus size={12} className="text-brand-600 dark:text-brand-400" />}
            </button>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  handleAddTask();
                }
              }}
              placeholder="Nova tarefa..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Lista de tarefas pendentes */}
        {pendingTasks.length > 0 && (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {pendingTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Lista de tarefas concluídas */}
        {completedTasks.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Concluídas ({completedTasks.length})
              </p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Nenhuma tarefa ainda. Adicione uma nova tarefa acima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


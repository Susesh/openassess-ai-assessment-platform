"use client";

import React, { useState, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";
import { GripVertical, X, Plus } from "lucide-react";

interface Widget {
  id: string;
  type: string;
  title: string;
  content: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  isMinimized?: boolean;
}

interface DraggableWidgetProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  isDragging?: boolean;
}

export function DraggableWidget({
  widget,
  onRemove,
  onToggleMinimize,
  isDragging = false,
}: DraggableWidgetProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        gridColumn: `span ${widget.colSpan || 1}`,
        gridRow: `span ${widget.rowSpan || 1}`,
      }}
    >
      <div
        className={`bento-card ${isDragging ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          e.dataTransfer.setData('text/plain', widget.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        <div className="flex items-center justify-between mb-4 cursor-move">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-[#7B7F85]" />
            <h3 className="font-semibold text-[#2B2E33]">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleMinimize(widget.id)}
              className="p-1 rounded hover:bg-[#C1C4C8]/20 transition-colors"
              aria-label={widget.isMinimized ? "Expand" : "Minimize"}
            >
              {widget.isMinimized ? (
                <Plus className="w-4 h-4 text-[#7B7F85]" />
              ) : (
                <X className="w-4 h-4 text-[#7B7F85]" />
              )}
            </button>
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Remove widget"
            >
              <X className="w-4 h-4 text-[#7B7F85]" />
            </button>
          </div>
        </div>
        {!widget.isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {widget.content}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface WidgetGridProps {
  widgets: Widget[];
  onWidgetRemove: (id: string) => void;
  onWidgetToggleMinimize: (id: string) => void;
  onWidgetReorder: (fromIndex: number, toIndex: number) => void;
  onDropWidget: (widgetId: string, targetIndex: number) => void;
  availableWidgets?: Array<{ id: string; type: string; title: string }>;
  onAddWidget?: (widgetId: string) => void;
  cols?: number;
}

export function WidgetGrid({
  widgets,
  onWidgetRemove,
  onWidgetToggleMinimize,
  onWidgetReorder,
  onDropWidget,
  availableWidgets = [],
  onAddWidget,
  cols = 4,
}: WidgetGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('text/plain');
    
    if (draggedIndex !== null && draggedIndex !== index) {
      onWidgetReorder(draggedIndex, index);
    } else if (widgetId && !widgets.find(w => w.id === widgetId)) {
      onDropWidget(widgetId, index);
    }
    
    setDraggedIndex(null);
  }, [draggedIndex, widgets, onWidgetReorder, onDropWidget]);

  return (
    <div className="space-y-6">
      {/* Available Widgets */}
      {availableWidgets.length > 0 && onAddWidget && (
        <div className="p-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7]">
          <h3 className="font-semibold text-[#2B2E33] mb-3">Available Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {availableWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => onAddWidget(widget.id)}
                className="px-3 py-2 rounded-lg bg-[#2B2E33] text-white text-sm font-medium hover:bg-[#7B7F85] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div
        className="bento-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "1rem",
        }}
      >
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <DraggableWidget
              widget={widget}
              onRemove={onWidgetRemove}
              onToggleMinimize={onWidgetToggleMinimize}
              isDragging={draggedIndex === index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  defaultColSpan?: number;
  defaultRowSpan?: number;
  content: (props: any) => ReactNode;
}

interface DashboardBuilderProps {
  widgets: Widget[];
  availableWidgets: WidgetConfig[];
  onWidgetsChange: (widgets: Widget[]) => void;
  onSave?: (widgets: Widget[]) => void;
  cols?: number;
}

export function DashboardBuilder({
  widgets,
  availableWidgets,
  onWidgetsChange,
  onSave,
  cols = 4,
}: DashboardBuilderProps) {
  const handleAddWidget = useCallback((widgetId: string) => {
    const config = availableWidgets.find(w => w.id === widgetId);
    if (!config) return;

    const newWidget: Widget = {
      id: `${widgetId}-${Date.now()}`,
      type: config.type,
      title: config.title,
      content: config.content({}),
      colSpan: config.defaultColSpan || 1,
      rowSpan: config.defaultRowSpan || 1,
      isMinimized: false,
    };

    onWidgetsChange([...widgets, newWidget]);
  }, [availableWidgets, widgets, onWidgetsChange]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
  }, [widgets, onWidgetsChange]);

  const handleToggleMinimize = useCallback((widgetId: string) => {
    onWidgetsChange(
      widgets.map(w =>
        w.id === widgetId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  }, [widgets, onWidgetsChange]);

  const handleReorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    onWidgetsChange(newWidgets);
  }, [widgets, onWidgetsChange]);

  const handleDropWidget = useCallback((widgetId: string, targetIndex: number) => {
    // This would be used when dragging from available widgets
    handleAddWidget(widgetId);
  }, [handleAddWidget]);

  const availableWidgetOptions = availableWidgets.map(w => ({
    id: w.id,
    type: w.type,
    title: w.title,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2B2E33]">Dashboard Builder</h2>
        {onSave && (
          <button
            onClick={() => onSave(widgets)}
            className="px-4 py-2 rounded-lg bg-[#2B2E33] text-white font-semibold hover:bg-[#7B7F85] transition-colors"
          >
            Save Layout
          </button>
        )}
      </div>

      <WidgetGrid
        widgets={widgets}
        availableWidgets={availableWidgetOptions}
        onAddWidget={handleAddWidget}
        onWidgetRemove={handleRemoveWidget}
        onWidgetToggleMinimize={handleToggleMinimize}
        onWidgetReorder={handleReorderWidgets}
        onDropWidget={handleDropWidget}
        cols={cols}
      />
    </div>
  );
}

// Hook for managing widget layout persistence
export function useWidgetLayout(key: string = 'dashboard-layout') {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // Load layout from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse widget layout:', e);
      }
    }
  }, [key]);

  // Save layout to localStorage
  const saveLayout = useCallback((newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(key, JSON.stringify(newWidgets));
  }, [key]);

  return { widgets, saveLayout };
}

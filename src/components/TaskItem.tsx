import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../hooks/useSlashEngine';
import { MoreVertical, ArrowLeft, ArrowRight, Calendar as CalIcon, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  type: 'todo' | 'remember';
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onDragSelectStart?: (id: string) => void; 
  onDragSelectEnter?: (id: string) => void; 
  onContextMenu?: (e: React.MouseEvent, id: string) => void; // Added for Right Click
  onToggle: (id: string) => void;
  onMove?: (id: string) => void;
  onAddToCalendar?: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string, newTimeBlock?: string) => void;
  innerRef?: (element: HTMLElement | null) => void;
  draggableProps?: any;
  dragHandleProps?: any;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task, type, isSelected = false, onToggleSelection, onDragSelectStart, onDragSelectEnter, onContextMenu, onToggle, onMove, onAddToCalendar, onDelete, onEdit,
  innerRef, draggableProps, dragHandleProps, isDragging
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editTime, setEditTime] = useState(task.timeBlock || "");

  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    onEdit(task.id, editTitle, editTime);
    setIsEditing(false);
    setMenuOpen(false);
  };

  const pageCurlStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, transparent 45%, #B0C4DE 50%, #D6E6FF 100%)',
    boxShadow: '-3px -3px 5px rgba(135, 206, 250, 0.3)',
    borderRadius: '10px 0 0 0',
    zIndex: 10,
    pointerEvents: 'none',
  };

  const draggingStyle: React.CSSProperties = isDragging ? {
    backgroundColor: '#E6F2FF', 
    border: '2px dashed #87CEFA',
    borderRadius: '12px',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0% 100%)',
    boxShadow: '4px 4px 0px rgba(135, 206, 250, 0.3)', 
    zIndex: 9999,
    width: 'fit-content',
    maxWidth: '100%',     
    whiteSpace: 'nowrap', 
    paddingRight: '50px',
    opacity: 0.95
  } : {};

  if (isEditing) {
    return (
      <li
        ref={innerRef}
        {...draggableProps}
        style={{
          position: 'relative', margin: '8px 0', padding: '12px',
          backgroundColor: '#FFFFFF', 
          border: '2px solid #87CEFA', 
          borderRadius: '10px',
          zIndex: 50, width: '100%', boxSizing: 'border-box',
          listStyle: 'none', 
          ...draggableProps?.style
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {type === 'todo' && (
                <input
                    type="text" value={editTime} onChange={(e) => setEditTime(e.target.value.toUpperCase())} 
                    style={{
                        border: 'none', borderBottom: '1px dashed #B0C4DE',
                        background: 'transparent', color: '#4682B4',
                        fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: 'bold',
                        width: '100%', outline: 'none'
                    }}
                />
            )}
            <input
                ref={titleInputRef} type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSaveEdit(); }}
                style={{
                    border: 'none', borderBottom: '1px dashed #B0C4DE', background: 'transparent',
                    fontSize: '1rem', fontWeight: 'bold', width: '100%', outline: 'none',
                    color: '#555', fontFamily: 'inherit'
                }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setIsEditing(false)} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0C4DE' }}><X size={18} /></button>
                <button onClick={handleSaveEdit} title="Save" style={{ background: '#E6F2FF', border: '1px solid #87CEFA', borderRadius: '4px', cursor: 'pointer', color: '#87CEFA', padding: '2px 8px' }}><Check size={16} /></button>
            </div>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={innerRef}
      {...draggableProps}
      // --- ENABLE RIGHT CLICK CONTEXT MENU ---
      onContextMenu={(e) => {
        if (onContextMenu) onContextMenu(e, task.id);
      }}
      // --- SWIPE & CLICK SELECTOR ---
      onMouseDown={(e) => {
        // MUST IGNORE RIGHT CLICKS (Button 2) SO IT DOESN'T TRIGGER DRAG
        if (e.button === 2) return; 

        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || (e.target as Element).closest('button')) return;
        
        if ((e.metaKey || e.ctrlKey) && onToggleSelection) {
          e.preventDefault();
          onToggleSelection(task.id);
        } else {
          e.preventDefault(); 
          if (onDragSelectStart) onDragSelectStart(task.id);
        }
      }}
      onMouseEnter={() => {
        if (onDragSelectEnter) onDragSelectEnter(task.id);
      }}
      style={{
        display: 'flex', alignItems: 'center', padding: '12px 10px',
        borderBottom: isDragging ? 'none' : '1px dashed #D6E6FF',
        position: 'relative', opacity: task.completed ? 0.5 : 1,
        width: '100%',
        listStyle: 'none',
        transition: 'all 0.2s ease-out', 
        userSelect: isSelected ? 'none' : 'auto', 
        backgroundColor: isSelected ? '#F0F8FF' : 'transparent',
        boxShadow: isSelected ? 'inset 4px 0 0 #87CEFA' : 'none',
        ...draggableProps?.style,
        ...draggingStyle
      }}
    >
      <div 
        {...dragHandleProps} 
        style={{ 
           marginRight: '8px', color: '#B0C4DE', cursor: 'grab',
           padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 
        }}
      >
        <GripVertical size={16} />
      </div>

      {task.timeBlock && (
        <div style={{
          marginRight: '12px', 
          fontSize: '0.85rem', 
          color: '#4682B4', 
          fontWeight: 'bold', 
          fontFamily: "'Courier New', monospace", 
          whiteSpace: 'nowrap',
        }}>
          {task.timeBlock}
        </div>
      )}

      <input
        type="checkbox"
        checked={task.completed}
        onClick={(e) => e.stopPropagation()} 
        onChange={() => onToggle(task.id)}
        style={{ accentColor: '#87CEFA', cursor: 'pointer', marginRight: '12px', flexShrink: 0 }}
      />

      <span style={{ 
          textDecoration: task.completed ? 'line-through' : 'none', 
          fontSize: '1rem', color: '#5a6b7c', flexGrow: 1,
          fontFamily: isDragging ? "'Courier New', monospace" : 'inherit',
          whiteSpace: isDragging ? 'nowrap' : 'normal',
          textTransform: 'none' 
      }}>
        {task.title}
      </span>

      {!isDragging && (
        <div ref={menuRef} style={{ position: 'relative', marginLeft: '10px' }}>
          <button 
             onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} 
             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', color: '#B0C4DE' }}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%',
              backgroundColor: 'white', border: '1px dashed #B0C4DE',
              boxShadow: '2px 2px 0px #E6E6FA',
              zIndex: 10, width: '180px', borderRadius: '8px'
            }}>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: '1px dashed #F0F8FF', color: '#778899' }}><Edit2 size={14} /> Edit</button>
              {onMove && (
                <button onClick={(e) => { e.stopPropagation(); onMove(task.id); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: '1px dashed #F0F8FF', color: '#778899' }}>
                  {type === 'todo' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                  {type === 'todo' ? 'Put in Remember' : 'Put in To Do'}
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); if(onAddToCalendar) onAddToCalendar(task); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: '1px dashed #F0F8FF', color: '#778899' }}><CalIcon size={14} /> Put in Calendar</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', color: '#FFB6C1' }}><Trash2 size={14} /> Delete</button>
            </div>
          )}
        </div>
      )}

      {isDragging && <div style={pageCurlStyle} />}
    </li>
  );
};
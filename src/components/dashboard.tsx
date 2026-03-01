import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSlashEngine, Task } from '../hooks/useSlashEngine';
import styles from './Dashboard.module.css';
import { TaskItem } from './TaskItem';
import { DayView } from './Dayview'; 
import { CalendarModal } from './CalendarModal'; 
import { StyleMenu } from './StyleMenu'; 
import { Calendar as CalIcon, Plus, X, ExternalLink, LogOut, CloudCheck, RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useGoogleLogin } from '@react-oauth/google';
import { createCalendarEvent, listUpcomingEvents, openGoogleCalendar } from '../utils/googleCalendar';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export const Dashboard: React.FC = () => {
  const { 
    toDoList, 
    toRemember, 
    calendarConnected, 
    connectCalendar,
    addToDo,
    addToRemember,
    toggleTask,
    moveRememberToToDo,
    deleteToDo,
    deleteTask,
    editTask,
    reorderTasks,
    moveTaskBetweenLists,
    setLists,
    lastSynced,
    syncToCloud,
    manualSync,
    selectedTaskIds,
    toggleTaskSelection,
    clearTaskSelection,
    shiftTimeForSelectedTasks
  } = useSlashEngine();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskForCalendar, setSelectedTaskForCalendar] = useState<Task | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); 

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [rememberInput, setRememberInput] = useState('');
  
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  // --- CONTEXT MENU STATE ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [customShiftMinutes, setCustomShiftMinutes] = useState<string>('15');

  // Close context menu if clicking anywhere else
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleTaskContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    
    if (!selectedTaskIds.includes(id)) {
      clearTaskSelection();
      toggleTaskSelection(id);
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [selectedTaskIds, toggleTaskSelection, clearTaskSelection]);

  // --- RESPONSIVE SWIPE TO SELECT LOGIC ---
  const isDragSelecting = useRef(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragSelecting.current = false; };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleDragSelectStart = useCallback((id: string) => {
    isDragSelecting.current = true;
    window.getSelection()?.removeAllRanges(); 
    toggleTaskSelection(id);
  }, [toggleTaskSelection]);

  // FIX: This single function allows both selecting and unselecting while dragging
  const handleDragSelectEnter = useCallback((id: string) => {
    if (isDragSelecting.current) {
      window.getSelection()?.removeAllRanges(); 
      toggleTaskSelection(id);
    }
  }, [toggleTaskSelection]);

  // --- NETWORK LISTENER EFFECT ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const TIME_REGEX = /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/g;
  
  const getNextStartTime = (): string => {
    if (toDoList.length === 0) return format(new Date(), 'h:mm a');
    const lastTask = toDoList[toDoList.length - 1];
    const matches = (lastTask.timeBlock || "").match(TIME_REGEX);
    return (matches && matches.length > 0) ? matches[matches.length - 1] : format(new Date(), 'h:mm a');
  };

  const handleStartFocus = () => { 
    if (startTime.trim() === '') setStartTime(getNextStartTime()); 
  };

  const handleManualSave = useCallback(async () => {
    setIsSyncing(true);
    try { await manualSync(); } catch (err) { console.error("Manual Sync Failed:", err); }
    setTimeout(() => setIsSyncing(false), 800);
  }, [manualSync]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (navigator.onLine) handleManualSave();
      }
      if (e.key === 'Escape') {
        clearTaskSelection();
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, clearTaskSelection]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLists(data.toDoList || [], data.toRemember || []);
        } else {
          setLists([], []);
        }
      }
      const savedToken = localStorage.getItem('slash_google_token');
      if (savedToken) {
          await validateAndRestoreSession(savedToken);
      } else {
          setIsLoading(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setLists]);

  const validateAndRestoreSession = async (token: string) => {
    const { events, error } = await listUpcomingEvents(token);
    if (!error) {
        setGoogleAccessToken(token);
        setCalendarEvents(events);
        connectCalendar();
    } else if (error === 401) {
        handleLogout();
    } else {
        setGoogleAccessToken(token);
        connectCalendar();
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('slash_google_token');
    auth.signOut(); 
    setGoogleAccessToken(null);
    setIsLoading(false);
    window.location.reload(); 
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      localStorage.setItem('slash_google_token', tokenResponse.access_token);
      setGoogleAccessToken(tokenResponse.access_token);
      connectCalendar(); 
      const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
      try {
        await signInWithCredential(auth, credential);
        const userDoc = doc(db, "users", auth.currentUser!.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
            setLists([], []);
        }
        await syncToCloud(); 
      } catch (err) { console.error("🔥 Firebase Auth failed:", err); }
      const { events } = await listUpcomingEvents(tokenResponse.access_token);
      if (events) setCalendarEvents(events);
    },
    onError: () => alert("Login Failed"),
    scope: 'https://www.googleapis.com/auth/calendar.events', 
  });

  const fetchEvents = async (token: string) => {
    const { events, error } = await listUpcomingEvents(token);
    if (events) setCalendarEvents(events);
    else if (error === 401) handleLogout();
  };

  useEffect(() => {
    if (sidebarOpen && googleAccessToken) fetchEvents(googleAccessToken);
  }, [sidebarOpen, googleAccessToken]);

  const handleOpenCalendarModal = (task: Task) => {
    setSelectedTaskForCalendar(task);
    setModalOpen(true);
  };

  const handleCalendarModalSubmit = async (details: { 
    title: string; description: string; start: string; end: string; isAllDay: boolean; date: Date; 
  }) => {
    if (googleAccessToken) {
        const result = await createCalendarEvent(googleAccessToken, {
            title: details.title, description: details.description, startTime: details.start,
            endTime: details.end, isAllDay: details.isAllDay, date: details.date 
        });
        if (result.success) { fetchEvents(googleAccessToken); setSidebarOpen(true); } 
        else if (result.status === 401) { handleLogout(); } 
        else { alert("Failed to add event."); }
    } else { handleLogout(); }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) {
        reorderTasks(source.droppableId as 'todo' | 'remember', source.index, destination.index);
    } else {
        moveTaskBetweenLists(source.droppableId as 'todo' | 'remember', destination.droppableId as 'todo' | 'remember', source.index, destination.index);
    }
  };

  const moveToDoToRemember = (id: string) => {
    const task = toDoList.find(t => t.id === id);
    if (task) {
        addToRemember(task.title, task.timeBlock || undefined); 
        deleteToDo(id); 
    }
  };

  const handleToDoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isScheduleValid) return;
    addToDo(taskInput, `${startTime} - ${endTime}`); 
    setTaskInput(''); setStartTime(endTime); setEndTime(''); endTimeRef.current?.focus();
  };
  
  const handleRememberSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!rememberInput.trim()) return;
    addToRemember(rememberInput); setRememberInput('');
  };

  const isScheduleValid = /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]?))/.test(startTime) && 
                          /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]?))/.test(endTime) && 
                          taskInput.trim().length > 0;

  if (isAuthLoading || isLoading) {
    return (
      <div className={styles.overlay}><div className={styles.modal}><p style={{ fontWeight: 'bold' }}>Syncing with cloud...</p></div></div>
    );
  }

  if (!calendarConnected) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h1 style={{ fontFamily: 'Georgia', marginBottom: '1rem' }}>Welcome to Slash.</h1>
          <button onClick={() => login()} style={{ padding: '1rem 2rem', backgroundColor: '#87CEFA', color: 'white', border: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>Connect Google Calendar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* --- RIGHT CLICK CONTEXT MENU --- */}
      {contextMenu && selectedTaskIds.length > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          style={{
            position: 'fixed', top: contextMenu.y, left: contextMenu.x,
            backgroundColor: 'white', border: '1px solid #B0C4DE',
            borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: '16px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px',
            width: '220px', animation: 'scaleIn 0.15s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#5a6b7c', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Clock size={14} color="#87CEFA"/> Edit {selectedTaskIds.length} Tasks
            </span>
            <button onClick={() => { setContextMenu(null); clearTaskSelection(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={14}/></button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#5a6b7c' }}>Shift time:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  value={customShiftMinutes} 
                  onChange={(e) => setCustomShiftMinutes(e.target.value)}
                  style={{ width: '45px', padding: '6px', border: '1px solid #B0C4DE', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', outline: 'none' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#999' }}>mins</span>
            </div>
          </div>

          <button 
            onClick={() => {
              shiftTimeForSelectedTasks(parseInt(customShiftMinutes) || 0);
              setContextMenu(null);
            }}
            style={{
              background: '#87CEFA', color: 'white', border: 'none', padding: '8px',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s',
              marginTop: '4px'
            }}
          >
            Apply Changes
          </button>
        </div>
      )}

      <nav style={{
        width: '100%', height: '45px', minHeight: '45px', backgroundColor: 'var(--header-bg)',
        borderBottom: '1px var(--border-style) var(--line-color)', display: 'flex',
        alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', boxSizing: 'border-box', zIndex: 2001
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px', borderRight: '1px solid var(--line-color)', paddingRight: '20px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: !isOnline ? '#ffa500' : isSyncing ? '#3498db' : '#2ecc71',
            boxShadow: isSyncing ? '0 0 8px #3498db' : 'none', transition: 'all 0.3s ease'
          }} />
          <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {!isOnline ? 'OFFLINE CACHE' : isSyncing ? 'SYNCING...' : 'CLOUD READY'}
          </span>
        </div>

        <button 
          onClick={handleManualSave} disabled={isSyncing || !isOnline} title="Manual Save (Cmd+S)"
          style={{
            marginRight: '15px', background: 'none', border: 'none', cursor: !isOnline ? 'not-allowed' : 'pointer', 
            opacity: !isOnline ? 0.5 : 1, color: isSyncing ? 'var(--accent-color)' : '#999', 
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', transition: 'all 0.2s'
          }}
        >
          {isSyncing ? <RefreshCw size={16} className={styles.spin} /> : <CloudCheck size={18} />}
          {isSyncing ? 'SAVING...' : 'SAVE TO CLOUD'}
        </button>
        <StyleMenu />
      </nav>

      <CalendarModal isOpen={modalOpen} initialTitle={selectedTaskForCalendar?.title || ''} onClose={() => setModalOpen(false)} onSubmit={handleCalendarModalSubmit} />

      <div className={styles.contentWrapper}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className={styles.mainContent}>
            <section className={`${styles.column} ${styles.leftColumn}`}>
              <div className={styles.headerBox}><h2 className={styles.headerTitle}>To Do</h2></div>
              <form onSubmit={handleToDoSubmit} className={styles.inputGroup}>
                <div className={styles.timeWrapper}>
                  <input ref={startTimeRef} type="text" className={styles.timeSubInput} placeholder="6:00 AM" value={startTime} onFocus={handleStartFocus} onChange={(e) => handleTimeInput(e.target.value, setStartTime, startTime)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); endTimeRef.current?.focus(); }}} style={{ minWidth: '80px', flexGrow: 1 }} />
                  <span className={styles.timeSeparator}>-</span>
                  <input ref={endTimeRef} type="text" className={styles.timeSubInput} placeholder="9:00 AM" value={endTime} onChange={(e) => handleTimeInput(e.target.value, setEndTime, endTime)} onKeyDown={(e) => { if (e.key === 'Backspace' && endTime === '') { startTimeRef.current?.focus(); }}} style={{ minWidth: '80px', flexGrow: 1 }} />
                </div>
                <input ref={taskInputRef} type="text" className={styles.inputField} placeholder="TASK..." value={taskInput} onChange={(e) => setTaskInput(e.target.value)} style={{ textTransform: 'none' }} />
                <button type="submit" className={styles.actionButton} disabled={!isScheduleValid} style={{ opacity: isScheduleValid ? 1 : 0.3, cursor: isScheduleValid ? 'pointer' : 'not-allowed', transition: 'opacity 0.2s' }}><Plus size={18} /></button>
              </form>
              <Droppable droppableId="todo">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyle: 'none', padding: 0 }}>
                    {toDoList.map((task, index) => ( 
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <TaskItem 
                            task={task} type="todo" innerRef={provided.innerRef} 
                            draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps} 
                            isDragging={snapshot.isDragging} 
                            isSelected={selectedTaskIds.includes(task.id)} 
                            onToggleSelection={toggleTaskSelection} 
                            onDragSelectStart={handleDragSelectStart} 
                            onDragSelectEnter={handleDragSelectEnter}
                            onContextMenu={handleTaskContextMenu} 
                            onToggle={(id) => toggleTask(id, 'todo')} onMove={moveToDoToRemember} onAddToCalendar={handleOpenCalendarModal} onDelete={(id) => deleteTask(id, 'todo')} onEdit={(id, title, time) => editTask(id, 'todo', title, time)} 
                          /> 
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </section>

            <section className={`${styles.column} ${styles.rightColumn}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className={styles.headerBox}><h2 className={styles.headerTitle}>To Remember</h2></div>
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}><CalIcon size={28} /></button>
              </div>
              <form onSubmit={handleRememberSubmit} className={styles.inputGroup}>
                <input type="text" className={styles.inputField} placeholder="Jot down a thought..." value={rememberInput} onChange={(e) => setRememberInput(e.target.value)} />
                <button type="submit" className={styles.actionButton}><Plus size={18} /></button>
              </form>
              <Droppable droppableId="remember">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyle: 'none', padding: 0 }}>
                    {toRemember.map((task, index) => ( 
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <TaskItem 
                            task={task} type="remember" innerRef={provided.innerRef} 
                            draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps} 
                            isDragging={snapshot.isDragging} 
                            isSelected={selectedTaskIds.includes(task.id)} 
                            onToggleSelection={toggleTaskSelection} 
                            onDragSelectStart={handleDragSelectStart} 
                            onDragSelectEnter={handleDragSelectEnter} 
                            onContextMenu={handleTaskContextMenu} 
                            onToggle={(id) => toggleTask(id, 'remember')} onMove={moveRememberToToDo} onAddToCalendar={handleOpenCalendarModal} onDelete={(id) => deleteTask(id, 'remember')} onEdit={(id, title, time) => editTask(id, 'remember', title, time)} 
                          /> 
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </section>
          </div>
        </DragDropContext>

        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarHidden : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#5a6b7c' }}>Today's Plan</h3>
            <div>
              <button onClick={openGoogleCalendar} title="Open in Google Calendar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0C4DE', marginRight: '10px' }}><ExternalLink size={20} /></button>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0C4DE' }}><X size={24} /></button>
            </div>
          </div>
          <div style={{ height: 'calc(100% - 90px)' }}>
             <DayView slashTasks={toDoList} googleEvents={calendarEvents} />
          </div>

          <div style={{ padding: '10px 0', borderTop: '1px dashed var(--line-color)', marginTop: 'auto' }}>
               {lastSynced && (
                 <div style={{ fontSize: '0.7rem', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                    <CloudCheck size={12} /> Last synced: {format(new Date(lastSynced), 'h:mm:ss a')}
                 </div>
               )}
               <button onClick={handleLogout} style={{ fontSize: '0.8rem', color: '#999', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '5px' }}>
                   <LogOut size={12} /> Log Out
               </button>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

    </div>
  );
};

const handleTimeInput = (val: string, setter: React.Dispatch<React.SetStateAction<string>>, currentVal: string) => {
  const isDeleting = val.length < currentVal.length;
  if (!/^[0-9:\sAaMmPp]*$/.test(val)) return;
  if (!isDeleting) {
    const rawDigits = val.replace(/[^\d]/g, ''); 
    if (rawDigits.length === 1 && !val.includes(':')) val = rawDigits + ':';
    else if (rawDigits.length === 2 && (!val.includes(':') || val.indexOf(':') > 1)) val = rawDigits[0] + ':' + rawDigits[1];
    if (/:\d{2}$/.test(val)) val += ' ';
  }
  setter(val.toUpperCase());
};
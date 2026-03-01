import React, { useState, useEffect } from 'react';
import { X, Check, Clock, AlignLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

interface CalendarModalProps {
  isOpen: boolean;
  initialTitle: string;
  onClose: () => void;
  onSubmit: (details: { 
    title: string; 
    description: string; 
    start: string; 
    end: string; 
    isAllDay: boolean;
    date: Date;
  }) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, initialTitle, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'event' | 'task'>('event');
  
  // Date & Time State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [start, setStart] = useState('9:00 AM');
  const [end, setEnd] = useState('10:00 AM');
  const [isAllDay, setIsAllDay] = useState(false);
  
  const [description, setDescription] = useState('');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription('');
      setStart('9:00 AM');
      setEnd('10:00 AM');
      setIsAllDay(false); 
      setSelectedDate(new Date()); 
      setActiveTab('event');
    }
  }, [isOpen, initialTitle]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.3)', 
      backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      {/* POST-IT NOTE CONTAINER */}
      <div style={{
        backgroundColor: '#FFF9C4', // Post-it Yellow
        width: '400px',
        boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
        padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        fontFamily: "'Courier New', Courier, monospace",
        color: '#333',
        transform: 'rotate(-1deg)'
      }}>
        
        {/* Header: Close & Type Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
              <button 
                onClick={() => setActiveTab('event')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: activeTab === 'event' ? 'bold' : 'normal',
                  textDecoration: activeTab === 'event' ? 'underline' : 'none',
                  color: '#333'
                }}
              >
                EVENT
              </button>
              <button 
                onClick={() => setActiveTab('task')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: activeTab === 'task' ? 'bold' : 'normal',
                  textDecoration: activeTab === 'task' ? 'underline' : 'none',
                  color: '#333'
                }}
              >
                TASK
              </button>
           </div>
           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
             <X size={20} />
           </button>
        </div>

        {/* TITLE */}
        <div>
           <input 
             autoFocus
             type="text" 
             placeholder={activeTab === 'task' ? "Task name..." : "Event title..."}
             value={title} 
             onChange={(e) => setTitle(e.target.value)} 
             style={{ 
               width: '100%', border: 'none', borderBottom: '2px solid #E6E0A0', 
               background: 'transparent',
               fontSize: '1.4rem', fontFamily: 'inherit', fontWeight: 'bold',
               outline: 'none', paddingBottom: '4px', color: '#222'
             }}
           />
        </div>

        {/* DATE SELECTOR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
           <button onClick={handlePrevDay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
             <ChevronLeft size={20} />
           </button>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '1rem', fontWeight: 'bold' }}>
              <CalendarIcon size={16} />
              <span>{format(selectedDate, 'EEEE, MMM do')}</span>
           </div>

           <button onClick={handleNextDay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
             <ChevronRight size={20} />
           </button>
        </div>

        {/* TIME INPUTS */}
        {activeTab === 'event' ? (
            /* --- EVENT VIEW --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '24px' }}>
                  {!isAllDay && (
                    <>
                      <input 
                        value={start} onChange={(e) => setStart(e.target.value)}
                        style={{ 
                          width: '80px', background: 'rgba(255,255,255,0.3)', border: '1px solid #E6E0A0', 
                          borderRadius: '4px', padding: '4px', textAlign: 'center', fontFamily: 'inherit' 
                        }} 
                      />
                      <span>to</span>
                      <input 
                        value={end} onChange={(e) => setEnd(e.target.value)}
                        style={{ 
                          width: '80px', background: 'rgba(255,255,255,0.3)', border: '1px solid #E6E0A0', 
                          borderRadius: '4px', padding: '4px', textAlign: 'center', fontFamily: 'inherit' 
                        }} 
                      />
                    </>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <input 
                        type="checkbox" id="allDay" 
                        checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)}
                        style={{ accentColor: '#333', cursor: 'pointer' }}
                      />
                      <label htmlFor="allDay" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>All Day</label>
                  </div>
               </div>
            </div>
        ) : (
            /* --- TASK VIEW (Deadline Only) --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '24px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#555' }}>Deadline:</span>
                  <input 
                    value={start} onChange={(e) => setStart(e.target.value)}
                    placeholder="Add time"
                    style={{ 
                      width: '100px', background: 'rgba(255,255,255,0.3)', border: '1px solid #E6E0A0', 
                      borderRadius: '4px', padding: '4px', textAlign: 'center', fontFamily: 'inherit' 
                    }} 
                  />
               </div>
            </div>
        )}

        {/* DESCRIPTION */}
        <div style={{ display: 'flex', gap: '8px' }}>
           <AlignLeft size={16} style={{ marginTop: '6px', color: '#555' }} />
           <textarea 
             placeholder="Jot down details..."
             value={description} onChange={(e) => setDescription(e.target.value)}
             rows={4}
             style={{ 
               width: '100%', background: 'transparent', border: 'none', 
               backgroundImage: 'linear-gradient(transparent, transparent 27px, #E6E0A0 27px)', 
               backgroundSize: '100% 28px',
               lineHeight: '28px',
               fontSize: '1rem', outline: 'none', resize: 'none', fontFamily: 'inherit',
               color: '#333'
             }}
           />
        </div>
        
        {/* FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            onClick={() => {
                onSubmit({ 
                  title, 
                  description, 
                  start, 
                  end: activeTab === 'task' ? start : end, 
                  isAllDay,
                  date: selectedDate
                });
                onClose(); // <--- THIS WAS MISSING
            }}
            style={{ 
              backgroundColor: '#333', color: '#FFF9C4', border: 'none', 
              padding: '8px 20px', borderRadius: '2px', 
              fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '2px 2px 0px rgba(0,0,0,0.1)'
            }}
          >
            <Check size={16} /> {activeTab === 'task' ? 'SAVE TASK' : 'STICK IT'}
          </button>
        </div>

      </div>
    </div>
  );
};
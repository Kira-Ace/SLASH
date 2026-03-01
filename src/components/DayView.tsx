import React from 'react';
import { Task } from '../hooks/useSlashEngine';
import { differenceInMinutes, startOfDay, parse } from 'date-fns';

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface DayViewProps {
  slashTasks: Task[];
  googleEvents: GoogleEvent[];
}

export const DayView: React.FC<DayViewProps> = ({ slashTasks, googleEvents }) => {
  // CONFIG: 24 Hour Cycle
  const START_HOUR = 0; 
  const END_HOUR = 24;  
  const PIXELS_PER_MINUTE = 1.2; 
  // Total height covers exactly 24 hours
  const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;

  // Helper: Convert time to pixels from top (00:00)
  const getPosition = (timeStrOrIso: string, isIso: boolean) => {
    let date;
    const today = startOfDay(new Date());
    
    if (isIso) {
      date = new Date(timeStrOrIso);
    } else {
      try {
         date = parse(timeStrOrIso, 'h:mm aa', today);
         if (isNaN(date.getTime())) return null;
      } catch (e) { return null; }
    }

    if (!date || isNaN(date.getTime())) return null;

    const minutesFromMidnight = differenceInMinutes(date, today);
    return minutesFromMidnight * PIXELS_PER_MINUTE;
  };

  const getHeight = (start: string, end: string, isIso: boolean) => {
     const top = getPosition(start, isIso);
     const bottom = getPosition(end, isIso);
     if (top === null || bottom === null) return 50; 
     return Math.max(bottom - top, 30); 
  };

  const allDayEvents = googleEvents.filter(ev => ev.start.date && !ev.start.dateTime);
  const timedEvents = googleEvents.filter(ev => ev.start.dateTime);

  // FIX: Created 25 markers (0 to 24) so we see the final 12 AM line
  const hours = Array.from({ length: 25 }, (_, i) => i); 

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'transparent', 
      borderLeft: '2px dashed #B0C4DE' 
    }}>
      
      {/* 1. All-Day Section */}
      {allDayEvents.length > 0 && (
        <div style={{ 
          padding: '10px', 
          borderBottom: '2px dashed #B0C4DE',
          backgroundColor: 'rgba(255, 255, 255, 0.5)'
        }}>
          {allDayEvents.map(ev => (
            <div key={ev.id} style={{
              backgroundColor: '#87CEFA', 
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              marginBottom: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              opacity: 0.6 
            }}>
              {ev.summary}
            </div>
          ))}
        </div>
      )}

      {/* 2. Scrollable Time Grid */}
      <div style={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ height: `${TOTAL_HEIGHT + 20}px`, position: 'relative' }}> 
          
          {/* Hour Markers */}
          {hours.map(h => (
            <div key={h} style={{ 
              position: 'absolute', 
              top: h * 60 * PIXELS_PER_MINUTE, 
              width: '100%', 
              borderTop: '1px dashed #D6E6FF', 
              fontSize: '0.75rem',
              color: '#B0C4DE',
              paddingLeft: '5px',
              fontFamily: "'Courier New', monospace"
            }}>
              {/* FIX: Handle h=24 correctly */}
              {h === 0 || h === 24 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}

          {/* Google Timed Events */}
          {timedEvents.map(ev => {
            if (!ev.start.dateTime || !ev.end.dateTime) return null;
            const top = getPosition(ev.start.dateTime, true);
            const height = getHeight(ev.start.dateTime, ev.end.dateTime, true);
            if (top === null) return null;

            return (
              <div key={ev.id} style={{
                position: 'absolute',
                top: top,
                height: height,
                left: '45px',
                right: '10px',
                backgroundColor: '#F0F8FF', 
                borderLeft: '3px solid #87CEFA',
                borderRadius: '4px',
                padding: '4px',
                fontSize: '0.75rem',
                overflow: 'hidden',
                zIndex: 1,
                color: '#5a6b7c',
                boxShadow: '1px 1px 3px rgba(176, 196, 222, 0.4)'
              }}>
                <div style={{ fontWeight: 'bold' }}>{ev.summary}</div>
              </div>
            );
          })}

          {/* Slash Tasks */}
          {slashTasks.map(task => {
            if (!task.timeBlock) return null;
            const [startStr, endStr] = task.timeBlock.split('-').map(s => s.trim());
            const top = getPosition(startStr, false);
            const height = endStr ? getHeight(startStr, endStr, false) : (60 * PIXELS_PER_MINUTE);

            if (top === null) return null;

            return (
              <div key={task.id} style={{
                position: 'absolute',
                top: top,
                height: height,
                left: '20%', 
                right: '5px',
                backgroundColor: 'rgba(230, 242, 255, 0.9)', 
                border: '1px dashed #87CEFA',
                borderRadius: '6px',
                padding: '4px',
                fontSize: '0.75rem',
                color: '#5a6b7c', 
                zIndex: 10, 
                boxShadow: '2px 2px 0px rgba(135, 206, 250, 0.3)'
              }}>
                 <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                 <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{task.timeBlock}</div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, 
  startOfDay, parse, addMinutes, format as formatDate 
} from 'date-fns';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  timeBlock?: string | null;    
  dueDate?: Date | null;   
  createdAt: Date | string;
}

interface SlashEngineState {
  toDoList: Task[];
  toRemember: Task[];
  calendarConnected: boolean;
  hasLoaded: boolean; 
  lastSynced: string | null;
  
  // --- NEW: SELECTION STATE ---
  selectedTaskIds: string[];
  toggleTaskSelection: (id: string) => void;
  clearTaskSelection: () => void;
  shiftTimeForSelectedTasks: (minutesToShift: number) => void;

  setLists: (todo: Task[], remember: Task[]) => void;
  syncToCloud: (todo?: Task[], remember?: Task[]) => Promise<void>;
  manualSync: () => Promise<void>;
  
  connectCalendar: () => void;
  addToDo: (title: string, timeBlock: string) => void;
  addToRemember: (title: string, timeBlock?: string) => void;
  toggleTask: (id: string, list: 'todo' | 'remember') => void;
  moveRememberToToDo: (id: string) => void;
  deleteToDo: (id: string) => void; 
  deleteTask: (id: string, list: 'todo' | 'remember') => void;
  editTask: (id: string, list: 'todo' | 'remember', newTitle: string, newTimeBlock?: string) => void;
  reorderTasks: (list: 'todo' | 'remember', startIndex: number, endIndex: number) => void;
  moveTaskBetweenLists: (
      sourceList: 'todo' | 'remember', 
      destList: 'todo' | 'remember', 
      sourceIndex: number, 
      destIndex: number
  ) => void;
  parseNaturalDate: (text: string) => { cleanText: string; date: Date | null };
}

const parseDateLogic = (text: string) => {
  const lower = text.toLowerCase();
  const dayMap: { [key: string]: (date: number | Date) => Date } = {
    monday: nextMonday, tuesday: nextTuesday, wednesday: nextWednesday,
    thursday: nextThursday, friday: nextFriday, saturday: nextSaturday, sunday: nextSunday,
  };
  const match = lower.match(/(?:on|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (match) {
    const dayName = match[1];
    const func = dayMap[dayName];
    if (func) {
      return { 
        date: startOfDay(func(new Date())), 
        cleanText: text.replace(match[0], '').trim() 
      };
    }
  }
  return { cleanText: text, date: null };
};

// --- NEW: TIME MATH HELPER ---
const shiftTimeBlock = (timeBlock: string | null | undefined, mins: number): string | null => {
  if (!timeBlock || !timeBlock.includes('-')) return timeBlock || null;
  try {
    const [startStr, endStr] = timeBlock.split('-').map(s => s.trim());
    const startTime = parse(startStr, 'h:mm a', new Date());
    const endTime = parse(endStr, 'h:mm a', new Date());
    
    const newStart = formatDate(addMinutes(startTime, mins), 'h:mm a');
    const newEnd = formatDate(addMinutes(endTime, mins), 'h:mm a');
    
    return `${newStart} - ${newEnd}`;
  } catch (error) {
    console.error("Failed to parse time block for shifting", error);
    return timeBlock || null;
  }
};

export const useSlashEngine = create<SlashEngineState>((set, get) => ({
  toDoList: [],
  toRemember: [],
  calendarConnected: false,
  hasLoaded: false,
  lastSynced: null,
  
  selectedTaskIds: [],

  toggleTaskSelection: (id) => {
    set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(id) 
        ? state.selectedTaskIds.filter(taskId => taskId !== id)
        : [...state.selectedTaskIds, id]
    }));
  },

  clearTaskSelection: () => set({ selectedTaskIds: [] }),

  shiftTimeForSelectedTasks: (minutesToShift) => {
    const state = get();
    if (state.selectedTaskIds.length === 0) return;

    set((currentState) => {
      const updateList = (list: Task[]) => list.map(task => {
        if (currentState.selectedTaskIds.includes(task.id)) {
          return { ...task, timeBlock: shiftTimeBlock(task.timeBlock, minutesToShift) };
        }
        return task;
      });

      const updatedToDo = updateList(currentState.toDoList);
      const updatedRemember = updateList(currentState.toRemember);

      // Force cloud sync with the new shifted times
      get().syncToCloud(updatedToDo, updatedRemember);

      return {
        toDoList: updatedToDo,
        toRemember: updatedRemember,
        selectedTaskIds: [] // Clear selection after the shift is applied
      };
    });
  },

  setLists: (todo, remember) => set({ 
    toDoList: todo, 
    toRemember: remember, 
    hasLoaded: true 
  }),

  syncToCloud: async (todo, remember) => {
    const state = get();
    if (!state.hasLoaded) return; 

    const user = auth.currentUser;
    if (user) {
      const now = new Date().toISOString();
      const userDoc = doc(db, "users", user.uid);
      
      const finalTodo = todo ?? state.toDoList;
      const finalRemember = remember ?? state.toRemember;

      const sanitizeTasks = (tasks: Task[]) => 
        tasks.map(t => ({
          ...t,
          timeBlock: t.timeBlock === undefined ? null : t.timeBlock,
          dueDate: t.dueDate === undefined ? null : t.dueDate,
        }));

      try {
        await setDoc(userDoc, {
          toDoList: sanitizeTasks(finalTodo),
          toRemember: sanitizeTasks(finalRemember),
          updatedAt: now
        }, { merge: true });
        
        set({ lastSynced: now });
      } catch (error) {
        console.error("Cloud Sync Error:", error);
      }
    }
  },

  manualSync: async () => {
    const { toDoList, toRemember, syncToCloud } = get();
    return await syncToCloud(toDoList, toRemember);
  },

  connectCalendar: () => set({ calendarConnected: true }),
  parseNaturalDate: parseDateLogic,

  addToDo: (title, timeBlock) => {
    const newTask: Task = { id: uuidv4(), title, completed: false, timeBlock, createdAt: new Date().toISOString(), dueDate: null };
    set((state) => {
      const newList = [...state.toDoList, newTask];
      get().syncToCloud(newList, state.toRemember);
      return { toDoList: newList };
    });
  },

  addToRemember: (title, timeBlock) => {
    const { cleanText, date } = parseDateLogic(title);
    const newTask: Task = { 
      id: uuidv4(), 
      title: cleanText, 
      completed: false, 
      dueDate: date || null, 
      timeBlock: timeBlock || null, 
      createdAt: new Date().toISOString() 
    };
    set((state) => {
      const newList = [newTask, ...state.toRemember];
      get().syncToCloud(state.toDoList, newList);
      return { toRemember: newList };
    });
  },

  toggleTask: (id, list) => {
    const listName = list === 'todo' ? 'toDoList' : 'toRemember';
    set((state) => {
      const updatedList = state[listName].map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
      const isTodo = list === 'todo';
      get().syncToCloud(isTodo ? updatedList : state.toDoList, isTodo ? state.toRemember : updatedList);
      return { [listName]: updatedList };
    });
  },

  moveRememberToToDo: (id) => {
    set((state) => {
      const task = state.toRemember.find((t) => t.id === id);
      if (!task) return state;
      const newRemember = state.toRemember.filter((t) => t.id !== id);
      const newTodo = [...state.toDoList, task];
      get().syncToCloud(newTodo, newRemember);
      return { toRemember: newRemember, toDoList: newTodo };
    });
  },

  deleteTask: (id, list) => {
    const listName = list === 'todo' ? 'toDoList' : 'toRemember';
    set((state) => {
      const updatedList = state[listName].filter((t) => t.id !== id);
      
      // Also remove from selection if it was selected
      const newSelection = state.selectedTaskIds.filter(selectedId => selectedId !== id);

      const isTodo = list === 'todo';
      get().syncToCloud(isTodo ? updatedList : state.toDoList, isTodo ? state.toRemember : updatedList);
      return { [listName]: updatedList, selectedTaskIds: newSelection };
    });
  },

  editTask: (id, list, newTitle, newTimeBlock) => {
    const listName = list === 'todo' ? 'toDoList' : 'toRemember';
    set((state) => {
      const updatedList = state[listName].map((t) => 
        t.id === id ? { ...t, title: newTitle, timeBlock: newTimeBlock !== undefined ? newTimeBlock : t.timeBlock } : t
      );
      const isTodo = list === 'todo';
      get().syncToCloud(isTodo ? updatedList : state.toDoList, isTodo ? state.toRemember : updatedList);
      return { [listName]: updatedList };
    });
  },

  reorderTasks: (list, startIndex, endIndex) => {
    set((state) => {
      const listName = list === 'todo' ? 'toDoList' : 'toRemember';
      const result = Array.from(state[listName]);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      const isTodo = list === 'todo';
      get().syncToCloud(isTodo ? result : state.toDoList, isTodo ? state.toRemember : result);
      return { [listName]: result };
    });
  },

  moveTaskBetweenLists: (source, dest, sourceIndex, destIndex) => {
    set((state) => {
      const sourceListName = source === 'todo' ? 'toDoList' : 'toRemember';
      const destListName = dest === 'todo' ? 'toDoList' : 'toRemember';
      const sourceClone = Array.from(state[sourceListName]);
      const destClone = Array.from(state[destListName]);
      const [removed] = sourceClone.splice(sourceIndex, 1);
      
      if (dest === 'todo' && !removed.timeBlock) removed.timeBlock = "Today"; 
      destClone.splice(destIndex, 0, removed);

      const finalState = { [sourceListName]: sourceClone, [destListName]: destClone };
      get().syncToCloud(
        (finalState.toDoList as Task[]) || state.toDoList, 
        (finalState.toRemember as Task[]) || state.toRemember
      );
      return finalState;
    });
  },

  deleteToDo: (id) => {
    set((state) => {
      const newList = state.toDoList.filter((t) => t.id !== id);
      const newSelection = state.selectedTaskIds.filter(selectedId => selectedId !== id);
      get().syncToCloud(newList, state.toRemember);
      return { toDoList: newList, selectedTaskIds: newSelection };
    });
  }
}));
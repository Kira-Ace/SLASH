import axios from 'axios';
import { startOfDay, parse, addMinutes, isValid, format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const openGoogleCalendar = () => {
  window.open('https://calendar.google.com', '_blank');
};

// Returns object with status
export const createCalendarEvent = async (
  accessToken: string, 
  eventDetails: { 
      title: string; 
      description?: string; 
      startTime?: string; 
      endTime?: string; 
      isAllDay?: boolean; 
      date?: Date; // <--- NEW PARAMETER
  }
): Promise<{ success: boolean; status?: number }> => {
  
  let eventBody: any = {};
  
  // Use the passed date, or default to today if missing
  const referenceDate = eventDetails.date || new Date();

  // 1. ALL DAY EVENT
  if (eventDetails.isAllDay) {
      eventBody = {
          summary: eventDetails.title,
          description: eventDetails.description,
          // Use referenceDate instead of 'today'
          start: { date: format(referenceDate, 'yyyy-MM-dd') },
          end: { date: format(addDays(referenceDate, 1), 'yyyy-MM-dd') }, 
      };
  } 
  // 2. TIMED EVENT
  else {
      const startStr = eventDetails.startTime || format(new Date(), 'h:mm a'); 
      const endStr = eventDetails.endTime || format(addMinutes(new Date(), 60), 'h:mm a');

      // Parse time relative to the SELECTED DATE, not today
      let startDateTime = parse(startStr, 'h:mm aa', referenceDate);
      if (!isValid(startDateTime)) startDateTime = parse(startStr, 'h:mm', referenceDate); 
      
      let endDateTime = parse(endStr, 'h:mm aa', referenceDate);
      if (!isValid(endDateTime)) endDateTime = parse(endStr, 'h:mm', referenceDate); 

      // Fallback
      if (!isValid(startDateTime)) startDateTime = referenceDate;
      if (!isValid(endDateTime)) endDateTime = addMinutes(startDateTime, 60);

      eventBody = {
          summary: eventDetails.title,
          description: eventDetails.description,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
      };
  }

  try {
    await axios.post(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      eventBody,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return { success: true, status: 200 };
  } catch (error: any) {
    return { success: false, status: error.response?.status };
  }
};

export const listUpcomingEvents = async (accessToken: string) => {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          timeMin: startOfDay(new Date()).toISOString(),
          showDeleted: false,
          singleEvents: true,
          maxResults: 20,
          orderBy: 'startTime',
        },
      }
    );
    return { events: response.data.items, error: null };
  } catch (error: any) {
    return { events: [], error: error.response?.status };
  }
};
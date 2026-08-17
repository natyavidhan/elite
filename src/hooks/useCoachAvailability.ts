import { useEffect, useState } from 'react';
import { getCoachAvailability, subscribeCoachAvailability, type CoachAvailability } from '@/db/coach';

export function useCoachAvailability(): CoachAvailability {
  const [availability, setAvailability] = useState<CoachAvailability>(getCoachAvailability());
  useEffect(() => subscribeCoachAvailability(setAvailability), []);
  return availability;
}

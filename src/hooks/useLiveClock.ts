import { useEffect, useMemo, useState } from "react";

type LiveClock = {
  dateLabel: string;
  timeLabel: string;
  timeValue: string;
};

function buildClock(now: Date): LiveClock {
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(now);
  const timeValue = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
  const timeZone = new Intl.DateTimeFormat("en-GB", {
    timeZoneName: "short"
  })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")?.value;

  return {
    dateLabel,
    timeValue,
    timeLabel: timeZone ? `${timeValue} ${timeZone}` : timeValue
  };
}

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => buildClock(now), [now]);
}

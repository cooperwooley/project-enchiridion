import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RELATIONSHIP_START } from "../config/constants";

function calculateTimeSince(start) {
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days, hours, minutes, seconds };
}

function TimerUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl sm:text-5xl md:text-6xl font-bold text-rose-500 tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs sm:text-sm text-rose-400/80 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}

export default function RelationshipTimer() {
  const [time, setTime] = useState(() => calculateTimeSince(RELATIONSHIP_START));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculateTimeSince(RELATIONSHIP_START));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center py-10 sm:py-16 px-4"
    >
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-rose-600 mb-2 italic">
        Every second with you
      </h1>
      <p className="text-rose-400 text-sm sm:text-base mb-8">
        Since October 7, 2025
      </p>

      <div className="flex justify-center gap-3 sm:gap-5 md:gap-8 flex-wrap">
        {time.years > 0 && <TimerUnit value={time.years} label="Years" />}
        <TimerUnit value={time.months} label="Months" />
        <TimerUnit value={time.days} label="Days" />
        <TimerUnit value={time.hours} label="Hours" />
        <TimerUnit value={time.minutes} label="Mins" />
        <TimerUnit value={time.seconds} label="Secs" />
      </div>

      <motion.div
        className="mt-8 flex justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {["♥", "♥", "♥"].map((heart, i) => (
          <motion.span
            key={i}
            className="text-rose-300 text-lg"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            {heart}
          </motion.span>
        ))}
      </motion.div>
    </motion.section>
  );
}

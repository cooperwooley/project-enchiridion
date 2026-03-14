import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SURPRISE_START, SURPRISE_END } from "../config/constants";

function FloatingHeart({ delay, x }) {
  return (
    <motion.span
      className="absolute text-rose-300 text-2xl pointer-events-none select-none"
      initial={{ opacity: 0, y: 0, x }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -120, -240, -360],
        x: [x, x + 20, x - 10, x + 15],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeOut",
      }}
    >
      ♥
    </motion.span>
  );
}

function GiftBox({ onUnwrap }) {
  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer"
      onClick={onUnwrap}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Lid */}
      <motion.div
        className="relative z-10"
        initial={{ y: 0, rotate: 0 }}
        whileHover={{ y: -8, rotate: -2 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="w-52 h-14 sm:w-64 sm:h-16 bg-rose-400 rounded-t-xl relative shadow-lg">
          {/* Ribbon on lid */}
          <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center">
            <div className="w-6 bg-rose-300/50 h-full" />
          </div>
          {/* Bow */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-0">
            <div className="w-8 h-8 bg-rose-300 rounded-full -mr-1" />
            <div className="w-8 h-8 bg-rose-300 rounded-full -ml-1" />
          </div>
        </div>
      </motion.div>

      {/* Box body */}
      <div className="w-48 h-40 sm:w-60 sm:h-48 bg-rose-500 rounded-b-xl relative shadow-xl -mt-1">
        {/* Vertical ribbon */}
        <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center">
          <div className="w-6 bg-rose-400/50 h-full" />
        </div>
        {/* Horizontal ribbon */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-6 bg-rose-400/50" />
        </div>
      </div>
    </motion.div>
  );
}

export default function UnwrapSurprise({ onComplete }) {
  const [isInWindow, setIsInWindow] = useState(false);
  const [unwrapped, setUnwrapped] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const alreadyUnwrapped = sessionStorage.getItem("gift-unwrapped");
    if (alreadyUnwrapped) {
      onComplete();
      return;
    }

    const now = new Date();
    if (now >= SURPRISE_START && now < SURPRISE_END) {
      setIsInWindow(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  function handleUnwrap() {
    setUnwrapped(true);
    sessionStorage.setItem("gift-unwrapped", "true");
    setTimeout(() => {
      setShowContent(true);
      setTimeout(onComplete, 800);
    }, 1500);
  }

  if (!isInWindow) return null;

  return (
    <AnimatePresence>
      {!showContent && (
        <motion.div
          key="surprise"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center
                     bg-gradient-to-b from-rose-100 via-blush-50 to-cream"
        >
          {/* Floating hearts background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <FloatingHeart
                key={i}
                delay={i * 0.6}
                x={Math.random() * 300 - 150}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!unwrapped ? (
              <motion.div
                key="gift"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{
                  scale: 1.5,
                  opacity: 0,
                  rotate: 10,
                }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <motion.h2
                  className="font-display text-2xl sm:text-3xl text-rose-600 mb-8 italic text-center px-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  You have a surprise!
                </motion.h2>

                <GiftBox onUnwrap={handleUnwrap} />

                <motion.p
                  className="text-rose-400 text-sm mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ delay: 1, duration: 2, repeat: Infinity }}
                >
                  Tap to unwrap
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center px-4"
              >
                <motion.div
                  className="text-6xl sm:text-8xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  💝
                </motion.div>
                <h2 className="font-display text-3xl sm:text-4xl text-rose-600 italic">
                  Happy 6 Months!
                </h2>
                <p className="text-rose-400 mt-3 text-lg">
                  Here's our story so far...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

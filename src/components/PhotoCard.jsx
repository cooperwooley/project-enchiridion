import { useState } from "react";
import { motion } from "framer-motion";

function formatDate(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PhotoCard({ photo, index }) {
  const [showCaption, setShowCaption] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
      className="relative mb-4 break-inside-avoid group cursor-pointer"
      onClick={() => setShowCaption((prev) => !prev)}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative overflow-hidden rounded-2xl shadow-md shadow-rose-200/50"
      >
        <img
          src={photo.url}
          alt={photo.caption || "Our memory"}
          loading="lazy"
          className="w-full h-auto block"
        />

        {/* Hover / tap overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: showCaption ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-rose-900/70 via-rose-900/20 to-transparent
                     flex flex-col justify-end p-4 transition-opacity
                     group-hover:opacity-100"
        >
          {photo.caption && (
            <p className="text-white font-body text-sm sm:text-base leading-relaxed">
              {photo.caption}
            </p>
          )}
          {photo.date && (
            <p className="text-rose-200 text-xs mt-1">
              {formatDate(photo.date)}
            </p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

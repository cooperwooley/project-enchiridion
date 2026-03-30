import { motion } from "framer-motion";

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PhotoCard({
  photo,
  index,
  colSpan,
  rowSpan,
  isExpanded,
  onSelect,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
      className="relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl shadow-md shadow-rose-200/40"
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      onClick={onSelect}
    >
      <motion.img
        layout
        src={photo.url}
        alt={photo.caption || "Our memory"}
        loading="lazy"
        className={`w-full h-full ${isExpanded ? "object-contain bg-black/5" : "object-cover"}`}
      />

      {/* Caption overlay — shows when expanded */}
      <motion.div
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-transparent to-transparent
                   flex flex-col justify-end p-2.5 sm:p-4 pointer-events-none"
      >
        {photo.caption && (
          <p className="text-white text-xs sm:text-sm leading-snug line-clamp-3">
            {photo.caption}
          </p>
        )}
        {photo.date && (
          <p className="text-rose-200 text-[10px] sm:text-xs mt-0.5">
            {formatDate(photo.date)}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

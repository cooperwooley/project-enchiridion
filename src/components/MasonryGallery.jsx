import { useState } from "react";
import { motion } from "framer-motion";
import { usePhotos } from "../hooks/usePhotos";
import PhotoCard from "./PhotoCard";

// Assign each photo a span pattern to create a varied collage feel.
// Pattern cycles so it always looks interesting regardless of photo count.
// Spans are [colSpan, rowSpan] on mobile's 3-column grid.
const SPAN_PATTERNS = [
  [2, 2], // large
  [1, 1], // small
  [1, 2], // tall
  [1, 1], // small
  [1, 1], // small
  [2, 1], // wide
  [1, 1], // small
  [1, 2], // tall
  [1, 1], // small
  [2, 1], // wide
  [1, 1], // small
  [1, 1], // small
];

function getSpan(index) {
  const pattern = SPAN_PATTERNS[index % SPAN_PATTERNS.length];
  return { col: pattern[0], row: pattern[1] };
}

export default function MasonryGallery() {
  const { photos, loading } = usePhotos();
  const [expandedId, setExpandedId] = useState(null);

  function handleSelect(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <motion.div
          className="w-8 h-8 border-3 border-rose-300 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-rose-400 font-display text-xl italic">
          Our story is just beginning...
        </p>
        <p className="text-rose-300 text-sm mt-2">
          Photos will appear here as memories are added.
        </p>
      </div>
    );
  }

  return (
    <section className="px-2 sm:px-6 md:px-12 pb-16 max-w-7xl mx-auto">
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-display text-2xl sm:text-3xl text-rose-500 text-center mb-8 italic"
      >
        Our Timeline
      </motion.h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 auto-rows-[100px] sm:auto-rows-[120px] lg:auto-rows-[140px] gap-1.5 sm:gap-2">
        {photos.map((photo, index) => {
          const span = getSpan(index);
          const isExpanded = expandedId === photo.id;

          return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              colSpan={isExpanded ? 2 : span.col}
              rowSpan={isExpanded ? 2 : span.row}
              isExpanded={isExpanded}
              onSelect={() => handleSelect(photo.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { usePhotos } from "../hooks/usePhotos";
import PhotoCard from "./PhotoCard";

export default function MasonryGallery() {
  const { photos, loading } = usePhotos();

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
    <section className="px-4 sm:px-8 md:px-12 pb-16 max-w-7xl mx-auto">
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-display text-2xl sm:text-3xl text-rose-500 text-center mb-10 italic"
      >
        Our Timeline
      </motion.h2>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {photos.map((photo, index) => (
          <PhotoCard key={photo.id} photo={photo} index={index} />
        ))}
      </div>
    </section>
  );
}

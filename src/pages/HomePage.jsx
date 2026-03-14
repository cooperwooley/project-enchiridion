import { useState, useCallback } from "react";
import RelationshipTimer from "../components/RelationshipTimer";
import MasonryGallery from "../components/MasonryGallery";
import UnwrapSurprise from "../components/UnwrapSurprise";

export default function HomePage() {
  const [surpriseDone, setSurpriseDone] = useState(false);

  const handleSurpriseComplete = useCallback(() => {
    setSurpriseDone(true);
  }, []);

  return (
    <>
      <UnwrapSurprise onComplete={handleSurpriseComplete} />

      {surpriseDone && (
        <main className="min-h-screen">
          <RelationshipTimer />

          <div className="w-24 h-px bg-rose-200 mx-auto mb-8" />

          <MasonryGallery />

          <footer className="text-center py-10 text-rose-300 text-sm">
            <p className="font-display italic">Made with love</p>
          </footer>
        </main>
      )}
    </>
  );
}

import { useState, useRef, useCallback } from "react";
import exifr from "exifr";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { usePhotos } from "../hooks/usePhotos";
import ProtectedRoute from "../components/ProtectedRoute";

/* ─── Login Form ─── */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-8"
      >
        <h1 className="font-display text-2xl text-rose-500 text-center mb-6 italic">
          Admin Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}

        <label className="block mb-4">
          <span className="text-sm text-rose-400">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                       focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-rose-400">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                       focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-rose-400 text-white rounded-xl hover:bg-rose-500
                     transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </motion.form>
    </div>
  );
}

/* ─── Upload a single file (compress, store, insert) ─── */
async function uploadSingleFile(file, exifMeta) {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 1,
    useWebWorker: true,
    exifOrientation: true,
  });

  const fileName = `${Date.now()}_${file.name}`;
  const storagePath = `photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(fileName, compressed);
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("photos").getPublicUrl(fileName);

  const { data, error: insertError } = await supabase
    .from("photos")
    .insert({
      url: publicUrl,
      caption: "",
      date: exifMeta?.date ? new Date(exifMeta.date).toISOString() : null,
      file_name: fileName,
      storage_path: storagePath,
      latitude: exifMeta?.latitude ?? null,
      longitude: exifMeta?.longitude ?? null,
      camera: exifMeta?.camera ?? null,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  return data;
}

/* ─── Extract EXIF from a file ─── */
async function extractExif(file) {
  try {
    const exif = await exifr.parse(file, [
      "DateTimeOriginal",
      "CreateDate",
      "latitude",
      "longitude",
      "Make",
      "Model",
    ]);
    if (!exif) return null;
    const exifDate = exif.DateTimeOriginal || exif.CreateDate;
    return {
      date: exifDate ? new Date(exifDate) : null,
      latitude: exif.latitude ?? null,
      longitude: exif.longitude ?? null,
      camera: [exif.Make, exif.Model].filter(Boolean).join(" ") || null,
    };
  } catch {
    return null;
  }
}

/* ─── Review Queue (post-upload caption/date editing) ─── */
function ReviewQueue({ queue, onComplete }) {
  const [index, setIndex] = useState(0);
  const [caption, setCaption] = useState(queue[0]?.caption || "");
  const [date, setDate] = useState(
    queue[0]?.date ? new Date(queue[0].date).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  const current = queue[index];
  if (!current) return null;

  const hasNoDate = !current.date && !date;
  const isLast = index === queue.length - 1;

  function goNext() {
    if (isLast) {
      onComplete();
      return;
    }
    const next = queue[index + 1];
    setIndex(index + 1);
    setCaption(next?.caption || "");
    setDate(
      next?.date ? new Date(next.date).toISOString().slice(0, 16) : ""
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = {};
      if (caption) updates.caption = caption;
      if (date) updates.date = new Date(date).toISOString();
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("photos")
          .update(updates)
          .eq("id", current.id);
        if (error) throw error;
      }
      goNext();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-rose-500 italic">
          Review Uploads
        </h3>
        <span className="text-sm text-rose-400">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="flex justify-center mb-4">
        <img
          src={current.url}
          alt=""
          className={`max-h-52 rounded-xl object-cover border-2 ${
            hasNoDate ? "border-amber-300" : "border-rose-100"
          }`}
        />
      </div>

      {hasNoDate && (
        <p className="text-amber-600 text-xs text-center mb-3 bg-amber-50 py-1.5 px-3 rounded-lg">
          No date found — please add one
        </p>
      )}

      <label className="block mb-3">
        <span className="text-sm text-rose-400">Date & Time</span>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`mt-1 w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80 ${
            hasNoDate ? "border-amber-300" : "border-rose-200"
          }`}
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-rose-400">Love Note / Caption</span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          placeholder="Write something sweet..."
          className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                     focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80 resize-none"
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-rose-400 text-white rounded-xl hover:bg-rose-500
                     transition-colors disabled:opacity-50 font-medium text-sm"
        >
          {saving ? "Saving..." : isLast ? "Save & Finish" : "Save & Next"}
        </button>
        <button
          onClick={goNext}
          disabled={saving}
          className="px-4 py-2.5 text-rose-400 hover:text-rose-600 transition-colors
                     text-sm font-medium"
        >
          {isLast ? "Finish" : "Skip"}
        </button>
      </div>

      <button
        onClick={onComplete}
        className="w-full mt-2 text-xs text-rose-300 hover:text-rose-400 transition-colors py-1"
      >
        Done reviewing
      </button>
    </motion.div>
  );
}

/* ─── Multi-Upload Form ─── */
function MultiUploadForm({ onUploaded }) {
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (fileList) => {
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    // Build queue entries with EXIF data
    const entries = await Promise.all(
      imageFiles.map(async (file, i) => {
        const exif = await extractExif(file);
        return {
          id: Date.now() + i,
          file,
          preview: URL.createObjectURL(file),
          exifMeta: exif,
          status: "pending",
          dbRecord: null,
        };
      })
    );

    setQueue(entries);
    setReviewQueue([]);

    // Start uploading sequentially
    setUploading(true);
    const uploaded = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      setQueue((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "uploading" } : e
        )
      );

      try {
        const dbRecord = await uploadSingleFile(entry.file, entry.exifMeta);
        uploaded.push(dbRecord);
        setQueue((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "done", dbRecord } : e
          )
        );
      } catch (err) {
        console.error(`Upload failed for ${entry.file.name}:`, err);
        setQueue((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "error" } : e
          )
        );
      }
    }

    // Cleanup blob URLs
    entries.forEach((e) => URL.revokeObjectURL(e.preview));

    setUploading(false);

    if (uploaded.length > 0) {
      onUploaded?.();
      setReviewQueue(uploaded);
    }
  }, [onUploaded]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function handleReviewComplete() {
    setReviewQueue([]);
    setQueue([]);
    onUploaded?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const statusIcon = (status) => {
    switch (status) {
      case "uploading":
        return (
          <span className="inline-block w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
        );
      case "done":
        return <span className="text-emerald-500 text-sm font-bold">&#10003;</span>;
      case "error":
        return <span className="text-red-500 text-sm font-bold">&#10007;</span>;
      default:
        return <span className="w-2 h-2 bg-rose-200 rounded-full inline-block" />;
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-6 mb-8">
      <h2 className="font-display text-xl text-rose-500 mb-4 italic">
        Add Memories
      </h2>

      {/* Drop zone */}
      {reviewQueue.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-4
            ${uploading ? "cursor-default" : "cursor-pointer"}
            ${dragOver ? "border-rose-400 bg-rose-50" : "border-rose-200 hover:border-rose-300"}`}
        >
          {queue.length === 0 ? (
            <div>
              <p className="text-rose-400 text-lg mb-1">Drop photos here</p>
              <p className="text-rose-300 text-sm">or click to browse (multiple allowed)</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {queue.map((entry) => (
                <div key={entry.id} className="relative">
                  <img
                    src={entry.dbRecord?.url || entry.preview}
                    alt=""
                    className={`w-full aspect-square object-cover rounded-lg ${
                      entry.status === "error"
                        ? "ring-2 ring-red-300 opacity-60"
                        : entry.status === "done"
                        ? "ring-2 ring-emerald-200"
                        : ""
                    }`}
                  />
                  <span className="absolute top-1 right-1 bg-white/80 rounded-full w-5 h-5 flex items-center justify-center">
                    {statusIcon(entry.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
        </div>
      )}

      {/* Upload progress text */}
      {uploading && (
        <p className="text-sm text-rose-400 text-center mb-2">
          Uploading {queue.filter((e) => e.status === "done").length} /{" "}
          {queue.length}...
        </p>
      )}

      {/* Review Queue */}
      {!uploading && reviewQueue.length > 0 && (
        <ReviewQueue queue={reviewQueue} onComplete={handleReviewComplete} />
      )}
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditModal({ photo, onSave, onClose }) {
  const [caption, setCaption] = useState(photo.caption || "");
  const [date, setDate] = useState(
    photo.date ? new Date(photo.date).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("photos")
        .update({
          caption,
          date: date ? new Date(date).toISOString() : null,
        })
        .eq("id", photo.id);
      if (error) throw error;
      onSave();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-6"
      >
        <h3 className="font-display text-lg text-rose-500 mb-4 italic">
          Edit Memory
        </h3>

        <div className="flex justify-center mb-4">
          <img
            src={photo.url}
            alt=""
            className="max-h-52 rounded-xl object-cover"
          />
        </div>

        <label className="block mb-3">
          <span className="text-sm text-rose-400">Date & Time</span>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                       focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-rose-400">Love Note / Caption</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Write something sweet..."
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                       focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80 resize-none"
          />
        </label>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-rose-400 text-white rounded-xl hover:bg-rose-500
                       transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-rose-400 hover:text-rose-600 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Photo List (manage existing) ─── */
function PhotoList({ photos, loading, onChanged }) {
  const [deleting, setDeleting] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);

  async function handleDelete(photo) {
    if (!confirm("Delete this memory?")) return;

    setDeleting(photo.id);
    try {
      if (photo.file_name) {
        await supabase.storage.from("photos").remove([photo.file_name]);
      }
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);
      if (error) throw error;
      onChanged?.();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return null;
  if (photos.length === 0) return null;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-6">
      <h2 className="font-display text-xl text-rose-500 mb-4 italic">
        Our Memories ({photos.length})
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -100 }}
              onClick={() => setEditingPhoto(photo)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/50 transition-colors cursor-pointer"
            >
              <img
                src={photo.url}
                alt=""
                className="w-14 h-14 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-rose-700 truncate">
                  {photo.caption || "No caption"}
                </p>
                <p className="text-xs text-rose-300">
                  {photo.date
                    ? new Date(photo.date).toLocaleDateString()
                    : "No date"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo);
                }}
                disabled={deleting === photo.id}
                className="text-rose-300 hover:text-red-500 transition-colors p-2 shrink-0
                           disabled:opacity-50"
                title="Delete"
              >
                {deleting === photo.id ? "..." : "✕"}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPhoto && (
          <EditModal
            key={editingPhoto.id}
            photo={editingPhoto}
            onSave={() => {
              setEditingPhoto(null);
              onChanged?.();
            }}
            onClose={() => setEditingPhoto(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Admin Page ─── */
export default function AdminPage() {
  return (
    <ProtectedRoute fallback={<LoginForm />}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { photos, loading, refetch } = usePhotos();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="font-display text-2xl text-rose-500 italic hover:text-rose-600 transition-colors">
            Our Scrapbook
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-rose-400 hover:text-rose-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <MultiUploadForm onUploaded={refetch} />
        <PhotoList photos={photos} loading={loading} onChanged={refetch} />
      </div>
    </div>
  );
}

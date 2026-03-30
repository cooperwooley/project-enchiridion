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

/* ─── Upload Form ─── */
function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Store extracted EXIF metadata to save to DB (stripped from image on upload)
  const exifRef = useRef(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    exifRef.current = null;

    // Extract all useful EXIF data before compression strips it
    try {
      const exif = await exifr.parse(selectedFile, [
        "DateTimeOriginal",
        "CreateDate",
        "latitude",
        "longitude",
        "Make",
        "Model",
      ]);
      if (exif) {
        exifRef.current = {
          latitude: exif.latitude ?? null,
          longitude: exif.longitude ?? null,
          camera: [exif.Make, exif.Model].filter(Boolean).join(" ") || null,
        };

        const exifDate = exif.DateTimeOriginal || exif.CreateDate;
        if (exifDate) {
          const d = new Date(exifDate);
          setDate(d.toISOString().slice(0, 16));
        }
      }
    } catch {
      // EXIF extraction failed — user can set date manually
    }
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // Compress + strip metadata (max 1200px, under 1MB, EXIF removed)
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 1,
        useWebWorker: true,
        exifOrientation: true,  // fix rotation before stripping
      });

      // Upload compressed image to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, compressed);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName);

      // Save to Supabase database (metadata extracted before stripping)
      const meta = exifRef.current;
      const { error: insertError } = await supabase.from("photos").insert({
        url: publicUrl,
        caption,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        file_name: fileName,
        storage_path: storagePath,
        latitude: meta?.latitude,
        longitude: meta?.longitude,
        camera: meta?.camera,
      });
      if (insertError) throw insertError;

      // Refresh photo list immediately
      onUploaded?.();

      // Reset form
      setFile(null);
      setPreview(null);
      setCaption("");
      setDate("");
      exifRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleUpload}
      className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 p-6 mb-8"
    >
      <h2 className="font-display text-xl text-rose-500 mb-4 italic">
        Add a Memory
      </h2>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4
          ${dragOver ? "border-rose-400 bg-rose-50" : "border-rose-200 hover:border-rose-300"}`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 mx-auto rounded-lg"
          />
        ) : (
          <div>
            <p className="text-rose-400 text-lg mb-1">Drop a photo here</p>
            <p className="text-rose-300 text-sm">or click to browse</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Date input */}
      <label className="block mb-4">
        <span className="text-sm text-rose-400">Date & Time</span>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full px-4 py-2.5 rounded-xl border border-rose-200
                     focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80"
        />
        <span className="text-xs text-rose-300 mt-1 block">
          Auto-filled from photo EXIF data when available
        </span>
      </label>

      {/* Caption */}
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

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full py-3 bg-rose-400 text-white rounded-xl hover:bg-rose-500
                   transition-colors disabled:opacity-50 font-medium"
      >
        {uploading ? "Uploading..." : "Upload Memory"}
      </button>
    </form>
  );
}

/* ─── Photo List (manage existing) ─── */
function PhotoList({ photos, loading, onChanged }) {
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(photo) {
    if (!confirm("Delete this memory?")) return;

    setDeleting(photo.id);
    try {
      // Delete from Storage
      if (photo.file_name) {
        await supabase.storage.from("photos").remove([photo.file_name]);
      }
      // Delete from database
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
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/50 transition-colors"
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
                onClick={() => handleDelete(photo)}
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

        <UploadForm onUploaded={refetch} />
        <PhotoList photos={photos} loading={loading} onChanged={refetch} />
      </div>
    </div>
  );
}

// src/pages/profile.jsx
import { useAuth } from "../context/AuthContext";
import { useState, useRef } from "react";
import { FiEdit2, FiCheck, FiX, FiUpload } from "react-icons/fi";

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || "");
  const fileInputRef = useRef();

  if (!user) {
    return (
      <div className="flex flex-col items-center mt-16">
        <h2 className="text-2xl font-black bg-gradient-to-tr from-fuchsia-600 to-blue-600 bg-clip-text text-transparent drop-shadow mb-2">
          Please login first to view your profile
        </h2>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile({ displayName, photoFile });
      setSuccess("Profile updated!");
      setPhotoFile(null);
      setEditing(false);
    } catch (err) {
      setError("Failed to update profile.");
    }
    setLoading(false);
  };

  const handlePhotoChange = e => {
    if (!e.target.files || !e.target.files[0]) return;
    setPhotoFile(e.target.files[0]);
    setPhotoPreview(URL.createObjectURL(e.target.files[0]));
  };

  const avatarLetter =
    (displayName && displayName[0]) ||
    (user.email && user.email[0]) ||
    "U";

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-fuchsia-50 to-white dark:from-[#121826] dark:via-[#232946] dark:to-[#121826] transition-colors">
      <div className="w-full max-w-md rounded-3xl shadow-2xl bg-white/95 dark:bg-gray-900/95 border border-fuchsia-100 dark:border-gray-700 px-8 py-10 flex flex-col items-center gap-6 backdrop-blur-lg transition-all">
        <div className="relative group mb-1">
          {/* Beautiful avatar: photo or first letter bubble */}
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={displayName || "Profile"}
              className="w-28 h-28 rounded-full border-4 border-fuchsia-300 dark:border-fuchsia-500 shadow object-cover bg-gray-200 dark:bg-gray-800 transition-all"
              onError={e => { setPhotoPreview(""); }}
            />
          ) : (
            <div
              className="w-28 h-28 rounded-full border-4 border-fuchsia-300 dark:border-fuchsia-500 bg-gradient-to-br from-blue-400 via-fuchsia-400 to-pink-500 flex items-center justify-center shadow text-white font-extrabold text-6xl select-none"
              style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
            >
              {avatarLetter.toUpperCase()}
            </div>
          )}
          {editing && (
            <>
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-1 right-1 bg-fuchsia-500 text-white p-2 border-2 border-white rounded-full shadow-lg hover:bg-fuchsia-600 focus:outline-none transition"
                title="Upload new photo"
              >
                <FiUpload />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                hidden
                onChange={handlePhotoChange}
              />
            </>
          )}
        </div>
        <div className="w-full flex flex-col gap-1 items-center">
          <label className="font-bold text-lg mb-0 text-gray-700 dark:text-gray-200">
            Username
          </label>
          {editing ? (
            <div className="flex gap-2 w-full items-center justify-center">
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="px-4 py-2 border-2 border-fuchsia-400 dark:border-fuchsia-500 rounded-2xl focus:border-fuchsia-400 focus:dark:border-fuchsia-500 outline-none w-3/4 font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200"
                disabled={loading}
              />
              <button
                onClick={handleSave}
                disabled={loading}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center"
                title="Save"
              >
                <FiCheck />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDisplayName(user.displayName);
                  setPhotoFile(null);
                  setPhotoPreview(user.photoURL);
                }}
                className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center"
                title="Cancel"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <div className="font-semibold text-xl flex items-center gap-3">
              <span className="text-gray-900 dark:text-gray-100">{user.displayName || "User"}</span>
              <button
                className="text-fuchsia-500 hover:text-blue-600 ml-1 p-1"
                onClick={() => setEditing(true)}
                title="Edit Profile"
              >
                <FiEdit2 size={20} />
              </button>
            </div>
          )}
        </div>
        <div className="w-full flex flex-col items-center">
          <label className="font-bold text-lg mb-1 text-gray-700 dark:text-gray-200">Email</label>
          <div className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl font-mono w-full text-center text-base transition-all">
            {user.email}
          </div>
        </div>
        {success && <div className="text-green-600 dark:text-green-400 font-medium">{success}</div>}
        {error && <div className="text-red-600 dark:text-red-400 font-medium">{error}</div>}
        <button
          onClick={logout}
          className="mt-4 w-40 py-2 font-semibold rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-500 text-white shadow-md hover:scale-105 hover:shadow-xl transition-all text-lg"
        >
          Logout
        </button>
      </div>
    </section>
  );
}

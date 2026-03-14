// src/components/PostForm.jsx
import { useState } from "react";
import { FaHeading, FaPenFancy, FaImages, FaTimes } from "react-icons/fa";

export default function PostForm({ initialData = {}, onSubmit, loading }) {
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(initialData.images || []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreviews.length > 5) {
      alert("You can upload maximum 5 images");
      return;
    }

    // Add new images
    setImages(prev => [...prev, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, images });
  };

  return (
    <form
      className="
        bg-white/60 dark:bg-gray-900/80
        backdrop-blur-lg border border-fuchsia-200 dark:border-blue-900
        shadow-2xl rounded-3xl px-8 py-10 flex flex-col gap-7 w-full max-w-2xl mx-auto
        animate-fade-in
      "
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="text-3xl text-center font-extrabold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent drop-shadow">
        {initialData.title ? "Edit your Post ✏️" : "Create a New Post 📝"}
      </div>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div className="relative">
          <FaHeading className="absolute left-3 top-3 text-blue-400 text-lg pointer-events-none" />
          <input
            type="text"
            className="
              w-full pl-10 pr-3 py-3 rounded-xl text-lg
              bg-gray-100 dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-400
              font-semibold placeholder-gray-400 dark:placeholder-gray-500
              shadow
              transition
            "
            placeholder="Post Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={120}
            disabled={loading}
          />
        </div>
        
        {/* Content */}
        <div className="relative">
          <FaPenFancy className="absolute left-3 top-3 text-fuchsia-400 text-lg pointer-events-none" />
          <textarea
            className="
              w-full pl-10 pr-3 py-3 min-h-[120px] rounded-xl text-base
              bg-gray-100 dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              focus:outline-none focus:ring-2 focus:ring-pink-400
              font-medium placeholder-gray-400 dark:placeholder-gray-500
              shadow
              transition resize-y
            "
            placeholder="Write your brilliant thoughts..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            maxLength={4000}
            disabled={loading}
          />
        </div>

        {/* Image Upload Section */}
        <div className="relative">
          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-base font-semibold cursor-pointer
            bg-gradient-to-r from-purple-100 to-blue-100 dark:from-gray-700 dark:to-gray-800
            border-2 border-dashed border-purple-300 dark:border-blue-600
            hover:border-purple-500 dark:hover:border-blue-400
            text-purple-600 dark:text-blue-300
            transition-all
            shadow
          ">
            <FaImages className="text-xl" />
            <span>Add Images (Max 5)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={loading || imagePreviews.length >= 5}
            />
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md border-2 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  disabled={loading}
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        className={`
          mt-2 w-full py-3 rounded-xl font-bold text-lg shadow-xl
          bg-gradient-to-tr from-fuchsia-500 via-blue-500 to-cyan-400
          text-white
          hover:from-fuchsia-600 hover:to-blue-600
          active:scale-95
          transition-all
          ${loading ? "opacity-60" : ""}
        `}
        disabled={loading}
      >
        {loading ? "Submitting..." : (initialData.title ? "Save Changes" : "Create Post")}
      </button>
    </form>
  );
}

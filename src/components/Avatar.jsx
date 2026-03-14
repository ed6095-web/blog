// src/components/Avatar.jsx
import { useState } from "react";

export default function Avatar({ url, name, size = 44 }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name && name[0]) || "U";

  return url && !imgError ? (
    <img
      src={url}
      alt={name || "Profile"}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: size / 2,
      }}
      className="object-cover rounded-full border-2 border-blue-500 dark:border-fuchsia-400 bg-white"
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: size / 2,
      }}
      className="rounded-full bg-gradient-to-br from-blue-400 via-fuchsia-400 to-pink-500 flex items-center justify-center font-extrabold text-white select-none border-2 border-blue-500 dark:border-fuchsia-400"
    >
      {letter.toUpperCase()}
    </div>
  );
}

// src/components/Avatar.jsx
import { useState } from "react";

export default function Avatar({ url, name, size = 44, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name && name[0]) || "U";

  const baseStyles = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    fontSize: size / 2.5,
  };

  return url && !imgError ? (
    <img
      src={url}
      alt={name || "Profile"}
      style={baseStyles}
      className={`object-cover rounded-full flex-shrink-0 border-2 border-wavvy-primary/20 bg-white ${className}`}
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      style={baseStyles}
      className={`rounded-full bg-wavvy-gradient flex items-center justify-center font-extrabold text-white select-none border-2 border-white/10 ${className}`}
    >
      {letter.toUpperCase()}
    </div>
  );
}

// src/utils/formatDate.js

export default function formatDate(timestamp) {
  if (!timestamp) return "";
  // If Firebase Timestamp object, convert to JS Date
  let dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return dateObj.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

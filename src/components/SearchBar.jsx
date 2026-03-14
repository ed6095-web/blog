// src/components/SearchBar.jsx
import React, { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim() !== "") onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl mx-auto my-4 sm:my-0">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search blogs or writers..."
        className="flex-1 px-4 py-2 text-base rounded-l-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        style={{ minWidth: 0 }}
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-pink-400 to-blue-500 text-white px-6 py-2 rounded-r-full hover:from-pink-500 hover:to-blue-600 transition font-semibold text-base"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;

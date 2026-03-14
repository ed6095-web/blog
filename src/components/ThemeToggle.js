import { useEffect } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import useTheme from "../hooks/useTheme";

export default function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    document.body.classList.add("transition-colors", "duration-300", "ease-in-out");
  }, []);

  // All className in a single string, no line breaks!
  const btnClass =
    "rounded-full p-3 focus:outline-none border-2 border-transparent bg-gradient-to-br from-blue-50 to-pink-100 dark:from-blue-900 dark:to-gray-900 hover:border-blue-400 dark:hover:border-pink-400 shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center";

  return (
    <button
      type="button"
      aria-label="Toggle dark and light mode"
      onClick={toggleTheme}
      title="Toggle theme"
      className={btnClass}
    >
      {theme === "dark" ? (
        <FaSun style={{ color: "#facc15", filter: "drop-shadow(0 0 12px #facc15)" }} />
      ) : (
        <FaMoon style={{ color: "#60a5fa", filter: "drop-shadow(0 0 12px #60a5fa)" }} />
      )}
    </button>
  );
}

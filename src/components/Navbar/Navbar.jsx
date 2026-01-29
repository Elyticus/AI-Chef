import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

// Custom hook for theme management
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage or default to 'light'
    if (typeof window !== "undefined") {
      return localStorage.getItem("recipeTheme") || "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("recipeTheme", newTheme);
      }
      return newTheme;
    });
  };

  useEffect(() => {
    // Apply theme to body element
    document.body.className = theme;
  }, [theme]);

  return { theme, toggleTheme };
};

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h1 className="navbar-title">
            <span className="navbar-icon">
              <FontAwesomeIcon icon={faUtensils} />
            </span>
            Kitz Chef
          </h1>
          <p className="navbar-subtitle">
            Turn your ingredients into delicious recipes!
          </p>
        </div>

        <div className="navbar-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn-navbar"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
            <span className="theme-text-navbar">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

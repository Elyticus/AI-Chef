import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCookieBite,
  faTimes,
  faTrash,
  faBookmark,
  faTrashAlt,
  faEye,
  faMessage,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../Navbar/Navbar";
import Recipe from "../../components/Recipe/Recipe";

// Helper function to get recipe preview - just first few words
const getRecipePreview = (recipeText) => {
  if (!recipeText) return "No preview available";

  // Remove markdown and get clean text
  const plainText = recipeText
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*|__/g, "")
    .replace(/`/g, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  // Get first 5-7 words for preview
  const words = plainText.split(/\s+/);
  if (words.length <= 6) return plainText;
  return words.slice(0, 6).join(" ") + "...";
};

// Helper to format date and time
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  // If within 24 hours, show time
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  // If within 7 days, show day and time
  if (diffInHours < 168) {
    return `${date.toLocaleDateString([], { weekday: "short" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  // Otherwise show date
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// Helper to get detailed date info
const getDetailedDateInfo = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fullDateTime: date.toLocaleString(),
    relativeTime: formatDateTime(dateString),
  };
};

export default function Main() {
  // State declarations
  const [input, setInput] = useState("");
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const recipeSectionRef = useRef(null);

  // Load saved recipes and sidebar state from localStorage on mount
  useEffect(() => {
    // Load saved recipes
    const storedSaved = localStorage.getItem("savedRecipes");
    if (storedSaved) {
      try {
        const parsedRecipes = JSON.parse(storedSaved);

        if (parsedRecipes.length > 0) {
          if (typeof parsedRecipes[0] === "string") {
            // Migrate old string format to new object format
            const migratedRecipes = parsedRecipes.map((content, index) => {
              const date = new Date();
              const dateInfo = getDetailedDateInfo(date.toISOString());
              return {
                id: `recipe-${Date.now() + index}`,
                content,
                preview: getRecipePreview(content),
                dateCreated: date.toISOString(),
                dateInfo,
              };
            });
            setSavedRecipes(migratedRecipes);
            localStorage.setItem(
              "savedRecipes",
              JSON.stringify(migratedRecipes),
            );
          } else {
            // Ensure all recipes have the required fields
            const validatedRecipes = parsedRecipes.map((recipe) => ({
              ...recipe,
              preview: recipe.preview || getRecipePreview(recipe.content),
              dateInfo:
                recipe.dateInfo ||
                getDetailedDateInfo(
                  recipe.dateCreated || new Date().toISOString(),
                ),
            }));
            setSavedRecipes(validatedRecipes);

            // Set active recipe if there's one in localStorage
            const lastActiveId = localStorage.getItem("lastActiveRecipeId");
            if (lastActiveId) {
              const activeRecipe = validatedRecipes.find(
                (r) => r.id === lastActiveId,
              );
              if (activeRecipe) {
                setRecipe(activeRecipe.content);
                setActiveRecipeId(activeRecipe.id);
              }
            }
          }
        } else {
          setSavedRecipes(parsedRecipes);
        }
      } catch (error) {
        console.error("Error loading saved recipes:", error);
        setSavedRecipes([]);
      }
    }

    // Load sidebar expansion state
    const storedSidebarState = localStorage.getItem("sidebarExpanded");
    if (storedSidebarState !== null) {
      setIsSidebarExpanded(JSON.parse(storedSidebarState));
    }
  }, []);

  // Save savedRecipes to localStorage whenever it changes
  useEffect(() => {
    if (savedRecipes.length > 0) {
      try {
        localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
      } catch (error) {
        console.error("Error saving recipes to localStorage:", error);
      }
    } else {
      localStorage.removeItem("savedRecipes");
      localStorage.removeItem("lastActiveRecipeId");
      localStorage.removeItem("sidebarExpanded");
    }
  }, [savedRecipes]);

  // Save active recipe ID
  useEffect(() => {
    if (activeRecipeId) {
      localStorage.setItem("lastActiveRecipeId", activeRecipeId);
    } else {
      localStorage.removeItem("lastActiveRecipeId");
    }
  }, [activeRecipeId]);

  // Save sidebar expansion state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  // Auto-scroll to recipe section when a new recipe is generated
  useEffect(() => {
    if (recipe && !loading && recipeSectionRef.current) {
      setTimeout(() => {
        recipeSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [recipe, loading]);

  // Auto-expand sidebar when there's an active recipe on mount or when active recipe changes
  useEffect(() => {
    if (activeRecipeId) {
      setIsSidebarExpanded(true);
    }
  }, [activeRecipeId]);

  // Parse ingredients from input
  function parseIngredients(text) {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // Generate recipe from ingredients
  async function generateRecipe(e) {
    e.preventDefault();
    const ingredients = parseIngredients(input);
    if (!ingredients.length) return;

    setLoading(true);
    setRecipe("");
    setActiveRecipeId(null);
    setIsSidebarExpanded(false);

    try {
      const res = await fetch("http://localhost:3001/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setRecipe(data.recipe || "No recipe generated");
    } catch (error) {
      console.error("Error generating recipe:", error);
      setRecipe("Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Save current recipe to saved recipes
  function saveRecipe() {
    if (!recipe || recipe.includes("Failed to generate recipe")) return;

    const date = new Date();
    const dateInfo = getDetailedDateInfo(date.toISOString());

    // Create a recipe object
    const recipeObj = {
      id: `recipe-${Date.now()}`,
      content: recipe,
      preview: getRecipePreview(recipe),
      dateCreated: date.toISOString(),
      dateInfo,
      isNew: true,
    };

    // Check if recipe already exists
    const exists = savedRecipes.some(
      (saved) =>
        saved.content === recipe || saved.preview === recipeObj.preview,
    );

    if (!exists) {
      const newSavedRecipes = [recipeObj, ...savedRecipes];
      setSavedRecipes(newSavedRecipes);
      setActiveRecipeId(recipeObj.id);
      setIsSidebarExpanded(true);

      // Remove new flag after 2 seconds
      setTimeout(() => {
        setSavedRecipes((prev) =>
          prev.map((r) => (r.id === recipeObj.id ? { ...r, isNew: false } : r)),
        );
      }, 2000);

      return true;
    }
    return false;
  }

  // Delete a specific recipe
  function deleteRecipe(id) {
    const newSavedRecipes = savedRecipes.filter((recipe) => recipe.id !== id);
    setSavedRecipes(newSavedRecipes);

    if (activeRecipeId === id) {
      setActiveRecipeId(null);
      setRecipe("");
      // Only collapse sidebar if there are no more recipes
      if (newSavedRecipes.length === 0) {
        setIsSidebarExpanded(false);
      }
    }
  }

  // Clear all saved recipes
  function clearAllRecipes() {
    if (window.confirm("Are you sure you want to delete all saved recipes?")) {
      setSavedRecipes([]);
      setActiveRecipeId(null);
      setRecipe("");
      setIsSidebarExpanded(false);
    }
  }

  // Clear current recipe
  function clearRecipe() {
    setRecipe("");
    setActiveRecipeId(null);
    // Collapse sidebar when clearing recipe
    setIsSidebarExpanded(false);
  }

  // Clear textarea input
  function clearTextarea() {
    setInput("");
  }

  // View a saved recipe in the main area
  function viewRecipe(recipeObj) {
    setRecipe(recipeObj.content);
    setActiveRecipeId(recipeObj.id);
    setIsSidebarExpanded(true);

    setTimeout(() => {
      recipeSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  return (
    <>
      <Navbar />

      <main className="main-section">
        <div className="container main-layout">
          {/* Saved Recipes Sidebar - Only show if there are saved recipes */}
          {savedRecipes.length > 0 && (
            <section
              className={`saved-recipes-sidebar ${isSidebarExpanded ? "expanded" : "collapsed"}`}
            >
              <div className="sidebar-header">
                <h3 className="sidebar-title">
                  <FontAwesomeIcon icon={faMessage} className="sidebar-icon" />
                  <span className="sidebar-title-text">Recipe History</span>
                  <span className="recipe-count">({savedRecipes.length})</span>
                </h3>
                <div className="sidebar-header-actions">
                  <button
                    onClick={clearAllRecipes}
                    className="btn btn-danger btn-small"
                    title="Clear all saved recipes"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                    <span className="clear-all-text">Clear All</span>
                  </button>
                </div>
              </div>

              <div className="saved-recipes-list">
                {savedRecipes.map((recipeObj) => (
                  <div
                    key={recipeObj.id}
                    className={`saved-recipe-item ${activeRecipeId === recipeObj.id ? "active" : ""} ${recipeObj.isNew ? "new" : ""}`}
                    onClick={() => viewRecipe(recipeObj)}
                  >
                    <div className="recipe-item-content">
                      <div className="recipe-preview-header">
                        <FontAwesomeIcon
                          icon={faCookieBite}
                          className="recipe-icon"
                        />
                        <div className="recipe-preview-text">
                          {recipeObj.preview ||
                            getRecipePreview(recipeObj.content)}
                        </div>
                      </div>

                      <div className="recipe-meta-info">
                        <div className="recipe-date-info">
                          <FontAwesomeIcon
                            icon={faCalendarAlt}
                            className="meta-icon"
                          />
                          <span className="date-text">
                            {recipeObj.dateInfo?.date}
                          </span>
                        </div>
                        <div className="recipe-time-info">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="meta-icon"
                          />
                          <span className="time-text">
                            {recipeObj.dateInfo?.time}
                          </span>
                        </div>
                      </div>

                      <div className="recipe-actions-mini">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewRecipe(recipeObj);
                          }}
                          className="btn-icon view-recipe-btn"
                          title="View this recipe"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecipe(recipeObj.id);
                          }}
                          className="btn-icon delete-recipe-btn"
                          title="Delete this recipe"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Content Area */}
          <section
            className={`generate-recipe-section ${isSidebarExpanded ? "sidebar-expanded" : ""}`}
          >
            <div className="recipe-input-section">
              <p className="text-title">Your Recipe</p>

              <form className="form-section" onSubmit={generateRecipe}>
                <div className="textarea-wrapper">
                  <textarea
                    placeholder="Describe your recipe here..."
                    className="textarea-field"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={4}
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={clearTextarea}
                      className="clear-textarea-btn"
                      title="Clear input"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading || !input.trim()}
                >
                  <span className="awesome-icon">
                    <FontAwesomeIcon icon={faCookieBite} />
                  </span>
                  <span className="btn-text">
                    {loading ? "Generating..." : "Generate Recipe"}
                  </span>
                </button>
              </form>
            </div>

            {/* Generated Recipe Section */}
            <div ref={recipeSectionRef}>
              {recipe && (
                <div className="generated-recipe">
                  <div className="recipe-header">
                    <h3 className="recipe-title">
                      <FontAwesomeIcon icon={faCookieBite} />
                      Generated Recipe
                    </h3>
                    {activeRecipeId && (
                      <div className="active-recipe-info">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>
                          {savedRecipes.find((r) => r.id === activeRecipeId)
                            ?.dateInfo?.fullDateTime ||
                            new Date().toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Recipe recipe={recipe} />
                  <div className="recipe-actions">
                    <button
                      className="btn btn-primary"
                      onClick={saveRecipe}
                      disabled={
                        !recipe || recipe.includes("Failed to generate recipe")
                      }
                    >
                      <FontAwesomeIcon icon={faBookmark} />
                      <span className="btn-text">Save Recipe</span>
                    </button>
                    <button className="btn btn-secondary" onClick={clearRecipe}>
                      <span className="btn-text">Clear Recipe</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Empty state */}
            {!recipe && savedRecipes.length === 0 && (
              <div className="empty-state">
                <FontAwesomeIcon icon={faCookieBite} className="empty-icon" />
                <p className="empty-title">Welcome to Kitz Chef!</p>
                <p className="empty-subtitle">
                  Here you can create inspired recipes
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

class RecipeManager {
  constructor() {
    this.recipes = [];
    this.favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    this.currentFilter = "all";
    this.initializeElements();
    this.attachEventListeners();
    this.loadSampleRecipes();
  }

  initializeElements() {
    this.searchInput = document.getElementById("searchInput");
    this.recipeGrid = document.getElementById("recipeGrid");
    this.addRecipeModal = document.getElementById("addRecipeModal");
    this.recipeDetailsModal = document.getElementById("recipeDetailsModal");
    this.addRecipeForm = document.getElementById("addRecipeForm");
    this.categoryButtons = document.querySelectorAll(".category-btn");

    // File input handling
    const fileInput = document.getElementById("recipeImage");
    const fileNameDisplay = document.querySelector(".file-name");
    fileInput.addEventListener("change", (e) => {
      const fileName = e.target.files[0]?.name || "No file chosen";
      fileNameDisplay.textContent = fileName;
    });
  }

  attachEventListeners() {
    // Search functionality with debounce
    let searchTimeout;
    this.searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.handleSearch(), 300);
    });

    // Add recipe button
    document.getElementById("addRecipeBtn").addEventListener("click", () => {
      this.addRecipeModal.style.display = "block";
      this.addRecipeForm.reset();
      document.querySelector(".file-name").textContent = "No file chosen";
    });

    // Favorites button
    document.getElementById("favoritesBtn").addEventListener("click", () => {
      this.currentFilter = "favorites";
      this.updateCategoryButtons(null);
      this.updateRecipeDisplay();
    });

    // Category filters
    this.categoryButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        this.currentFilter = e.target.dataset.category;
        this.updateCategoryButtons(e.target);
        this.updateRecipeDisplay();
      });
    });

    // Close modals
    document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        this.addRecipeModal.style.display = "none";
        this.recipeDetailsModal.style.display = "none";
      });
    });

    // Form submission
    this.addRecipeForm.addEventListener("submit", (e) =>
      this.handleAddRecipe(e)
    );

    // Close modals on outside click
    window.addEventListener("click", (e) => {
      if (
        e.target === this.addRecipeModal ||
        e.target === this.recipeDetailsModal
      ) {
        this.addRecipeModal.style.display = "none";
        this.recipeDetailsModal.style.display = "none";
      }
    });

    // Escape key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.addRecipeModal.style.display = "none";
        this.recipeDetailsModal.style.display = "none";
      }
    });
  }

  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase().trim();
    const filteredRecipes = this.recipes.filter((recipe) => {
      return (
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.toLowerCase().includes(searchTerm)
      );
    });
    this.renderRecipes(filteredRecipes);
  }

  handleAddRecipe(e) {
    e.preventDefault();
    const imageFile = document.getElementById("recipeImage").files[0];

    const newRecipe = {
      id: Date.now(),
      name: document.getElementById("recipeName").value.trim(),
      prepTime: document.getElementById("prepTime").value,
      cookTime: document.getElementById("cookTime").value,
      category: document.getElementById("category").value,
      ingredients: document.getElementById("ingredients").value.trim(),
      instructions: document.getElementById("instructions").value.trim(),
      image: imageFile
        ? URL.createObjectURL(imageFile)
        : "default-recipe-image.jpg",
    };

    this.recipes.push(newRecipe);
    this.addRecipeForm.reset();
    document.querySelector(".file-name").textContent = "No file chosen";
    this.addRecipeModal.style.display = "none";
    this.updateRecipeDisplay();

    // Show success message
    this.showNotification("Recipe added successfully!");
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateCategoryButtons(activeButton) {
    this.categoryButtons.forEach((button) => {
      button.classList.remove("active");
    });
    if (activeButton) {
      activeButton.classList.add("active");
    }
  }

  filterRecipes() {
    if (this.currentFilter === "all") {
      return this.recipes;
    } else if (this.currentFilter === "favorites") {
      return this.recipes.filter((recipe) =>
        this.favorites.includes(recipe.id)
      );
    } else {
      return this.recipes.filter(
        (recipe) => recipe.category === this.currentFilter
      );
    }
  }

  updateRecipeDisplay() {
    const filteredRecipes = this.filterRecipes();
    this.renderRecipes(filteredRecipes);
  }

  renderRecipes(recipesToRender) {
    this.recipeGrid.innerHTML = "";
    if (recipesToRender.length === 0) {
      this.recipeGrid.innerHTML = `
              <div class="no-recipes">
                  <i class="fas fa-search"></i>
                  <p>No recipes found</p>
              </div>`;
      return;
    }

    recipesToRender.forEach((recipe) => {
      const card = this.createRecipeCard(recipe);
      this.recipeGrid.appendChild(card);
    });
  }

  createRecipeCard(recipe) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
          <img src="${recipe.image}" alt="${
      recipe.name
    }" onerror="this.src='default-recipe-image.jpg'">
          <div class="recipe-card-content">
              <h3>${recipe.name}</h3>
              <div class="recipe-info">
                  <span><i class="fas fa-clock"></i> Prep: ${
                    recipe.prepTime
                  } mins</span>
                  <span><i class="fas fa-fire"></i> Cook: ${
                    recipe.cookTime
                  } mins</span>
              </div>
              <button class="view-recipe">
                  <i class="fas fa-eye"></i> View Recipe
              </button>
              <button class="favorite-btn ${
                this.favorites.includes(recipe.id) ? "active" : ""
              }" 
                      title="${
                        this.favorites.includes(recipe.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }">
                  <i class="fas fa-heart"></i>
              </button>
          </div>
      `;

    card.querySelector(".view-recipe").addEventListener("click", () => {
      this.showRecipeDetails(recipe);
    });

    card.querySelector(".favorite-btn").addEventListener("click", (e) => {
      this.toggleFavorite(recipe.id);
      e.currentTarget.classList.toggle("active");
      e.currentTarget.title = this.favorites.includes(recipe.id)
        ? "Remove from favorites"
        : "Add to favorites";
    });

    return card;
  }

  showRecipeDetails(recipe) {
    const detailsContent = document.getElementById("recipeDetails");
    const ingredientsList = recipe.ingredients
      .split("\n")
      .filter((ingredient) => ingredient.trim())
      .map((ingredient) => `<li>${ingredient.trim()}</li>`)
      .join("");

    const instructionsList = recipe.instructions
      .split("\n")
      .filter((instruction) => instruction.trim())
      .map((instruction) => `<li>${instruction.trim()}</li>`)
      .join("");

    detailsContent.innerHTML = `
          <h2>${recipe.name}</h2>
          <img src="${recipe.image}" alt="${
      recipe.name
    }" onerror="this.src='default-recipe-image.jpg'">
          <div class="recipe-times">
              <p><i class="fas fa-clock"></i> Preparation Time: ${
                recipe.prepTime
              } minutes</p>
              <p><i class="fas fa-fire"></i> Cooking Time: ${
                recipe.cookTime
              } minutes</p>
          </div>
          <h3><i class="fas fa-list"></i> Ingredients</h3>
          <ul class="ingredients-list">${ingredientsList}</ul>
          <h3><i class="fas fa-tasks"></i> Instructions</h3>
          <ol class="instructions-list">${instructionsList}</ol>
          <button class="favorite-btn ${
            this.favorites.includes(recipe.id) ? "active" : ""
          }"
                  onclick="recipeManager.toggleFavorite(${recipe.id}, true)">
              <i class="fas fa-heart"></i> 
              ${
                this.favorites.includes(recipe.id)
                  ? "Remove from Favorites"
                  : "Add to Favorites"
              }
          </button>
      `;
    this.recipeDetailsModal.style.display = "block";
  }

  toggleFavorite(recipeId, isDetailView = false) {
    const index = this.favorites.indexOf(recipeId);
    if (index === -1) {
      this.favorites.push(recipeId);
      this.showNotification("Added to favorites!");
    } else {
      this.favorites.splice(index, 1);
      this.showNotification("Removed from favorites!");
    }
    localStorage.setItem("favorites", JSON.stringify(this.favorites));

    if (this.currentFilter === "favorites") {
      this.updateRecipeDisplay();
    }

    if (isDetailView) {
      this.showRecipeDetails(
        this.recipes.find((recipe) => recipe.id === recipeId)
      );
    }
  }

  loadSampleRecipes() {
    const sampleRecipes = [
      {
        id: 1,
        name: "Classic Pancakes",
        prepTime: "15",
        cookTime: "20",
        category: "breakfast",
        ingredients:
          "2 cups all-purpose flour\n2 tablespoons sugar\n2 teaspoons baking powder\n1/2 teaspoon salt\n2 cups milk\n2 large eggs\n2 tablespoons melted butter",
        instructions:
          "1. Mix dry ingredients in a large bowl\n2. Whisk wet ingredients in another bowl\n3. Combine wet and dry ingredients until just mixed\n4. Cook on a hot griddle until bubbles form\n5. Flip and cook other side until golden brown",
        image:
          "https://cravinghomecooked.com/wp-content/uploads/2018/07/classic-pancakes-1-6.jpg",
      },
      // Add more sample recipes as needed
    ];
    this.recipes = sampleRecipes;
    this.updateRecipeDisplay();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.recipeManager = new RecipeManager();
});

// Add CSS for notifications
const style = document.createElement("style");
style.textContent = `
  .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(210, 105, 30, 0.9);
      color: white;
      padding: 1rem 2rem;
      border-radius: 25px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-out 2.7s;
      z-index: 1000;
  }

  @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
  }

  @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
  }

  .no-recipes {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #666;
  }

  .no-recipes i {
      font-size: 3rem;
      color: #FFA07A;
      margin-bottom: 1rem;
  }
`;
document.head.appendChild(style);

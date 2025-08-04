import { CONFIG } from './config.js'
import { Food, Category } from './models.js'
import { DataManager } from './data.js'
import { UIManager } from './ui.js'
import { ModalManager } from './modal.js'

// Debug: Monitor what's setting tabIndex on body
const originalSetAttribute = document.body.setAttribute
document.body.setAttribute = function (name, value) {
  if (name === 'tabindex' || name === 'tabIndex') {
  }
  return originalSetAttribute.call(this, name, value)
}

// Also monitor the property directly
Object.defineProperty(document.body, 'tabIndex', {
  set: function (value) {
    this.setAttribute('tabindex', value)
  },
  get: function () {
    return parseInt(this.getAttribute('tabindex') || '0')
  },
})

class DietHelper {
  constructor() {
    this.foods = []
    this.tags = []
    this.categories = []
    this.currentCategoryId = null
    this.isEditMode = false
    this.categorySortable = null
    this.foodSortables = {}
    this.currentFoodId = null // Track currently viewed food for deletion
    this.dataManager = new DataManager()
    this.uiManager = new UIManager()
    this.modalManager = new ModalManager()
    this.init()
  }

  async init() {
    const result = await this.dataManager.loadData()
    if (result.success) {
      this.foods = result.data.foods
      this.tags = result.data.tags
      this.categories = result.data.categories || []
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    }
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    // Manage Tags Button
    document.getElementById('manageTagsBtn').addEventListener('click', () => {
      this.showManageTagsForm()
    })

    // Edit Mode Button
    document.getElementById('editModeBtn').addEventListener('click', () => {
      this.toggleEditMode()
    })

    // Add Category Button
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
      this.showAddCategoryForm()
    })

    // Save Category Button
    document.getElementById('saveCategoryBtn').addEventListener('click', () => {
      this.saveCategory()
    })

    // Cancel Category Button
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
      this.hideAddCategoryForm()
    })

    // Save Food Button
    document.getElementById('saveFoodBtn').addEventListener('click', () => {
      this.saveFood()
    })

    // Cancel Food Button
    document.getElementById('cancelFoodBtn').addEventListener('click', () => {
      this.hideAddFoodForm()
    })

    // Add Tag Button
    document.getElementById('addTagBtn').addEventListener('click', () => {
      this.addTag()
    })

    // Close Food Details Button
    document.getElementById('closeFoodDetailsBtn').addEventListener('click', () => {
      this.hideFoodDetails()
    })

    // Delete Food Button - NEW
    document.getElementById('deleteFoodBtn').addEventListener('click', () => {
      this.deleteFood()
    })

    // Close Tags Button
    document.getElementById('closeTagsBtn').addEventListener('click', () => {
      this.hideManageTagsForm()
    })
  }

  showAddFoodForm(categoryId = null) {
    this.modalManager.closeActiveModal()

    this.currentCategoryId = categoryId
    this.uiManager.renderTagsForSelection(this.tags)
    this.modalManager.showAddFood()
  }

  hideAddFoodForm() {
    this.modalManager.hideAddFood()
    this.uiManager.clearFoodForm()
  }

  showManageTagsForm() {
    this.uiManager.renderExistingTags(this.tags)
    this.modalManager.showManageTags()
  }

  hideManageTagsForm() {
    this.modalManager.hideManageTags()
  }

  showFoodDetails(foodId) {
    const food = this.foods.find((f) => f.id === foodId)
    if (!food) return

    // Store the current food ID for deletion
    this.currentFoodId = foodId

    this.uiManager.showFoodDetails(food, this.tags)
    this.modalManager.showFoodDetails()
  }

  hideFoodDetails() {
    this.currentFoodId = null
    this.currentCategoryId = null

    // Force complete modal cleanup
    this.modalManager.hideFoodDetails()

    // Reset all focus-related states
    setTimeout(() => {
      // Remove any lingering focus from body
      if (document.activeElement === document.body) {
        document.activeElement.blur()
      }

      // Ensure body is not focusable
      document.body.removeAttribute('tabIndex')
      document.body.style.overflow = 'auto'

      // Force browser to recalculate
      document.body.offsetHeight
    }, 50)
  }

  // NEW: Delete food functionality
  async deleteFood() {
    if (!this.currentFoodId) return

    let foodName = 'this food'

    if (this.currentCategoryId) {
      const category = this.categories.find((c) => c.id === this.currentCategoryId)
      const food = category?.foods.find((f) => f.id === this.currentFoodId)
      foodName = food?.name || 'this food'
    } else {
      const food = this.foods.find((f) => f.id === this.currentFoodId)
      foodName = food?.name || 'this food'
    }

    this.modalManager.showConfirmation(`Are you sure you want to delete "${foodName}"?`, () => {
      this.performDeleteFood(this.currentFoodId)
    })
  }

  // NEW: Perform the actual food deletion
  async performDeleteFood(foodId) {
    try {
      let food = null

      if (this.currentCategoryId) {
        const category = this.categories.find((c) => c.id === this.currentCategoryId)
        if (category) {
          food = category.foods.find((f) => f.id === foodId)
          category.foods = category.foods.filter((f) => f.id !== foodId)
        }
      } else {
        food = this.foods.find((f) => f.id === foodId)
        this.foods = this.foods.filter((f) => f.id !== foodId)
      }

      // Delete the image file if it exists and is not base64
      if (food && food.imageUrl && !food.imageUrl.startsWith('data:')) {
        const deleteResult = await this.dataManager.deleteImage(food.imageUrl)
      }

      await this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)

      this.hideFoodDetails()

      // Electron-specific: Force webContents to refocus after deletion
      if (typeof require !== 'undefined') {
        // We're in Electron
        setTimeout(() => {
          // Force the webContents to blur and refocus
          const currentWindow = window
          currentWindow.blur()
          setTimeout(() => {
            currentWindow.focus()
          }, 50)
        }, 100)
      }
    } catch (error) {
      alert('Failed to delete food. Please try again.')
    }
  }
  async saveFood() {
    const formData = this.uiManager.getFoodFormData()

    if (!formData.name) {
      this.uiManager.showError('foodNameError', CONFIG.MESSAGES.ERRORS.FOOD_NAME_REQUIRED)
      this.uiManager.focusElement('foodName')
      return
    }

    this.uiManager.hideError('foodNameError')

    // FIXED: Disable save button instead of overlay
    const saveBtn = document.getElementById('saveFoodBtn')
    const originalText = saveBtn.textContent
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    // Handle image
    let imageUrl = ''
    if (formData.image) {
      const imageResult = await this.dataManager.saveImage(formData.image)

      if (imageResult.success) {
        imageUrl = imageResult.path
      }
    }

    // Re-enable button
    saveBtn.disabled = false
    saveBtn.textContent = originalText

    this.createAndSaveFood(formData.name, imageUrl, formData.tags)
  }

  async createAndSaveFood(name, imageUrl, selectedTags) {
    const newFood = new Food(Date.now(), name, imageUrl, false, selectedTags)

    // Validate food data
    const validation = this.dataManager.validateFood(newFood)
    if (!validation.isValid) {
      alert('Invalid food data: ' + validation.errors.join(', '))
      return
    }

    if (this.currentCategoryId) {
      const category = this.categories.find((c) => c.id === this.currentCategoryId)
      if (category) {
        category.foods.push(newFood)
      }
    } else {
      this.foods.push(newFood)
    }

    await this.saveAllData()
    this.uiManager.renderCategories(this.categories, this.isEditMode)
    this.hideAddFoodForm()
  }

  async addTag() {
    const formData = this.uiManager.getTagFormData()

    if (!formData.name) {
      this.uiManager.showError('tagNameError', CONFIG.MESSAGES.ERRORS.TAG_NAME_REQUIRED)
      this.uiManager.focusElement('newTagName')
      return
    }

    this.uiManager.hideError('tagNameError')

    const newTag = {
      id: Date.now(),
      name: formData.name,
    }

    // Validate tag data
    const validation = this.dataManager.validateTag(newTag)
    if (!validation.isValid) {
      alert('Invalid tag data: ' + validation.errors.join(', '))
      return
    }

    this.tags.push(newTag)
    this.uiManager.clearTagForm()
    await this.saveAllData()
    this.uiManager.renderExistingTags(this.tags)
  }

  async deleteTag(tagId) {
    const confirmed = this.modalManager.showConfirmation(
      CONFIG.MESSAGES.CONFIRMATIONS.DELETE_TAG,
      () => {
        this.performDeleteTag(tagId)
      }
    )
  }

  async performDeleteTag(tagId) {
    this.tags = this.tags.filter((tag) => tag.id !== tagId)
    // Remove tag from all foods
    this.foods.forEach((food) => {
      food.tags = food.tags.filter((id) => id !== tagId)
    })
    await this.saveAllData()
    this.uiManager.renderExistingTags(this.tags)
    // Re-render foods in case any displayed foods had this tag
    this.uiManager.renderFoods(this.foods, this.tags)
  }

  showAddCategoryForm() {
    document.getElementById('categoryNameInput').value = ''
    this.uiManager.hideError('categoryNameError')
    this.modalManager.showAddCategory()
  }

  hideAddCategoryForm() {
    this.modalManager.hideAddCategory()
  }

  saveCategory() {
    const categoryName = document.getElementById('categoryNameInput').value.trim()

    if (!categoryName) {
      this.uiManager.showError('categoryNameError', 'Please enter category name')
      return
    }

    const newCategory = new Category(Date.now(), categoryName, [])

    this.categories.push(newCategory)
    this.saveAllData()
    this.uiManager.renderCategories(this.categories, this.isEditMode)
    this.hideAddCategoryForm()
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode

    // Update button text
    const editBtn = document.getElementById('editModeBtn')
    editBtn.textContent = this.isEditMode ? 'Done' : 'Edit'
    editBtn.style.backgroundColor = this.isEditMode ? '#28a745' : ''

    // First, re-render with edit mode state
    this.uiManager.renderCategories(this.categories, this.isEditMode)

    // Then, update container classes and sorting
    const container = document.getElementById('categoriesContainer')
    if (this.isEditMode) {
      container.classList.add('edit-mode')
      // Enable sorting AFTER rendering
      setTimeout(() => {
        this.enableCategorySorting()
      }, 150) // Slightly longer delay
    } else {
      container.classList.remove('edit-mode')
      this.disableCategorySorting()
    }
  }

  enableCategorySorting() {
    const container = document.getElementById('categoriesContainer')

    // Enable category sorting with better scroll config
    this.categorySortable = Sortable.create(container, {
      animation: 150,
      handle: '.category-header',
      draggable: '.category-container',
      scroll: true,
      forceAutoScrollFallback: true, // Force the auto-scroll
      scrollSensitivity: 100, // Increased sensitivity
      scrollSpeed: 20, // Faster scrolling
      onEnd: (evt) => {
        const movedCategory = this.categories.splice(evt.oldIndex, 1)[0]
        this.categories.splice(evt.newIndex, 0, movedCategory)
        this.saveAllData()
      },
    })

    // Enable food sorting within each category
    this.enableFoodSorting()
  }

  disableCategorySorting() {
    // Disable category sorting
    if (this.categorySortable) {
      this.categorySortable.destroy()
      this.categorySortable = null
    }

    // Disable food sorting
    this.disableFoodSorting()
  }

  enableFoodSorting() {
    this.categories.forEach((category) => {
      const foodsContainer = document.getElementById(`foods-${category.id}`)
      if (foodsContainer) {
        this.foodSortables[category.id] = Sortable.create(foodsContainer, {
          group: `foods-${category.id}`,
          animation: 150,
          draggable: '.food-item',
          scroll: true, // Enable auto-scrolling
          scrollSensitivity: 30,
          scrollSpeed: 10,
          onEnd: (evt) => {
            const movedFood = category.foods.splice(evt.oldIndex, 1)[0]
            category.foods.splice(evt.newIndex, 0, movedFood)
            this.saveAllData()
          },
        })
      }
    })
  }

  disableFoodSorting() {
    Object.values(this.foodSortables).forEach((sortable) => {
      if (sortable) {
        sortable.destroy()
      }
    })
    this.foodSortables = {}
  }

  startRenameCategory(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const nameSpan = document.getElementById(`categoryName-${categoryId}`)
    if (!nameSpan) return

    // Store original name in case of cancel
    const originalName = category.name

    // Create input element
    const input = document.createElement('input')
    input.type = 'text'
    input.value = category.name
    input.style.cssText = 'font-weight: bold; padding: 2px 5px; margin-right: 10px;'

    // Replace span with input
    nameSpan.parentNode.replaceChild(input, nameSpan)
    input.focus()
    input.select()

    // Handle save on Enter or blur
    const saveRename = () => {
      const newName = input.value.trim()
      if (newName && newName !== originalName) {
        category.name = newName
        this.saveAllData()
      }
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    }

    // Handle cancel on Escape
    const cancelRename = (e) => {
      if (e.key === 'Escape') {
        this.uiManager.renderCategories(this.categories, this.isEditMode)
      }
    }

    input.addEventListener('blur', saveRename)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveRename()
      } else if (e.key === 'Escape') {
        cancelRename(e)
      }
    })
  }

  renameCategory(categoryId) {
    // This is now just an alias for startRenameCategory
    this.startRenameCategory(categoryId)
  }

  deleteCategory(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const foodCount = category.foods.length
    const message =
      foodCount > 0
        ? `Delete "${category.name}" and its ${foodCount} food${foodCount > 1 ? 's' : ''}?`
        : `Delete empty category "${category.name}"?`

    this.modalManager.showConfirmation(message, () => {
      this.categories = this.categories.filter((c) => c.id !== categoryId)
      this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    })
  }

  showCategoryFoodDetails(categoryId, foodId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const food = category.foods.find((f) => f.id === foodId)
    if (!food) return

    this.currentFoodId = foodId
    this.currentCategoryId = categoryId

    this.uiManager.showFoodDetails(food, this.tags)
    this.modalManager.showFoodDetails()
  }

  async saveAllData() {
    const data = {
      foods: this.foods,
      tags: this.tags,
      categories: this.categories,
    }

    const result = await this.dataManager.saveData(data)
    if (!result.success) {
      console.error('Failed to save data:', result.error)
      alert(CONFIG.MESSAGES.ERRORS.SAVE_FAILED)
    }
  }
}

// Initialize the app
const dietHelper = new DietHelper()

// Make available for HTML onclick handlers (only this instance)
window.dietHelper = dietHelper

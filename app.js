import { CONFIG } from './config.js'
import { Food, Category } from './models.js'
import { DataManager } from './data.js'
import { UIManager } from './ui.js'
import { ModalManager } from './modal.js'

class DietHelper {
  constructor() {
    this.foods = []
    this.tags = []
    this.categories = []
    this.currentCategoryId = null
    this.isEditMode = false
    this.categorySortable = null
    this.foodSortables = {}
    this.currentFoodId = null
    this.dataManager = new DataManager()
    this.uiManager = new UIManager()
    this.modalManager = new ModalManager()
    this.selectedFilterTags = new Set()
    this.isFilterPanelOpen = false
    this.selectedFoods = new Set()
    this.isBulkSelectMode = false
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
    this.initializeFilterPanel()
    this.initializeKeyboardShortcuts()
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
    // Bulk Select Button
    document.getElementById('bulkSelectBtn').addEventListener('click', () => {
      this.toggleBulkSelectMode()
    })
    // Edit Food Button
    // Edit Food Button
    document.getElementById('editFoodBtn').addEventListener('click', () => {
      this.editFood()
    })

    // Update Food Button
    document.getElementById('updateFoodBtn').addEventListener('click', () => {
      this.updateFood()
    })

    // Cancel Edit Button
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      this.hideEditFoodForm()
    })
  }

  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in input fields
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)

      // Escape - Close modal (works even in input fields)
      if (e.key === 'Escape') {
        e.preventDefault()
        this.modalManager.closeActiveModal()
        return
      }

      // Don't process other shortcuts if user is typing
      if (isInputActive && e.key !== 'Escape') return

      // Ctrl+N - Add new food
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        if (this.categories.length === 0) {
          this.showAddCategoryForm()
        } else if (this.categories.length === 1) {
          this.showAddFoodForm(this.categories[0].id)
        } else {
          // Multiple categories - show selector
          this.showCategorySelector()
        }
      }

      // Ctrl+T - Manage tags
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        this.showManageTagsForm()
      }

      // Ctrl+S - Save current form
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        this.handleSaveShortcut()
      }

      // Ctrl+F - Focus on filter
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        // Open filter panel if closed
        if (!this.isFilterPanelOpen) {
          this.toggleFilterPanel()
        }
        // Focus on first tag checkbox
        setTimeout(() => {
          const firstTag = document.querySelector('.filter-tag-item input')
          if (firstTag) firstTag.focus()
        }, 100)
      }

      // Delete - Delete selected items in bulk mode
      if (e.key === 'Delete' && this.isBulkSelectMode && this.selectedFoods.size > 0) {
        e.preventDefault()
        this.bulkDelete()
      }

      // ? - Show help
      if (e.key === '/' && !isInputActive) {
        e.preventDefault()
        this.showKeyboardShortcutsHelp()
      }
    })
  }

  showCategorySelector() {
    // Create overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1999;
  `

    // Create modal
    const selectorModal = document.createElement('div')
    selectorModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 2000;
    max-width: 400px;
    min-width: 300px;
  `

    let categoriesHtml = this.categories
      .map(
        (cat, index) =>
          `<button class="category-select-btn" data-id="${cat.id}" style="
      display: block;
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      text-align: left;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      background: white;
    ">
      ${index + 1}. ${cat.name}
    </button>`
      )
      .join('')

    selectorModal.innerHTML = `
    <h3 style="margin-top: 0;">Select Category for New Food</h3>
    <div style="max-height: 300px; overflow-y: auto;">
      ${categoriesHtml}
    </div>
    <button id="cancelCategorySelect" style="margin-top: 15px; padding: 5px 15px;">Cancel</button>
  `

    // Add to body
    document.body.appendChild(overlay)
    document.body.appendChild(selectorModal)

    // Setup handlers
    const closeSelector = () => {
      overlay.remove()
      selectorModal.remove()
    }

    // Category button clicks
    selectorModal.querySelectorAll('.category-select-btn').forEach((btn, index) => {
      btn.onclick = () => {
        const categoryId = parseInt(btn.dataset.id)
        closeSelector()
        this.showAddFoodForm(categoryId)
      }

      // Number key shortcuts (1-9)
      if (index < 9) {
        const handler = (e) => {
          if (e.key === String(index + 1)) {
            document.removeEventListener('keydown', handler)
            btn.click()
          }
        }
        document.addEventListener('keydown', handler)
      }
    })

    overlay.onclick = closeSelector
    document.getElementById('cancelCategorySelect').onclick = closeSelector
  }
  handleSaveShortcut() {
    // Check which modal is active and trigger its save button
    const activeModal = this.modalManager.getActiveModal()

    switch (activeModal) {
      case 'addFood':
        this.saveFood()
        break
      case 'editFood':
        this.updateFood()
        break
      case 'addCategory':
        this.saveCategory()
        break
      case 'manageTags':
        // Check if tag name input has value
        const tagInput = document.getElementById('newTagName')
        if (tagInput && tagInput.value.trim()) {
          this.addTag()
        }
        break
    }
  }
  showKeyboardShortcutsHelp() {
    // Create overlay first
    const overlay = document.createElement('div')
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1999;
  `

    // Create modal
    const helpModal = document.createElement('div')
    helpModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 2000;
    max-width: 400px;
  `

    helpModal.innerHTML = `
    <h3 style="margin-top: 0;">Keyboard Shortcuts</h3>
    <div style="line-height: 1.8;">
      <div><kbd>Ctrl+N</kbd> - Add new food</div>
      <div><kbd>Ctrl+T</kbd> - Manage tags</div>
      <div><kbd>Ctrl+S</kbd> - Save current form</div>
      <div><kbd>Ctrl+F</kbd> - Filter foods</div>
      <div><kbd>Delete</kbd> - Delete selected (in bulk mode)</div>
      <div><kbd>Escape</kbd> - Close modal</div>
      <div><kbd>?</kbd> - Show this help</div>
    </div>
    <button id="closeHelpBtn" style="margin-top: 15px; padding: 5px 15px;">Close</button>
  `

    // Add to body
    document.body.appendChild(overlay)
    document.body.appendChild(helpModal)

    // Setup close handlers
    const closeHelp = () => {
      overlay.remove()
      helpModal.remove()
    }

    overlay.onclick = closeHelp
    document.getElementById('closeHelpBtn').onclick = closeHelp

    // Also close with Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeHelp()
        document.removeEventListener('keydown', escapeHandler)
      }
    }
    document.addEventListener('keydown', escapeHandler)
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

    // Pass all the new data to createAndSaveFood
    this.createAndSaveFood(
      formData.name,
      imageUrl,
      formData.tags,
      formData.notes,
      formData.nutrition,
      formData.specificData
    )
  }
  async createAndSaveFood(
    name,
    imageUrl,
    selectedTags,
    notes = '',
    nutrition = null,
    specificData = ''
  ) {
    const newFood = new Food(
      Date.now(),
      name,
      imageUrl,
      false,
      selectedTags,
      notes,
      nutrition,
      specificData
    )

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
    this.renderFilterTags()
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
    // Update filter panel
    this.selectedFilterTags.delete(tagId)
    this.renderFilterTags()
    this.applyFilters()
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
    const bulkSelectBtn = document.getElementById('bulkSelectBtn')

    editBtn.textContent = this.isEditMode ? 'Done' : 'Edit'
    editBtn.style.backgroundColor = this.isEditMode ? '#28a745' : ''

    // Show/hide bulk select button
    bulkSelectBtn.style.display = this.isEditMode ? 'inline-block' : 'none'

    const container = document.getElementById('categoriesContainer')

    if (this.isEditMode) {
      container.classList.add('edit-mode')
      // Exit bulk select mode if active
      if (this.isBulkSelectMode) {
        this.toggleBulkSelectMode()
      }
    } else {
      container.classList.remove('edit-mode')
      // Exit bulk select mode if active
      if (this.isBulkSelectMode) {
        this.toggleBulkSelectMode()
      }
    }

    // Re-render AFTER setting all the states
    this.uiManager.renderCategories(this.categories, this.isEditMode)

    // Enable/disable sorting AFTER rendering
    if (this.isEditMode) {
      setTimeout(() => {
        this.enableCategorySorting()
      }, 150)
    } else {
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
    // Create a shared group for all categories to allow dragging between them
    const sharedGroup = 'shared-foods'

    this.categories.forEach((category) => {
      const foodsContainer = document.getElementById(`foods-${category.id}`)
      if (foodsContainer) {
        this.foodSortables[category.id] = Sortable.create(foodsContainer, {
          group: sharedGroup, // Changed from unique group to shared
          animation: 150,
          draggable: '.food-item',
          scroll: true,
          scrollSensitivity: 30,
          scrollSpeed: 10,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          onEnd: (evt) => {
            // Get source and destination category IDs
            const fromCategoryId = parseInt(evt.from.id.replace('foods-', ''))
            const toCategoryId = parseInt(evt.to.id.replace('foods-', ''))

            const sourceCategory = this.categories.find((c) => c.id === fromCategoryId)
            const destCategory = this.categories.find((c) => c.id === toCategoryId)

            if (!sourceCategory || !destCategory) return

            if (fromCategoryId === toCategoryId) {
              // Same category - just reorder
              const movedFood = sourceCategory.foods.splice(evt.oldIndex, 1)[0]
              sourceCategory.foods.splice(evt.newIndex, 0, movedFood)
            } else {
              // Different category - move food
              const movedFood = sourceCategory.foods.splice(evt.oldIndex, 1)[0]
              destCategory.foods.splice(evt.newIndex, 0, movedFood)

              // Show a brief notification
              this.showMoveNotification(movedFood.name, sourceCategory.name, destCategory.name)
            }

            this.saveAllData()
          },
        })
      }
    })
  }
  showMoveNotification(foodName, fromCategory, toCategory) {
    // Create notification element
    const notification = document.createElement('div')
    notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `
    notification.textContent = `Moved "${foodName}" from ${fromCategory} to ${toCategory}`

    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
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
  // Initialize filter panel
  initializeFilterPanel() {
    // Set up filter panel toggle
    const filterHeader = document.getElementById('filterHeader')
    filterHeader.addEventListener('click', () => this.toggleFilterPanel())

    // Set up clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn')
    clearBtn.addEventListener('click', () => this.clearAllFilters())

    // Render filter tags
    this.renderFilterTags()
    // Set up filter mode toggle
    const filterModeToggle = document.getElementById('filterModeToggle')
    filterModeToggle.addEventListener('change', () => {
      this.applyFilters()
    })
  }

  // Toggle filter panel open/closed
  toggleFilterPanel() {
    this.isFilterPanelOpen = !this.isFilterPanelOpen

    const filterContent = document.getElementById('filterContent')
    const filterToggle = document.getElementById('filterToggle')

    if (this.isFilterPanelOpen) {
      filterContent.classList.add('open')
      filterToggle.classList.add('open')
    } else {
      filterContent.classList.remove('open')
      filterToggle.classList.remove('open')
    }
  }

  // Render filter tags in the panel
  renderFilterTags() {
    const filterTagsContainer = document.getElementById('filterTags')
    filterTagsContainer.innerHTML = ''

    this.tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'filter-tag-item'
      if (this.selectedFilterTags.has(tag.id)) {
        tagDiv.classList.add('selected')
      }

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = this.selectedFilterTags.has(tag.id)
      checkbox.id = `filter-tag-${tag.id}`

      const label = document.createElement('label')
      label.htmlFor = `filter-tag-${tag.id}`
      label.textContent = tag.name
      label.style.cursor = 'pointer'
      label.style.marginBottom = '0'

      tagDiv.appendChild(checkbox)
      tagDiv.appendChild(label)

      tagDiv.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          checkbox.checked = !checkbox.checked
        }
        this.toggleFilterTag(tag.id)
      })

      filterTagsContainer.appendChild(tagDiv)
    })

    this.updateFilterCount()
  }

  // Toggle a tag filter
  toggleFilterTag(tagId) {
    if (this.selectedFilterTags.has(tagId)) {
      this.selectedFilterTags.delete(tagId)
    } else {
      this.selectedFilterTags.add(tagId)
    }

    // Update UI
    this.renderFilterTags()
    this.applyFilters()
  }

  // Clear all filters
  clearAllFilters() {
    this.selectedFilterTags.clear()
    this.renderFilterTags()
    this.applyFilters()
  }

  // Update filter count display
  updateFilterCount() {
    const filterCount = document.getElementById('filterCount')
    const count = this.selectedFilterTags.size

    if (count > 0) {
      filterCount.textContent = `(${count})`
      filterCount.classList.add('active')
    } else {
      filterCount.classList.remove('active')
    }
  }

  // Apply filters to food items
  // Apply filters to food items
  // Apply filters to food items
  applyFilters() {
    const allFoodItems = document.querySelectorAll('.food-item')
    const useOrLogic = document.getElementById('filterModeToggle').checked

    if (this.selectedFilterTags.size === 0) {
      // No filters - show all foods normally
      allFoodItems.forEach((item) => {
        item.classList.remove('filtered-out')
      })
      return
    }

    // Apply filters
    allFoodItems.forEach((foodItem) => {
      const foodImage = foodItem.querySelector('.food-image')
      if (!foodImage) return

      const foodId = parseInt(foodImage.dataset.foodId)
      const categoryId = foodImage.dataset.categoryId
        ? parseInt(foodImage.dataset.categoryId)
        : null

      let food = null

      if (categoryId) {
        const category = this.categories.find((c) => c.id === categoryId)
        food = category?.foods.find((f) => f.id === foodId)
      } else {
        food = this.foods.find((f) => f.id === foodId)
      }

      if (food) {
        let shouldShow = false

        if (useOrLogic) {
          // OR logic - has ANY of the selected tags
          shouldShow = food.tags.some((tagId) => this.selectedFilterTags.has(tagId))
        } else {
          // AND logic (default) - has ALL selected tags
          shouldShow = Array.from(this.selectedFilterTags).every((tagId) =>
            food.tags.includes(tagId)
          )
        }

        if (shouldShow) {
          foodItem.classList.remove('filtered-out')
        } else {
          foodItem.classList.add('filtered-out')
        }
      }
    })
  }
  toggleBulkSelectMode() {
    console.log('Toggling bulk select mode:', !this.isBulkSelectMode)
    this.isBulkSelectMode = !this.isBulkSelectMode
    const bulkSelectBtn = document.getElementById('bulkSelectBtn')
    const container = document.getElementById('categoriesContainer')

    if (this.isBulkSelectMode) {
      bulkSelectBtn.textContent = 'Cancel Select'
      bulkSelectBtn.style.backgroundColor = '#dc3545'
      container.classList.add('bulk-select-mode')
      this.selectedFoods.clear()
      this.showBulkActionsBar()
      // Disable sorting during bulk select
      this.disableFoodSorting()
    } else {
      bulkSelectBtn.textContent = 'Select'
      bulkSelectBtn.style.backgroundColor = ''
      container.classList.remove('bulk-select-mode')
      this.selectedFoods.clear()
      this.hideBulkActionsBar()
      // Re-enable sorting
      if (this.isEditMode) {
        this.enableFoodSorting()
      }
      // Remove selected class from all items
      document.querySelectorAll('.food-item.selected').forEach((item) => {
        item.classList.remove('selected')
      })
    }
  }

  showBulkActionsBar() {
    // Remove existing bar if any
    this.hideBulkActionsBar()

    const bar = document.createElement('div')
    bar.className = 'bulk-actions-bar'
    bar.innerHTML = `
    <span class="selected-count">0 selected</span>
    <button onclick="dietHelper.selectAllVisible()">Select All</button>
    <button onclick="dietHelper.unselectAll()">Unselect All</button>
    <button onclick="dietHelper.bulkDelete()" style="background: #dc3545; border-color: #dc3545;">Delete Selected</button>
  `
    document.body.appendChild(bar)

    this.updateBulkActionsBar()
  }
  hideBulkActionsBar() {
    const bar = document.querySelector('.bulk-actions-bar')
    if (bar) bar.remove()
  }

  updateBulkActionsBar() {
    const bar = document.querySelector('.bulk-actions-bar')
    if (bar) {
      const count = this.selectedFoods.size
      bar.querySelector('.selected-count').textContent = `${count} selected`
    }
  }

  toggleFoodSelection(categoryId, foodId) {
    const key = `${categoryId}-${foodId}`
    const foodElement = document.querySelector(
      `.food-image[data-category-id="${categoryId}"][data-food-id="${foodId}"]`
    )?.parentElement

    if (this.selectedFoods.has(key)) {
      this.selectedFoods.delete(key)
      foodElement?.classList.remove('selected')
    } else {
      this.selectedFoods.add(key)
      foodElement?.classList.add('selected')
    }

    this.updateBulkActionsBar()
  }

  selectAllVisible() {
    const allFoodItems = document.querySelectorAll('.food-item:not(.filtered-out)')

    allFoodItems.forEach((item) => {
      const img = item.querySelector('.food-image')
      if (img) {
        const categoryId = img.dataset.categoryId
        const foodId = img.dataset.foodId
        if (categoryId && foodId) {
          const key = `${categoryId}-${foodId}`
          this.selectedFoods.add(key)
          item.classList.add('selected')
        }
      }
    })

    this.updateBulkActionsBar()
  }

  unselectAll() {
    // Clear all selections
    this.selectedFoods.clear()

    // Remove selected class from all items
    document.querySelectorAll('.food-item.selected').forEach((item) => {
      item.classList.remove('selected')
    })

    this.updateBulkActionsBar()
  }

  bulkDelete() {
    const count = this.selectedFoods.size
    if (count === 0) return

    const message = `Are you sure you want to delete ${count} selected food${count > 1 ? 's' : ''}?`

    this.modalManager.showConfirmation(message, async () => {
      // Delete all selected foods
      for (const key of this.selectedFoods) {
        const [categoryId, foodId] = key.split('-').map(Number)
        const category = this.categories.find((c) => c.id === categoryId)

        if (category) {
          const food = category.foods.find((f) => f.id === foodId)
          if (food && food.imageUrl && !food.imageUrl.startsWith('data:')) {
            await this.dataManager.deleteImage(food.imageUrl)
          }
          category.foods = category.foods.filter((f) => f.id !== foodId)
        }
      }

      await this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)
      this.toggleBulkSelectMode() // Exit bulk select mode
    })
  }
  editFood() {
    if (!this.currentFoodId) return

    let food = null
    let categoryId = this.currentCategoryId

    // Store these values before hiding the modal
    this.editingFoodId = this.currentFoodId
    this.editingCategoryId = this.currentCategoryId

    if (categoryId) {
      const category = this.categories.find((c) => c.id === categoryId)
      food = category?.foods.find((f) => f.id === this.currentFoodId)
    } else {
      food = this.foods.find((f) => f.id === this.currentFoodId)
    }

    if (!food) return

    // Populate edit form with current values
    this.populateEditForm(food)

    // Show edit modal
    this.modalManager.showEditFood()
  }
  populateEditForm(food) {
    // Basic info
    document.getElementById('editFoodName').value = food.name || ''
    document.getElementById('editFoodNotes').value = food.notes || ''
    document.getElementById('editFoodSpecificData').value = food.specificData || ''

    // Show current image preview
    const previewDiv = document.getElementById('currentImagePreview')
    if (food.imageUrl) {
      previewDiv.innerHTML = `
      <img src="${food.imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;">
      <p style="font-size: 12px; color: #666; margin: 5px 0;">Current image (upload new to replace)</p>
    `
    } else {
      previewDiv.innerHTML = ''
    }

    // Nutrition data
    // Nutrition data
    if (food.nutrition) {
      document.getElementById('editNutritionProtein').value =
        food.nutrition.protein !== null && food.nutrition.protein !== undefined
          ? food.nutrition.protein
          : ''
      document.getElementById('editNutritionFat').value =
        food.nutrition.fat !== null && food.nutrition.fat !== undefined ? food.nutrition.fat : ''
      document.getElementById('editNutritionCarbs').value =
        food.nutrition.carbs !== null && food.nutrition.carbs !== undefined
          ? food.nutrition.carbs
          : ''
      document.getElementById('editNutritionFiber').value =
        food.nutrition.fiber !== null && food.nutrition.fiber !== undefined
          ? food.nutrition.fiber
          : ''
      document.getElementById('editNutritionSugar').value =
        food.nutrition.sugar !== null && food.nutrition.sugar !== undefined
          ? food.nutrition.sugar
          : ''
      document.getElementById('editNutritionSodium').value =
        food.nutrition.sodium !== null && food.nutrition.sodium !== undefined
          ? food.nutrition.sodium
          : ''
    }

    // Tags
    this.uiManager.renderTagsForEdit(this.tags, food.tags)
  }

  hideEditFoodForm() {
    this.modalManager.hideEditFood()
    // Clear the form
    document.getElementById('editFoodImage').value = ''
    document.getElementById('currentImagePreview').innerHTML = ''

    // Don't hide food details - it should stay open
  }

  async updateFood() {
    console.log('Update food clicked')
    const formData = this.uiManager.getEditFoodFormData()
    console.log('Form data:', formData)

    if (!formData.name) {
      this.uiManager.showError('editFoodNameError', 'Please enter food name')
      this.uiManager.focusElement('editFoodName')
      return
    }

    this.uiManager.hideError('editFoodNameError')

    // Use the stored editing IDs instead of current IDs
    let food = null
    let category = null

    if (this.editingCategoryId) {
      category = this.categories.find((c) => c.id === this.editingCategoryId)
      food = category?.foods.find((f) => f.id === this.editingFoodId)
    } else {
      food = this.foods.find((f) => f.id === this.editingFoodId)
    }

    if (!food) {
      console.error('Food not found!', this.editingFoodId, this.editingCategoryId)
      return
    }

    console.log('Found food to update:', food)

    const updateBtn = document.getElementById('updateFoodBtn')
    const originalText = updateBtn.textContent
    updateBtn.disabled = true
    updateBtn.textContent = 'Updating...'

    // Handle image update
    let imageUrl = food.imageUrl // Keep existing by default
    if (formData.image) {
      // Delete old image if exists
      if (food.imageUrl && !food.imageUrl.startsWith('data:')) {
        await this.dataManager.deleteImage(food.imageUrl)
      }
      // Save new image
      const imageResult = await this.dataManager.saveImage(formData.image)
      if (imageResult.success) {
        imageUrl = imageResult.path
      }
    }

    // Update food properties
    food.name = formData.name
    food.imageUrl = imageUrl
    food.notes = formData.notes
    food.nutrition = formData.nutrition
    food.specificData = formData.specificData
    food.tags = formData.tags

    // Re-enable button
    updateBtn.disabled = false
    updateBtn.textContent = originalText

    // Save and refresh
    // Save and refresh
    await this.saveAllData()
    this.uiManager.renderCategories(this.categories, this.isEditMode)

    // Refresh the food details modal with updated data BEFORE clearing IDs
    let updatedFood = null
    if (this.editingCategoryId) {
      const category = this.categories.find((c) => c.id === this.editingCategoryId)
      updatedFood = category?.foods.find((f) => f.id === this.editingFoodId)
    } else {
      updatedFood = this.foods.find((f) => f.id === this.editingFoodId)
    }

    // Hide edit form
    this.hideEditFoodForm()

    // Now refresh the details if we found the food
    if (updatedFood) {
      console.log('Refreshing food details with:', updatedFood)
      this.uiManager.showFoodDetails(updatedFood, this.tags)
    }

    // Clear the editing IDs after everything is done
    this.editingFoodId = null
    this.editingCategoryId = null
  }
}

// Initialize the app
const dietHelper = new DietHelper()

// Make available for HTML onclick handlers (only this instance)
window.dietHelper = dietHelper

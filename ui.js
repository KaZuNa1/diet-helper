import { CONFIG } from './config.js'

export class UIManager {
  constructor() {
    this.elements = {
      categoriesContainer: document.getElementById('categoriesContainer'),
      tagsList: document.getElementById('tagsList'),
      existingTags: document.getElementById('existingTags'),
      detailsImage: document.getElementById('detailsImage'),
      detailsName: document.getElementById('detailsName'),
      detailsTags: document.getElementById('detailsTags'),
    }

    // FIXED: Track event listeners for cleanup
    this.eventListeners = new Map()
    this.currentFoodElements = []
    this.currentTagElements = []
  }

  // FIXED: Add event listener with cleanup tracking
  addEventListenerWithCleanup(element, event, handler, identifier) {
    // Remove existing listener if it exists
    this.removeEventListener(identifier)

    // Add new listener
    element.addEventListener(event, handler)

    // Store for cleanup
    this.eventListeners.set(identifier, {
      element,
      event,
      handler,
    })
  }

  // FIXED: Remove specific event listener
  removeEventListener(identifier) {
    const listener = this.eventListeners.get(identifier)
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler)
      this.eventListeners.delete(identifier)
    }
  }

  // FIXED: Clean up all event listeners
  cleanup() {
    this.eventListeners.forEach((listener, identifier) => {
      listener.element.removeEventListener(listener.event, listener.handler)
    })
    this.eventListeners.clear()
    this.currentFoodElements = []
    this.currentTagElements = []
  }

  // FIXED: Render all foods in grid layout with proper event management
  renderCategories(categories, isEditMode = false) {
    this.cleanup()
    this.elements.categoriesContainer.innerHTML = ''

    categories.forEach((category) => {
      const categoryDiv = document.createElement('div')
      categoryDiv.className = 'category-container'
      categoryDiv.style.cssText = 'border: 1px solid #ccc; margin: 10px; padding: 10px;'

      const headerDiv = document.createElement('div')
      headerDiv.className = 'category-header' // Add class for drag handle
      headerDiv.style.cssText =
        'display: flex; justify-content: space-between; margin-bottom: 10px;'

      headerDiv.innerHTML = `
            <button onclick="window.dietHelper.showAddFoodForm(${category.id})" style="padding: 5px 10px;">+ Add Food</button>
            <div>
                <span id="categoryName-${category.id}" 
      style="margin-right: 10px; font-weight: bold; padding: 2px 5px;">${this.escapeHtml(category.name)}</span>
                <button onclick="window.dietHelper.startRenameCategory(${category.id})" style="padding: 5px 10px; display: ${isEditMode ? 'inline-block' : 'none'};">Rename</button>
                <button onclick="window.dietHelper.deleteCategory(${category.id})" style="padding: 5px 10px; display: ${isEditMode ? 'inline-block' : 'none'};">Delete</button>
            </div>
        `

      categoryDiv.appendChild(headerDiv)

      const foodsDiv = document.createElement('div')
      foodsDiv.id = `foods-${category.id}` // Add ID for sortable
      foodsDiv.style.cssText = 'display: flex; flex-wrap: wrap;'

      if (category.foods.length === 0) {
        foodsDiv.innerHTML = '<p style="color: #666; margin: 40px 0;">No foods in this category</p>'
      } else {
        category.foods.forEach((food) => {
          const foodDiv = document.createElement('div')
          foodDiv.className = 'food-item'

          foodDiv.innerHTML = `
    ${
      food.imageUrl
        ? `<img src="${food.imageUrl}" class="food-image" data-category-id="${category.id}" data-food-id="${food.id}">`
        : `<div class="food-image no-image" data-category-id="${category.id}" data-food-id="${food.id}">No Image</div>`
    }
    <div class="food-name">${this.escapeHtml(food.name)}</div>
  `

          const imageElement = foodDiv.querySelector('.food-image')

          // Define listenerId FIRST
          const listenerId = `food-image-${category.id}-${food.id}`

          // Then create the click handler
          const clickHandler = (e) => {
            if (window.dietHelper.isBulkSelectMode) {
              e.preventDefault()
              e.stopPropagation()
              window.dietHelper.toggleFoodSelection(category.id, food.id)
            } else {
              // Only respond to image clicks when not in bulk mode
              if (e.target.classList.contains('food-image')) {
                window.dietHelper.showCategoryFoodDetails(category.id, food.id)
              }
            }
          }

          // Attach to the entire food item div, not just the image
          this.addEventListenerWithCleanup(foodDiv, 'click', clickHandler, listenerId)
          this.currentFoodElements.push(listenerId)

          foodsDiv.appendChild(foodDiv)
        })
      }

      categoryDiv.appendChild(foodsDiv)
      this.elements.categoriesContainer.appendChild(categoryDiv)
    })
    // Apply filters after rendering
    if (window.dietHelper && window.dietHelper.applyFilters) {
      window.dietHelper.applyFilters()
    }
    // Restore bulk selection state if active
    if (window.dietHelper && window.dietHelper.isBulkSelectMode) {
      const container = document.getElementById('categoriesContainer')
      container.classList.add('bulk-select-mode')

      // Restore selected items
      window.dietHelper.selectedFoods.forEach((key) => {
        const [categoryId, foodId] = key.split('-')
        const foodElement = document.querySelector(
          `.food-image[data-category-id="${categoryId}"][data-food-id="${foodId}"]`
        )?.parentElement
        if (foodElement) {
          foodElement.classList.add('selected')
        }
      })
    }
  }

  // Render tags for selection in food form
  renderTagsForSelection(tags) {
    this.elements.tagsList.innerHTML = ''

    if (tags.length === 0) {
      const noTagsMsg = document.createElement('p')
      noTagsMsg.textContent = 'No tags available. Add some tags first!'
      noTagsMsg.style.color = '#666'
      noTagsMsg.style.fontSize = '12px'
      this.elements.tagsList.appendChild(noTagsMsg)
      return
    }

    tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'tag-item'
      tagDiv.innerHTML = `
                <input type="checkbox" class="tag-checkbox" value="${tag.id}" id="tag_${tag.id}">
                <label for="tag_${tag.id}">${this.escapeHtml(tag.name)}</label>
            `
      this.elements.tagsList.appendChild(tagDiv)
    })
  }

  // FIXED: Render existing tags in manage tags form with proper event management
  renderExistingTags(tags) {
    // Clean up existing tag event listeners
    this.currentTagElements.forEach((identifier) => {
      this.removeEventListener(identifier)
    })
    this.currentTagElements = []

    this.elements.existingTags.innerHTML = ''

    if (tags.length === 0) {
      const noTagsMsg = document.createElement('p')
      noTagsMsg.textContent = 'No tags created yet.'
      noTagsMsg.style.color = '#666'
      noTagsMsg.style.fontSize = '12px'
      this.elements.existingTags.appendChild(noTagsMsg)
      return
    }

    tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'tag-item'
      tagDiv.innerHTML = `
                <span>${this.escapeHtml(tag.name)}</span>
                <button class="delete-tag-btn" data-tag-id="${tag.id}" style="margin-left: 10px; padding: 2px 8px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
            `

      // FIXED: Add click event listener with cleanup tracking
      const deleteBtn = tagDiv.querySelector('.delete-tag-btn')
      const clickHandler = () => {
        window.dietHelper.deleteTag(tag.id)
      }

      const listenerId = `delete-tag-${tag.id}`
      this.addEventListenerWithCleanup(deleteBtn, 'click', clickHandler, listenerId)
      this.currentTagElements.push(listenerId)

      this.elements.existingTags.appendChild(tagDiv)
    })
  }

  // Show food details in modal
  showFoodDetails(food, tags) {
    const tagNames = food.tags
      .map((tagId) => {
        const tag = tags.find((t) => t.id === tagId)
        return tag ? tag.name : ''
      })
      .filter((name) => name)

    // Populate basic details
    this.elements.detailsImage.src = food.imageUrl || ''
    this.elements.detailsImage.style.display = food.imageUrl ? 'block' : 'none'
    this.elements.detailsImage.style.width = CONFIG.UI.FOOD_IMAGE_SIZE.MODAL.width + 'px'
    this.elements.detailsImage.style.height = CONFIG.UI.FOOD_IMAGE_SIZE.MODAL.height + 'px'

    if (!food.imageUrl) {
      this.elements.detailsImage.style.display = 'block'
      this.elements.detailsImage.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }

    this.elements.detailsName.textContent = food.name
    this.elements.detailsTags.textContent =
      tagNames.length > 0 ? `Tags: ${tagNames.join(', ')}` : 'No tags'

    // Show/hide notes section
    const notesSection = document.getElementById('detailsNotesSection')
    const notesElement = document.getElementById('detailsNotes')
    if (food.notes) {
      notesElement.textContent = food.notes
      notesElement.style.fontStyle = 'normal'
      notesElement.style.color = '#555'
    } else {
      notesElement.textContent = 'No notes added'
      notesElement.style.fontStyle = 'italic'
      notesElement.style.color = '#999'
    }
    notesSection.style.display = 'block'

    // Show/hide nutrition section
    const nutritionSection = document.getElementById('detailsNutritionSection')
    const hasNutrition = food.nutrition && typeof food.nutrition === 'object'

    if (hasNutrition) {
      // Make sure we're not overwriting the structure
      const proteinEl = document.getElementById('detailsProtein')
      const fatEl = document.getElementById('detailsFat')
      const carbsEl = document.getElementById('detailsCarbs')
      const fiberEl = document.getElementById('detailsFiber')
      const sugarEl = document.getElementById('detailsSugar')
      const sodiumEl = document.getElementById('detailsSodium')

      if (proteinEl)
        proteinEl.textContent =
          food.nutrition.protein !== null && food.nutrition.protein !== undefined
            ? `${food.nutrition.protein}g`
            : '-'
      if (fatEl)
        fatEl.textContent =
          food.nutrition.fat !== null && food.nutrition.fat !== undefined
            ? `${food.nutrition.fat}g`
            : '-'
      if (carbsEl)
        carbsEl.textContent =
          food.nutrition.carbs !== null && food.nutrition.carbs !== undefined
            ? `${food.nutrition.carbs}g`
            : '-'
      if (fiberEl)
        fiberEl.textContent =
          food.nutrition.fiber !== null && food.nutrition.fiber !== undefined
            ? `${food.nutrition.fiber}g`
            : '-'
      if (sugarEl)
        sugarEl.textContent =
          food.nutrition.sugar !== null && food.nutrition.sugar !== undefined
            ? `${food.nutrition.sugar}g`
            : '-'
      if (sodiumEl)
        sodiumEl.textContent =
          food.nutrition.sodium !== null && food.nutrition.sodium !== undefined
            ? `${food.nutrition.sodium}mg`
            : '-'
    } else {
      // Set all to dash if no nutrition object
      const elements = [
        'detailsProtein',
        'detailsFat',
        'detailsCarbs',
        'detailsFiber',
        'detailsSugar',
        'detailsSodium',
      ]
      elements.forEach((id) => {
        const el = document.getElementById(id)
        if (el) el.textContent = '-'
      })
    }
    nutritionSection.style.display = 'block'

    // Show/hide specific data section
    const specificSection = document.getElementById('detailsSpecificSection')
    const specificElement = document.getElementById('detailsSpecificData')
    if (food.specificData) {
      specificElement.textContent = food.specificData
      specificElement.style.fontStyle = 'normal'
      specificElement.style.color = '#555'
    } else {
      specificElement.textContent = 'No specific information added'
      specificElement.style.fontStyle = 'italic'
      specificElement.style.color = '#999'
    }
    specificSection.style.display = 'block'
  }

  // Clear food form
  clearFoodForm() {
    const nameField = document.getElementById('foodName')
    const imageField = document.getElementById('foodImage')
    const errorDiv = document.getElementById('foodNameError')
    const notesField = document.getElementById('foodNotes')
    const specificDataField = document.getElementById('foodSpecificData')

    if (nameField) nameField.value = ''
    if (imageField) imageField.value = ''
    if (errorDiv) errorDiv.classList.add('hidden')
    if (notesField) notesField.value = ''
    if (specificDataField) specificDataField.value = ''

    // Clear nutrition fields
    const nutritionFields = ['Protein', 'Fat', 'Carbs', 'Fiber', 'Sugar', 'Sodium']
    nutritionFields.forEach((field) => {
      const input = document.getElementById(`nutrition${field}`)
      if (input) input.value = ''
    })

    // Clear tag selections
    const checkboxes = document.querySelectorAll('.tag-checkbox')
    checkboxes.forEach((cb) => (cb.checked = false))
  }
  rebuildFoodNameInput() {
    const container = document.querySelector('#addFoodDropdown .form-group')
    if (!container) return

    // Remove old input and error div
    const oldInput = document.getElementById('foodName')
    const oldError = document.getElementById('foodNameError')

    if (oldInput) oldInput.remove()
    if (oldError) oldError.remove()

    // Create fresh input
    const newInput = document.createElement('input')
    newInput.type = 'text'
    newInput.id = 'foodName'
    newInput.placeholder = 'Enter food name'

    const newError = document.createElement('div')
    newError.id = 'foodNameError'
    newError.className = 'error-message hidden'
    newError.textContent = 'Please enter food name'

    // Insert at beginning of container
    container.insertBefore(newInput, container.firstChild)
    container.insertBefore(newError, newInput.nextSibling)

    // Focus the new input
    newInput.focus()
  }
  // Clear tag form
  clearTagForm() {
    const tagField = document.getElementById('newTagName')
    const errorDiv = document.getElementById('tagNameError')

    if (tagField) tagField.value = ''
    if (errorDiv) errorDiv.classList.add('hidden')
  }

  // Show/hide error messages
  showError(elementId, message = null) {
    const errorDiv = document.getElementById(elementId)
    if (errorDiv) {
      // Use provided message or default from config
      const errorMessage = message || CONFIG.MESSAGES.ERRORS.FOOD_NAME_REQUIRED
      errorDiv.textContent = errorMessage
      errorDiv.classList.remove('hidden')
    }
  }

  hideError(elementId) {
    const errorDiv = document.getElementById(elementId)
    if (errorDiv) {
      errorDiv.classList.add('hidden')
    }
  }

  // Get selected tags from checkboxes
  getSelectedTags() {
    const selectedTags = []
    const checkboxes = document.querySelectorAll('.tag-checkbox:checked')
    checkboxes.forEach((cb) => {
      selectedTags.push(parseInt(cb.value))
    })
    return selectedTags
  }

  // Get form input values
  getFoodFormData() {
    return {
      name: document.getElementById('foodName')?.value.trim() || '',
      image: document.getElementById('foodImage')?.files[0] || null,
      tags: this.getSelectedTags(),
      notes: document.getElementById('foodNotes')?.value.trim() || '',
      nutrition: {
        protein:
          document.getElementById('nutritionProtein')?.value !== ''
            ? parseFloat(document.getElementById('nutritionProtein').value)
            : null,
        fat:
          document.getElementById('nutritionFat')?.value !== ''
            ? parseFloat(document.getElementById('nutritionFat').value)
            : null,
        carbs:
          document.getElementById('nutritionCarbs')?.value !== ''
            ? parseFloat(document.getElementById('nutritionCarbs').value)
            : null,
        fiber:
          document.getElementById('nutritionFiber')?.value !== ''
            ? parseFloat(document.getElementById('nutritionFiber').value)
            : null,
        sugar:
          document.getElementById('nutritionSugar')?.value !== ''
            ? parseFloat(document.getElementById('nutritionSugar').value)
            : null,
        sodium:
          document.getElementById('nutritionSodium')?.value !== ''
            ? parseFloat(document.getElementById('nutritionSodium').value)
            : null,
      },
      specificData: document.getElementById('foodSpecificData')?.value.trim() || '',
    }
  }

  renderTagsForEdit(tags, selectedTagIds = []) {
    const container = document.getElementById('editTagsList')
    container.innerHTML = ''

    if (tags.length === 0) {
      const noTagsMsg = document.createElement('p')
      noTagsMsg.textContent = 'No tags available. Add some tags first!'
      noTagsMsg.style.color = '#666'
      noTagsMsg.style.fontSize = '12px'
      container.appendChild(noTagsMsg)
      return
    }

    tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'tag-item'
      const isChecked = selectedTagIds.includes(tag.id)
      tagDiv.innerHTML = `
      <input type="checkbox" class="edit-tag-checkbox" value="${tag.id}" id="edit_tag_${tag.id}" ${isChecked ? 'checked' : ''}>
      <label for="edit_tag_${tag.id}">${this.escapeHtml(tag.name)}</label>
    `
      container.appendChild(tagDiv)
    })
  }

  getEditFoodFormData() {
    return {
      name: document.getElementById('editFoodName')?.value.trim() || '',
      image: document.getElementById('editFoodImage')?.files[0] || null,
      tags: this.getSelectedEditTags(),
      notes: document.getElementById('editFoodNotes')?.value.trim() || '',
      nutrition: {
        protein:
          document.getElementById('editNutritionProtein')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionProtein').value)
            : null,
        fat:
          document.getElementById('editNutritionFat')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionFat').value)
            : null,
        carbs:
          document.getElementById('editNutritionCarbs')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionCarbs').value)
            : null,
        fiber:
          document.getElementById('editNutritionFiber')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionFiber').value)
            : null,
        sugar:
          document.getElementById('editNutritionSugar')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionSugar').value)
            : null,
        sodium:
          document.getElementById('editNutritionSodium')?.value !== ''
            ? parseFloat(document.getElementById('editNutritionSodium').value)
            : null,
      },
      specificData: document.getElementById('editFoodSpecificData')?.value.trim() || '',
    }
  }

  getSelectedEditTags() {
    const selectedTags = []
    const checkboxes = document.querySelectorAll('.edit-tag-checkbox:checked')
    checkboxes.forEach((cb) => {
      selectedTags.push(parseInt(cb.value))
    })
    return selectedTags
  }

  getTagFormData() {
    return {
      name: document.getElementById('newTagName')?.value.trim() || '',
    }
  }

  // Utility function to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Show loading state
  showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId)
    if (element) {
      element.innerHTML = `<p style="text-align: center; color: #666;">${message}</p>`
    }
  }

  // Focus on element
  focusElement(elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      setTimeout(() => element.focus(), 100)
    }
  }

  // FIXED: Cleanup method to be called when UIManager is destroyed
  destroy() {
    this.cleanup()
  }
}

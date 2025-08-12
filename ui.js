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
      categoryDiv.style.cssText =
        'border: 1px solid #ccc; margin: 10px; padding: 10px; padding-top:2px'

      const headerDiv = document.createElement('div')
      headerDiv.className = 'category-header'
      headerDiv.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 3px;'

      const actualEditMode = window.dietHelper ? window.dietHelper.isEditMode : isEditMode

      headerDiv.innerHTML = `
      <span id="categoryName-${category.id}" 
        style="font-weight: bold; font-size: 16px;">${this.escapeHtml(category.name)}</span>
      <div style="display: flex; gap: 5px; align-items: center;">
        <button onclick="window.dietHelper.startRenameCategory(${category.id})" style="padding: 5px 10px; display: ${actualEditMode ? 'inline-block' : 'none'};">Rename</button>
        <button onclick="window.dietHelper.deleteCategory(${category.id})" style="padding: 5px 10px; display: ${actualEditMode ? 'inline-block' : 'none'};">Delete</button>
        <button onclick="window.dietHelper.showAddFoodForm(${category.id})" style="padding: 5px 15px; font-size: 16px; font-weight: bold;">+</button>
      </div>
    `

      categoryDiv.appendChild(headerDiv)

      // Render subgroups if any
      if (category.subgroups && category.subgroups.length > 0) {
        const subgroupsGrid = document.createElement('div')
        subgroupsGrid.style.cssText =
          'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;'

        category.subgroups.forEach((subgroup) => {
          const subgroupDiv = document.createElement('div')
          subgroupDiv.className = 'subgroup-container'
          subgroupDiv.id = `subgroup-${subgroup.id}`

          const subgroupHeader = document.createElement('div')
          subgroupHeader.className = 'subgroup-header'

          subgroupHeader.innerHTML = `
      <span id="subgroupName-${subgroup.id}" style="font-weight: bold; font-size: 14px;">${this.escapeHtml(subgroup.name)}</span>
      <div style="display: flex; gap: 5px; align-items: center;">
        <button onclick="window.dietHelper.startRenameSubgroup(${category.id}, ${subgroup.id})" style="padding: 3px 8px; font-size: 12px; display: ${actualEditMode ? 'inline-block' : 'none'};">Rename</button>
        <button onclick="window.dietHelper.deleteSubgroup(${category.id}, ${subgroup.id})" style="padding: 3px 8px; font-size: 12px; display: ${actualEditMode ? 'inline-block' : 'none'};">Delete</button>
        <button onclick="window.dietHelper.showAddFoodToSubgroup(${category.id}, ${subgroup.id})" style="padding: 3px 10px; font-size: 14px; font-weight: bold;">+</button>
      </div>
    `

          subgroupDiv.appendChild(subgroupHeader)

          // Render subgroup foods
          const subgroupFoodsDiv = document.createElement('div')
          subgroupFoodsDiv.className = 'subgroup-foods'
          subgroupFoodsDiv.id = `subgroup-foods-${subgroup.id}`
          subgroupFoodsDiv.style.cssText =
            'display: flex; flex-wrap: wrap; position: relative; min-height: 60px;'

          if (subgroup.foods.length === 0) {
            subgroupFoodsDiv.innerHTML =
              '<p class="empty-subgroup-message" style="color: #999; font-size: 12px; margin: 10px; position: absolute; width: 100%; text-align: center; pointer-events: none;">No foods in this subgroup</p>'
          } else {
            subgroup.foods.forEach((food) => {
              const foodDiv = document.createElement('div')
              foodDiv.className = 'food-item'

              foodDiv.innerHTML = `
              ${
                food.imageUrl
                  ? `<img src="${food.imageUrl}" class="food-image" data-category-id="${category.id}" data-subgroup-id="${subgroup.id}" data-food-id="${food.id}">`
                  : `<div class="food-image no-image" data-category-id="${category.id}" data-subgroup-id="${subgroup.id}" data-food-id="${food.id}">No Image</div>`
              }
              <div class="food-name">${this.escapeHtml(food.name)}</div>
            `

              const imageElement = foodDiv.querySelector('.food-image')
              const listenerId = `food-image-${category.id}-${subgroup.id}-${food.id}`

              const clickHandler = (e) => {
                if (window.dietHelper.isBulkSelectMode) {
                  e.preventDefault()
                  e.stopPropagation()
                  // Need to update bulk select for subgroups
                } else {
                  window.dietHelper.showSubgroupFoodDetails(category.id, subgroup.id, food.id)
                }
              }

              this.addEventListenerWithCleanup(foodDiv, 'click', clickHandler, listenerId)
              this.currentFoodElements.push(listenerId)

              subgroupFoodsDiv.appendChild(foodDiv)
            })
          }

          subgroupDiv.appendChild(subgroupFoodsDiv)
          subgroupsGrid.appendChild(subgroupDiv)
        })
        categoryDiv.appendChild(subgroupsGrid)
      }

      // Add "Add Subgroup" button if in edit mode
      if (actualEditMode) {
        const addSubgroupBtn = document.createElement('button')
        addSubgroupBtn.textContent = '+ Add Subgroup'
        addSubgroupBtn.style.cssText =
          'margin: 10px; padding: 5px 15px; background: #e9ecef; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;'
        addSubgroupBtn.onclick = () => window.dietHelper.showAddSubgroupForm(category.id)
        categoryDiv.appendChild(addSubgroupBtn)
      }

      // Render direct category foods
      const foodsDiv = document.createElement('div')
      foodsDiv.id = `foods-${category.id}`
      // Only add min-height if there are no subgroups or if there are direct foods
      const needsMinHeight =
        !category.subgroups || category.subgroups.length === 0 || category.foods.length > 0
      foodsDiv.style.cssText = `display: flex; flex-wrap: wrap; margin: 10px 0; position: relative; ${needsMinHeight ? 'min-height: 80px;' : ''}`

      if (category.foods.length === 0 && (!category.subgroups || category.subgroups.length === 0)) {
        foodsDiv.innerHTML =
          '<p class="empty-category-message" style="color: #666; margin: 40px 0; position: absolute; width: 100%; text-align: center; pointer-events: none;">No foods in this category</p>'
      } else if (
        category.foods.length === 0 &&
        category.subgroups &&
        category.subgroups.length > 0
      ) {
        // Don't add any content or height for empty direct foods when subgroups exist
        foodsDiv.style.display = 'none'
      } else if (category.foods.length > 0) {
        const directFoodsLabel = document.createElement('div')
        directFoodsLabel.style.cssText = 'width: 100%; font-size: 12px; color: #666; margin: 5px 0;'
        directFoodsLabel.textContent = 'Direct foods:'
        foodsDiv.appendChild(directFoodsLabel)

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
          const listenerId = `food-image-${category.id}-${food.id}`

          const clickHandler = (e) => {
            if (window.dietHelper.isBulkSelectMode) {
              e.preventDefault()
              e.stopPropagation()
              window.dietHelper.toggleFoodSelection(category.id, food.id)
            } else {
              if (e.target.classList.contains('food-image')) {
                window.dietHelper.showCategoryFoodDetails(category.id, food.id)
              }
            }
          }

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

    // Create a container for inline tags
    const tagsContainer = document.createElement('div')
    tagsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;'

    tags.forEach((tag) => {
      const tagButton = document.createElement('div')
      tagButton.className = 'selectable-tag'
      tagButton.dataset.tagId = tag.id
      tagButton.textContent = this.escapeHtml(tag.name)

      // Add click handler
      tagButton.addEventListener('click', () => {
        tagButton.classList.toggle('selected')
      })

      tagsContainer.appendChild(tagButton)
    })

    this.elements.tagsList.appendChild(tagsContainer)
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

    // Create a grid container
    const tagsGrid = document.createElement('div')
    tagsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;'

    tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'tag-item'
      tagDiv.style.cssText =
        'display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border: 1px solid #ddd; border-radius: 5px;'

      const tagName = document.createElement('span')
      tagName.textContent = this.escapeHtml(tag.name)
      tagName.style.cssText =
        'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'delete-tag-btn'
      deleteBtn.setAttribute('data-tag-id', tag.id)
      deleteBtn.textContent = '−'
      deleteBtn.style.cssText =
        'width: 24px; height: 24px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;'

      // Add hover effect
      deleteBtn.onmouseover = () => {
        deleteBtn.style.background = '#c82333'
      }
      deleteBtn.onmouseout = () => {
        deleteBtn.style.background = '#dc3545'
      }

      tagDiv.appendChild(tagName)
      tagDiv.appendChild(deleteBtn)

      const clickHandler = () => {
        window.dietHelper.deleteTag(tag.id)
      }

      const listenerId = `delete-tag-${tag.id}`
      this.addEventListenerWithCleanup(deleteBtn, 'click', clickHandler, listenerId)
      this.currentTagElements.push(listenerId)

      tagsGrid.appendChild(tagDiv)
    })

    this.elements.existingTags.appendChild(tagsGrid)
  }
  // Show food details in modal
  showFoodDetails(food, tags) {
    const tagNames = food.tags
      .map((tagId) => {
        const tag = tags.find((t) => t.id === tagId)
        return tag ? tag.name : ''
      })
      .filter((name) => name)

    // Set food name as header
    this.elements.detailsName.textContent = food.name

    // Set image
    this.elements.detailsImage.src = food.imageUrl || ''
    this.elements.detailsImage.style.display = food.imageUrl ? 'block' : 'none'

    if (!food.imageUrl) {
      this.elements.detailsImage.style.display = 'block'
      this.elements.detailsImage.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }

    // Display tags as badges
    // Display tags with commas
    const tagsContainer = document.getElementById('detailsTags')
    if (tagNames.length > 0) {
      tagsContainer.textContent = tagNames.join(', ')
      tagsContainer.style.color = '#495057'
    } else {
      tagsContainer.innerHTML = '<span style="color: #999; font-style: italic;">No tags</span>'
    }

    // Show notes
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

    // Show nutrition
    const hasNutrition = food.nutrition && typeof food.nutrition === 'object'

    if (hasNutrition) {
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

    // Show specific data
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

    // Clear tag selections (updated for new system)
    const selectedTags = document.querySelectorAll('.selectable-tag.selected')
    selectedTags.forEach((tag) => tag.classList.remove('selected'))
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
  getSelectedEditTags() {
    const selectedTags = []
    // Look for selected tags in the edit modal
    const selectedElements = document.querySelectorAll('#editTagsList .selectable-tag.selected')
    selectedElements.forEach((el) => {
      selectedTags.push(parseInt(el.dataset.tagId))
    })
    return selectedTags
  }
  // Get form input values
  getFoodFormData() {
    return {
      name: document.getElementById('foodName')?.value.trim() || '',
      image: document.getElementById('foodImage')?.files[0] || null,
      tags: this.getSelectedFoodTags(),
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

    // Create a container for inline tags
    const tagsContainer = document.createElement('div')
    tagsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;'

    tags.forEach((tag) => {
      const tagButton = document.createElement('div')
      tagButton.className = 'selectable-tag'
      tagButton.dataset.tagId = tag.id
      tagButton.textContent = this.escapeHtml(tag.name)

      // Pre-select if it was already selected
      if (selectedTagIds.includes(tag.id)) {
        tagButton.classList.add('selected')
      }

      // Add click handler
      tagButton.addEventListener('click', () => {
        tagButton.classList.toggle('selected')
      })

      tagsContainer.appendChild(tagButton)
    })

    container.appendChild(tagsContainer)
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
  getSelectedFoodTags() {
    const selectedTags = []
    const selectedElements = document.querySelectorAll('#tagsList .selectable-tag.selected')
    selectedElements.forEach((el) => {
      selectedTags.push(parseInt(el.dataset.tagId))
    })
    return selectedTags
  }

  // FIXED: Cleanup method to be called when UIManager is destroyed
  destroy() {
    this.cleanup()
  }
}

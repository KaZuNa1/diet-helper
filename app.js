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
    document.getElementById('manageTagsBtn').addEventListener('click', () => {
      this.showManageTagsForm()
    })

    document.getElementById('editModeBtn').addEventListener('click', () => {
      this.toggleEditMode()
    })

    document.getElementById('addCategoryBtn').addEventListener('click', () => {
      this.showAddCategoryForm()
    })

    document.getElementById('saveCategoryBtn').addEventListener('click', () => {
      this.saveCategory()
    })

    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
      this.hideAddCategoryForm()
    })

    document.getElementById('saveFoodBtn').addEventListener('click', () => {
      this.saveFood()
    })

    document.getElementById('cancelFoodBtn').addEventListener('click', () => {
      this.hideAddFoodForm()
    })

    document.getElementById('addTagBtn').addEventListener('click', () => {
      this.addTag()
    })

    document.getElementById('closeFoodDetailsBtn').addEventListener('click', () => {
      this.hideFoodDetails()
    })

    document.getElementById('deleteFoodBtn').addEventListener('click', () => {
      this.deleteFood()
    })

    document.getElementById('closeTagsBtn').addEventListener('click', () => {
      this.hideManageTagsForm()
    })

    document.getElementById('bulkSelectBtn').addEventListener('click', () => {
      this.toggleBulkSelectMode()
    })

    document.getElementById('editFoodBtn').addEventListener('click', () => {
      this.editFood()
    })

    document.getElementById('updateFoodBtn').addEventListener('click', () => {
      this.updateFood()
    })

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      this.hideEditFoodForm()
    })

    document.getElementById('saveSubgroupBtn').addEventListener('click', () => {
      this.saveSubgroup()
    })

    document.getElementById('cancelSubgroupBtn').addEventListener('click', () => {
      this.hideAddSubgroupForm()
    })
  }

  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)

      if (e.key === 'Escape') {
        e.preventDefault()
        this.modalManager.closeActiveModal()
        return
      }

      if (isInputActive && e.key !== 'Escape') return

      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        if (this.categories.length === 0) {
          this.showAddCategoryForm()
        } else if (this.categories.length === 1) {
          this.showAddFoodForm(this.categories[0].id)
        } else {
          this.showCategorySelector()
        }
      }

      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        this.showManageTagsForm()
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        this.handleSaveShortcut()
      }

      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        if (!this.isFilterPanelOpen) {
          this.toggleFilterPanel()
        }
        setTimeout(() => {
          const firstTag = document.querySelector('.filter-tag-item input')
          if (firstTag) firstTag.focus()
        }, 100)
      }

      if (e.key === 'Delete' && this.isBulkSelectMode && this.selectedFoods.size > 0) {
        e.preventDefault()
        this.bulkDelete()
      }

      if (e.key === '/' && !isInputActive) {
        e.preventDefault()
        this.showKeyboardShortcutsHelp()
      }
    })
  }

  showCategorySelector() {
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

    document.body.appendChild(overlay)
    document.body.appendChild(selectorModal)

    const closeSelector = () => {
      overlay.remove()
      selectorModal.remove()
    }

    selectorModal.querySelectorAll('.category-select-btn').forEach((btn, index) => {
      btn.onclick = () => {
        const categoryId = parseInt(btn.dataset.id)
        closeSelector()
        this.showAddFoodForm(categoryId)
      }

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
        const tagInput = document.getElementById('newTagName')
        if (tagInput && tagInput.value.trim()) {
          this.addTag()
        }
        break
    }
  }

  showKeyboardShortcutsHelp() {
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

    document.body.appendChild(overlay)
    document.body.appendChild(helpModal)

    const closeHelp = () => {
      overlay.remove()
      helpModal.remove()
    }

    overlay.onclick = closeHelp
    document.getElementById('closeHelpBtn').onclick = closeHelp

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

    this.currentFoodId = foodId
    this.uiManager.showFoodDetails(food, this.tags)
    this.modalManager.showFoodDetails()
  }

  hideFoodDetails() {
    this.currentFoodId = null
    this.currentCategoryId = null
    this.currentSubgroupId = null // Add this line
    this.modalManager.hideFoodDetails()

    setTimeout(() => {
      if (document.activeElement === document.body) {
        document.activeElement.blur()
      }
      document.body.removeAttribute('tabIndex')
      document.body.style.overflow = 'auto'
      document.body.offsetHeight
    }, 50)
  }
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

  async performDeleteFood(foodId) {
    try {
      let food = null

      // Check if we're deleting from a subgroup
      if (this.currentSubgroupId) {
        const category = this.categories.find((c) => c.id === this.currentCategoryId)
        if (category && category.subgroups) {
          const subgroup = category.subgroups.find((s) => s.id === this.currentSubgroupId)
          if (subgroup) {
            food = subgroup.foods.find((f) => f.id === foodId)
            subgroup.foods = subgroup.foods.filter((f) => f.id !== foodId)
          }
        }
      } else if (this.currentCategoryId) {
        const category = this.categories.find((c) => c.id === this.currentCategoryId)
        if (category) {
          food = category.foods.find((f) => f.id === foodId)
          category.foods = category.foods.filter((f) => f.id !== foodId)
        }
      } else {
        food = this.foods.find((f) => f.id === foodId)
        this.foods = this.foods.filter((f) => f.id !== foodId)
      }

      if (food && food.imageUrl && !food.imageUrl.startsWith('data:')) {
        await this.dataManager.deleteImage(food.imageUrl)
      }

      // Reset all current IDs
      this.currentFoodId = null
      this.currentCategoryId = null
      this.currentSubgroupId = null

      await this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)
      this.hideFoodDetails()

      if (typeof require !== 'undefined') {
        setTimeout(() => {
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

    let imageUrl = ''
    if (formData.image) {
      const imageResult = await this.dataManager.saveImage(formData.image)
      if (imageResult.success) {
        imageUrl = imageResult.path
      }
    }

    saveBtn.disabled = false
    saveBtn.textContent = originalText

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

    const validation = this.dataManager.validateFood(newFood)
    if (!validation.isValid) {
      alert('Invalid food data: ' + validation.errors.join(', '))
      return
    }

    if (this.currentSubgroupId) {
      const category = this.categories.find((c) => c.id === this.currentCategoryId)
      if (category) {
        const subgroup = category.subgroups.find((s) => s.id === this.currentSubgroupId)
        if (subgroup) {
          subgroup.foods.push(newFood)
        }
      }
    } else if (this.currentCategoryId) {
      const category = this.categories.find((c) => c.id === this.currentCategoryId)
      if (category) {
        category.foods.push(newFood)
      }
    } else {
      this.foods.push(newFood)
    }

    this.currentSubgroupId = null
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
    this.modalManager.showConfirmation(CONFIG.MESSAGES.CONFIRMATIONS.DELETE_TAG, () => {
      this.performDeleteTag(tagId)
    })
  }

  async performDeleteTag(tagId) {
    this.tags = this.tags.filter((tag) => tag.id !== tagId)
    this.foods.forEach((food) => {
      food.tags = food.tags.filter((id) => id !== tagId)
    })
    await this.saveAllData()
    this.uiManager.renderExistingTags(this.tags)
    this.selectedFilterTags.delete(tagId)
    this.renderFilterTags()
    this.applyFilters()
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

  showAddSubgroupForm(categoryId) {
    this.currentCategoryId = categoryId
    document.getElementById('subgroupNameInput').value = ''
    this.uiManager.hideError('subgroupNameError')
    this.modalManager.showAddSubgroup()
  }

  hideAddSubgroupForm() {
    this.modalManager.hideAddSubgroup()
  }

  saveSubgroup() {
    const subgroupName = document.getElementById('subgroupNameInput').value.trim()

    if (!subgroupName) {
      this.uiManager.showError('subgroupNameError', 'Please enter subgroup name')
      return
    }

    this.addSubgroup(this.currentCategoryId, subgroupName)
    this.hideAddSubgroupForm()
  }

  addSubgroup(categoryId, name) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const newSubgroup = {
      id: Date.now(),
      name: name,
      foods: [],
    }

    if (!category.subgroups) {
      category.subgroups = []
    }

    category.subgroups.push(newSubgroup)
    this.saveAllData()
    this.uiManager.renderCategories(this.categories, this.isEditMode)
  }

  deleteSubgroup(categoryId, subgroupId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const subgroup = category.subgroups.find((s) => s.id === subgroupId)
    if (!subgroup) return

    const message =
      subgroup.foods.length > 0
        ? `Delete "${subgroup.name}" and move its ${subgroup.foods.length} foods to main category?`
        : `Delete empty subgroup "${subgroup.name}"?`

    this.modalManager.showConfirmation(message, () => {
      if (subgroup.foods.length > 0) {
        category.foods.push(...subgroup.foods)
      }
      category.subgroups = category.subgroups.filter((s) => s.id !== subgroupId)
      this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    })
  }

  startRenameSubgroup(categoryId, subgroupId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const subgroup = category.subgroups.find((s) => s.id === subgroupId)
    if (!subgroup) return

    const nameSpan = document.getElementById(`subgroupName-${subgroupId}`)
    if (!nameSpan) return

    const originalName = subgroup.name

    const input = document.createElement('input')
    input.type = 'text'
    input.value = subgroup.name
    input.style.cssText = 'font-weight: bold; padding: 2px 5px; font-size: 14px;'

    nameSpan.parentNode.replaceChild(input, nameSpan)
    input.focus()
    input.select()

    const saveRename = () => {
      const newName = input.value.trim()
      if (newName && newName !== originalName) {
        subgroup.name = newName
        this.saveAllData()
      }
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    }

    input.addEventListener('blur', saveRename)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveRename()
      } else if (e.key === 'Escape') {
        this.uiManager.renderCategories(this.categories, this.isEditMode)
      }
    })
  }

  showSubgroupFoodDetails(categoryId, subgroupId, foodId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    const subgroup = category.subgroups.find((s) => s.id === subgroupId)
    if (!subgroup) return

    const food = subgroup.foods.find((f) => f.id === foodId)
    if (!food) return

    this.currentFoodId = foodId
    this.currentCategoryId = categoryId
    this.currentSubgroupId = subgroupId

    this.uiManager.showFoodDetails(food, this.tags)
    this.modalManager.showFoodDetails()
  }

  showAddFoodToSubgroup(categoryId, subgroupId) {
    this.modalManager.closeActiveModal()
    this.currentCategoryId = categoryId
    this.currentSubgroupId = subgroupId
    this.uiManager.renderTagsForSelection(this.tags)
    this.modalManager.showAddFood()
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode

    const editBtn = document.getElementById('editModeBtn')
    const bulkSelectBtn = document.getElementById('bulkSelectBtn')

    editBtn.textContent = this.isEditMode ? 'Done' : 'Edit'
    editBtn.style.backgroundColor = this.isEditMode ? '#28a745' : ''
    bulkSelectBtn.style.display = this.isEditMode ? 'inline-block' : 'none'

    const container = document.getElementById('categoriesContainer')

    if (this.isEditMode) {
      container.classList.add('edit-mode')
      if (this.isBulkSelectMode) {
        this.toggleBulkSelectMode()
      }
    } else {
      container.classList.remove('edit-mode')
      if (this.isBulkSelectMode) {
        this.toggleBulkSelectMode()
      }
    }

    this.uiManager.renderCategories(this.categories, this.isEditMode)

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

    this.categorySortable = Sortable.create(container, {
      animation: 150,
      handle: '.category-header',
      draggable: '.category-container',
      scroll: true,
      forceAutoScrollFallback: true,
      scrollSensitivity: 100,
      scrollSpeed: 20,
      onEnd: (evt) => {
        const movedCategory = this.categories.splice(evt.oldIndex, 1)[0]
        this.categories.splice(evt.newIndex, 0, movedCategory)
        this.saveAllData()
      },
    })

    this.enableFoodSorting()
  }

  disableCategorySorting() {
    if (this.categorySortable) {
      this.categorySortable.destroy()
      this.categorySortable = null
    }
    this.disableFoodSorting()
  }

  enableFoodSorting() {
    const sharedGroup = 'shared-foods'

    const handleDragStart = (evt) => {
      document.querySelectorAll('.empty-category-message').forEach((msg) => {
        msg.style.display = 'none'
      })
      document.querySelectorAll('.empty-subgroup-message').forEach((msg) => {
        msg.style.display = 'none'
      })
    }

    const handleDragEnd = (evt) => {
      this.categories.forEach((category) => {
        const foodsContainer = document.getElementById(`foods-${category.id}`)
        if (foodsContainer) {
          const foodItems = foodsContainer.querySelectorAll('.food-item')
          const emptyMsg = foodsContainer.querySelector('.empty-category-message')

          if (foodItems.length === 0) {
            if (!emptyMsg) {
              const msg = document.createElement('p')
              msg.className = 'empty-category-message'
              msg.style.cssText =
                'color: #666; margin: 40px 0; position: absolute; width: 100%; text-align: center; pointer-events: none;'
              msg.textContent = 'No foods in this category'
              foodsContainer.appendChild(msg)
            } else {
              emptyMsg.style.display = 'block'
            }
          }
        }

        if (category.subgroups) {
          category.subgroups.forEach((subgroup) => {
            const subgroupContainer = document.getElementById(`subgroup-foods-${subgroup.id}`)
            if (subgroupContainer) {
              const foodItems = subgroupContainer.querySelectorAll('.food-item')
              const emptyMsg = subgroupContainer.querySelector('.empty-subgroup-message')

              if (foodItems.length === 0) {
                if (!emptyMsg) {
                  const msg = document.createElement('p')
                  msg.className = 'empty-subgroup-message'
                  msg.style.cssText =
                    'color: #999; font-size: 12px; margin: 10px; position: absolute; width: 100%; text-align: center; pointer-events: none;'
                  msg.textContent = 'No foods in this subgroup'
                  subgroupContainer.appendChild(msg)
                } else {
                  emptyMsg.style.display = 'block'
                }
              }
            }
          })
        }
      })
    }

    const handleFoodMove = (evt) => {
      if (evt.from === evt.to && evt.oldIndex === evt.newIndex) return

      const fromId = evt.from.id
      const toId = evt.to.id

      const movedElement = evt.item
      const foodImage = movedElement.querySelector('.food-image')
      if (!foodImage) return

      const foodId = parseInt(foodImage.dataset.foodId)

      let movedFood = null
      const fromParts = fromId.split('-')

      if (fromParts[0] === 'foods') {
        const fromCategoryId = parseInt(fromParts[1])
        const sourceCategory = this.categories.find((c) => c.id === fromCategoryId)
        if (sourceCategory) {
          const foodIndex = sourceCategory.foods.findIndex((f) => f.id === foodId)
          if (foodIndex !== -1) {
            movedFood = sourceCategory.foods.splice(foodIndex, 1)[0]
          }
        }
      } else if (fromParts[0] === 'subgroup' && fromParts[1] === 'foods') {
        const subgroupId = parseInt(fromParts[2])
        this.categories.forEach((category) => {
          if (category.subgroups) {
            const subgroup = category.subgroups.find((s) => s.id === subgroupId)
            if (subgroup) {
              const foodIndex = subgroup.foods.findIndex((f) => f.id === foodId)
              if (foodIndex !== -1) {
                movedFood = subgroup.foods.splice(foodIndex, 1)[0]
              }
            }
          }
        })
      }

      if (movedFood) {
        const toParts = toId.split('-')

        if (toParts[0] === 'foods') {
          const toCategoryId = parseInt(toParts[1])
          const destCategory = this.categories.find((c) => c.id === toCategoryId)
          if (destCategory) {
            destCategory.foods.splice(evt.newIndex, 0, movedFood)
          }
        } else if (toParts[0] === 'subgroup' && toParts[1] === 'foods') {
          const subgroupId = parseInt(toParts[2])
          this.categories.forEach((category) => {
            if (category.subgroups) {
              const subgroup = category.subgroups.find((s) => s.id === subgroupId)
              if (subgroup) {
                subgroup.foods.splice(evt.newIndex, 0, movedFood)
              }
            }
          })
        }

        this.saveAllData()
      }
    }

    this.categories.forEach((category) => {
      const foodsContainer = document.getElementById(`foods-${category.id}`)
      if (foodsContainer) {
        this.foodSortables[`category-${category.id}`] = Sortable.create(foodsContainer, {
          group: sharedGroup,
          animation: 150,
          draggable: '.food-item',
          scroll: true,
          scrollSensitivity: 30,
          scrollSpeed: 10,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          onStart: handleDragStart,
          onEnd: (evt) => {
            handleFoodMove(evt)
            handleDragEnd(evt)
          },
        })
      }

      if (category.subgroups) {
        category.subgroups.forEach((subgroup) => {
          const subgroupFoodsContainer = document.getElementById(`subgroup-foods-${subgroup.id}`)
          if (subgroupFoodsContainer) {
            this.foodSortables[`subgroup-${subgroup.id}`] = Sortable.create(
              subgroupFoodsContainer,
              {
                group: sharedGroup,
                animation: 150,
                draggable: '.food-item',
                scroll: true,
                scrollSensitivity: 30,
                scrollSpeed: 10,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onStart: handleDragStart,
                onEnd: (evt) => {
                  handleFoodMove(evt)
                  handleDragEnd(evt)
                },
              }
            )
          }
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

    const originalName = category.name

    const input = document.createElement('input')
    input.type = 'text'
    input.value = category.name
    input.style.cssText = 'font-weight: bold; padding: 2px 5px; margin-right: 10px;'

    nameSpan.parentNode.replaceChild(input, nameSpan)
    input.focus()
    input.select()

    const saveRename = () => {
      const newName = input.value.trim()
      if (newName && newName !== originalName) {
        category.name = newName
        this.saveAllData()
      }
      this.uiManager.renderCategories(this.categories, this.isEditMode)
    }

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
    this.currentSubgroupId = null // Make sure this is null for direct foods

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

  initializeFilterPanel() {
    const filterHeader = document.getElementById('filterHeader')
    filterHeader.addEventListener('click', () => this.toggleFilterPanel())

    const clearBtn = document.getElementById('clearFiltersBtn')
    clearBtn.addEventListener('click', () => this.clearAllFilters())

    this.renderFilterTags()

    const filterModeToggle = document.getElementById('filterModeToggle')
    filterModeToggle.addEventListener('change', () => {
      this.applyFilters()
    })
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen = !this.isFilterPanelOpen

    const filterContent = document.getElementById('filterContent')
    const filterToggle = document.getElementById('filterToggle')

    if (this.isFilterPanelOpen) {
      filterContent.style.height = 'auto'
      const height = filterContent.scrollHeight
      filterContent.style.height = '0'
      filterContent.offsetHeight
      filterContent.style.height = height + 'px'
      filterContent.classList.add('open')
      filterToggle.classList.add('open')
    } else {
      filterContent.style.height = filterContent.scrollHeight + 'px'
      filterContent.offsetHeight
      filterContent.style.height = '0'
      filterContent.classList.remove('open')
      filterToggle.classList.remove('open')
    }
  }

  renderFilterTags() {
    const filterTagsContainer = document.getElementById('filterTags')
    filterTagsContainer.innerHTML = ''

    this.tags.forEach((tag) => {
      const tagDiv = document.createElement('div')
      tagDiv.className = 'filter-tag-item'
      if (this.selectedFilterTags.has(tag.id)) {
        tagDiv.classList.add('selected')
      }

      tagDiv.textContent = tag.name
      tagDiv.dataset.tagId = tag.id

      tagDiv.addEventListener('click', () => {
        this.toggleFilterTag(tag.id)
      })

      filterTagsContainer.appendChild(tagDiv)
    })

    this.updateFilterCount()
  }

  toggleFilterTag(tagId) {
    if (this.selectedFilterTags.has(tagId)) {
      this.selectedFilterTags.delete(tagId)
    } else {
      this.selectedFilterTags.add(tagId)
    }

    this.renderFilterTags()
    this.applyFilters()
  }

  clearAllFilters() {
    this.selectedFilterTags.clear()
    this.renderFilterTags()
    this.applyFilters()
  }

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

  applyFilters() {
    const allFoodItems = document.querySelectorAll('.food-item')
    const useOrLogic = document.getElementById('filterModeToggle').checked

    if (this.selectedFilterTags.size === 0) {
      allFoodItems.forEach((item) => {
        item.classList.remove('filtered-out')
      })
      return
    }

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
          shouldShow = food.tags.some((tagId) => this.selectedFilterTags.has(tagId))
        } else {
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
    this.isBulkSelectMode = !this.isBulkSelectMode
    const bulkSelectBtn = document.getElementById('bulkSelectBtn')
    const container = document.getElementById('categoriesContainer')

    if (this.isBulkSelectMode) {
      bulkSelectBtn.textContent = 'Cancel Select'
      bulkSelectBtn.style.backgroundColor = '#dc3545'
      container.classList.add('bulk-select-mode')
      this.selectedFoods.clear()
      this.showBulkActionsBar()
      this.disableFoodSorting()
    } else {
      bulkSelectBtn.textContent = 'Select'
      bulkSelectBtn.style.backgroundColor = ''
      container.classList.remove('bulk-select-mode')
      this.selectedFoods.clear()
      this.hideBulkActionsBar()
      if (this.isEditMode) {
        this.enableFoodSorting()
      }
      document.querySelectorAll('.food-item.selected').forEach((item) => {
        item.classList.remove('selected')
      })
    }
  }

  showBulkActionsBar() {
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

  toggleFoodSelection(categoryId, foodId, subgroupId = null) {
    const key = subgroupId ? `${categoryId}-${subgroupId}-${foodId}` : `${categoryId}-${foodId}`

    const foodElement = subgroupId
      ? document.querySelector(
          `.food-image[data-category-id="${categoryId}"][data-subgroup-id="${subgroupId}"][data-food-id="${foodId}"]`
        )?.parentElement
      : document.querySelector(
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
        const subgroupId = img.dataset.subgroupId

        if (categoryId && foodId) {
          const key = subgroupId
            ? `${categoryId}-${subgroupId}-${foodId}`
            : `${categoryId}-${foodId}`
          this.selectedFoods.add(key)
          item.classList.add('selected')
        }
      }
    })

    this.updateBulkActionsBar()
  }

  unselectAll() {
    this.selectedFoods.clear()
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
      for (const key of this.selectedFoods) {
        const parts = key.split('-')

        if (parts.length === 3) {
          // Format: categoryId-subgroupId-foodId
          const [categoryId, subgroupId, foodId] = parts.map(Number)
          const category = this.categories.find((c) => c.id === categoryId)

          if (category && category.subgroups) {
            const subgroup = category.subgroups.find((s) => s.id === subgroupId)
            if (subgroup) {
              const food = subgroup.foods.find((f) => f.id === foodId)
              if (food && food.imageUrl && !food.imageUrl.startsWith('data:')) {
                await this.dataManager.deleteImage(food.imageUrl)
              }
              subgroup.foods = subgroup.foods.filter((f) => f.id !== foodId)
            }
          }
        } else if (parts.length === 2) {
          // Format: categoryId-foodId (direct foods)
          const [categoryId, foodId] = parts.map(Number)
          const category = this.categories.find((c) => c.id === categoryId)

          if (category) {
            const food = category.foods.find((f) => f.id === foodId)
            if (food && food.imageUrl && !food.imageUrl.startsWith('data:')) {
              await this.dataManager.deleteImage(food.imageUrl)
            }
            category.foods = category.foods.filter((f) => f.id !== foodId)
          }
        }
      }

      await this.saveAllData()
      this.uiManager.renderCategories(this.categories, this.isEditMode)
      this.toggleBulkSelectMode()
    })
  }

  editFood() {
    if (!this.currentFoodId) return

    let food = null
    let categoryId = this.currentCategoryId

    this.editingFoodId = this.currentFoodId
    this.editingCategoryId = this.currentCategoryId

    if (categoryId) {
      const category = this.categories.find((c) => c.id === categoryId)
      food = category?.foods.find((f) => f.id === this.currentFoodId)
    } else {
      food = this.foods.find((f) => f.id === this.currentFoodId)
    }

    if (!food) return

    this.populateEditForm(food)
    this.modalManager.showEditFood()
  }

  populateEditForm(food) {
    document.getElementById('editFoodName').value = food.name || ''
    document.getElementById('editFoodNotes').value = food.notes || ''
    document.getElementById('editFoodSpecificData').value = food.specificData || ''

    const previewDiv = document.getElementById('currentImagePreview')
    if (food.imageUrl) {
      previewDiv.innerHTML = `
      <img src="${food.imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;">
      <p style="font-size: 12px; color: #666; margin: 5px 0;">Current image (upload new to replace)</p>
    `
    } else {
      previewDiv.innerHTML = ''
    }

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

    this.uiManager.renderTagsForEdit(this.tags, food.tags)
  }

  hideEditFoodForm() {
    this.modalManager.hideEditFood()
    document.getElementById('editFoodImage').value = ''
    document.getElementById('currentImagePreview').innerHTML = ''
  }

  async updateFood() {
    const formData = this.uiManager.getEditFoodFormData()

    if (!formData.name) {
      this.uiManager.showError('editFoodNameError', 'Please enter food name')
      this.uiManager.focusElement('editFoodName')
      return
    }

    this.uiManager.hideError('editFoodNameError')

    let food = null
    let category = null

    if (this.editingCategoryId) {
      category = this.categories.find((c) => c.id === this.editingCategoryId)
      food = category?.foods.find((f) => f.id === this.editingFoodId)
    } else {
      food = this.foods.find((f) => f.id === this.editingFoodId)
    }

    if (!food) {
      return
    }

    const updateBtn = document.getElementById('updateFoodBtn')
    const originalText = updateBtn.textContent
    updateBtn.disabled = true
    updateBtn.textContent = 'Updating...'

    let imageUrl = food.imageUrl
    if (formData.image) {
      if (food.imageUrl && !food.imageUrl.startsWith('data:')) {
        await this.dataManager.deleteImage(food.imageUrl)
      }
      const imageResult = await this.dataManager.saveImage(formData.image)
      if (imageResult.success) {
        imageUrl = imageResult.path
      }
    }

    food.name = formData.name
    food.imageUrl = imageUrl
    food.notes = formData.notes
    food.nutrition = formData.nutrition
    food.specificData = formData.specificData
    food.tags = formData.tags

    updateBtn.disabled = false
    updateBtn.textContent = originalText

    await this.saveAllData()
    this.uiManager.renderCategories(this.categories, this.isEditMode)

    let updatedFood = null
    if (this.editingCategoryId) {
      const category = this.categories.find((c) => c.id === this.editingCategoryId)
      updatedFood = category?.foods.find((f) => f.id === this.editingFoodId)
    } else {
      updatedFood = this.foods.find((f) => f.id === this.editingFoodId)
    }

    this.hideEditFoodForm()

    if (updatedFood) {
      this.uiManager.showFoodDetails(updatedFood, this.tags)
    }

    this.editingFoodId = null
    this.editingCategoryId = null
  }
}

const dietHelper = new DietHelper()
window.dietHelper = dietHelper

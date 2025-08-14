import { CONFIG } from './config.js'

export class ModalManager {
  constructor() {
    this.modals = {
      foodDetails: {
        modal: document.getElementById('foodDetailsDropdown'),
        overlay: this.createOverlay('foodDetailsOverlay'),
      },
      addFood: {
        modal: document.getElementById('addFoodDropdown'),
        overlay: this.createOverlay('addFoodOverlay'),
      },
      manageTags: {
        modal: document.getElementById('manageTagsDropdown'),
        overlay: this.createOverlay('manageTagsOverlay'),
      },
      addCategory: {
        modal: document.getElementById('addCategoryDropdown'),
        overlay: this.createOverlay('addCategoryOverlay'),
      },
      confirmation: {
        modal: document.getElementById('confirmationDropdown'),
        overlay: this.createOverlay('confirmationOverlay'),
      },
      editFood: {
        modal: document.getElementById('editFoodDropdown'),
        overlay: this.createOverlay('editFoodOverlay'),
      },
      addSubgroup: {
        modal: document.getElementById('addSubgroupDropdown'),
        overlay: this.createOverlay('addSubgroupOverlay'),
      },
    }

    this.activeModal = null
    this.initializeEventListeners()
    this.replaceSharedOverlay()
  }

  createOverlay(id) {
    const overlay = document.createElement('div')
    overlay.id = id
    overlay.className = 'modal-overlay'
    overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `
    document.body.appendChild(overlay)
    return overlay
  }

  replaceSharedOverlay() {
    const oldOverlay = document.getElementById('modalOverlay')
    if (oldOverlay) {
      oldOverlay.style.display = 'none !important'
      oldOverlay.style.visibility = 'hidden'
      oldOverlay.replaceWith(oldOverlay.cloneNode(true))
    }
  }

  initializeEventListeners() {
    Object.keys(this.modals).forEach((modalType) => {
      const { overlay } = this.modals[modalType]
      if (overlay) {
        overlay.addEventListener('click', () => {
          this.closeModal(modalType)
        })
      }
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModal()
      }
    })

    Object.values(this.modals).forEach(({ modal }) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          e.stopPropagation()
        })
      }
    })
  }

  showModal(modalType) {
    if (modalType === 'editFood' && this.activeModal === 'foodDetails') {
      // Keep food details open when showing edit modal
    } else {
      this.closeActiveModal()
    }

    const { modal, overlay } = this.modals[modalType]
    if (!modal || !overlay) return

    if (modalType === 'editFood' && this.activeModal === 'foodDetails') {
      this._previousModal = this.activeModal
    }

    this.activeModal = modalType

    modal.style.width = ''
    modal.style.height = ''
    modal.style.maxWidth = '90vw'
    modal.style.maxHeight = '90vh'

    overlay.style.display = 'block'
    overlay.classList.add('active')
    modal.classList.add('active')

    document.body.style.overflow = 'hidden'

    if (CONFIG.FEATURES.ANIMATIONS_ENABLED) {
      this.animateIn(modalType)
    }
  }

  showModalStacked(modalType) {
    const { modal, overlay } = this.modals[modalType]
    if (!modal || !overlay) return

    this._previousModal = this.activeModal
    this.activeModal = modalType

    modal.style.width = ''
    modal.style.height = ''
    modal.style.maxWidth = '90vw'
    modal.style.maxHeight = '90vh'

    overlay.style.display = 'block'
    overlay.classList.add('active')
    modal.classList.add('active')

    document.body.style.overflow = 'hidden'

    if (CONFIG.FEATURES.ANIMATIONS_ENABLED) {
      this.animateIn(modalType)
    }
  }

  hideModal(modalType) {
    const { modal, overlay } = this.modals[modalType]
    if (!modal || !overlay) return

    overlay.style.display = 'none'
    overlay.classList.remove('active')
    modal.classList.remove('active')

    if (this.activeModal === modalType) {
      if (this._previousModal) {
        this.activeModal = this._previousModal
        this._previousModal = null
      } else {
        this.activeModal = null
      }
    }

    if (!this.activeModal) {
      document.body.style.overflow = 'auto'
      document.body.removeAttribute('tabIndex')
    }
  }

  hideModalStacked(modalType) {
    const { modal, overlay } = this.modals[modalType]
    if (!modal || !overlay) return

    overlay.style.display = 'none'
    overlay.classList.remove('active')
    modal.classList.remove('active')

    this.activeModal = this._previousModal || null
    this._previousModal = null

    if (!this.activeModal) {
      document.body.style.overflow = 'auto'
      document.body.removeAttribute('tabIndex')
    }
  }

  closeModal(modalType) {
    this.hideModal(modalType)
  }

  showFoodDetails() {
    this.showModal('foodDetails')
  }

  hideFoodDetails() {
    this.hideModal('foodDetails')
  }

  showAddFood() {
    this.showModal('addFood')
    setTimeout(() => {
      const nameInput = document.getElementById('foodName')
      if (nameInput) nameInput.focus()
    }, 100)
  }

  hideAddFood() {
    this.hideModal('addFood')
  }

  showManageTags() {
    this.showModal('manageTags')
    setTimeout(() => {
      const tagInput = document.getElementById('newTagName')
      if (tagInput) tagInput.focus()
    }, 100)
  }

  hideManageTags() {
    this.hideModal('manageTags')
  }

  showAddCategory() {
    this.showModal('addCategory')
    setTimeout(() => {
      const input = document.getElementById('categoryNameInput')
      if (input) input.focus()
    }, 100)
  }

  hideAddCategory() {
    this.hideModal('addCategory')
  }

  closeActiveModal() {
    if (this.activeModal) {
      this.hideModal(this.activeModal)
    }
    document.body.removeAttribute('tabIndex')
    document.body.removeAttribute('tabindex')
  }

  resetAllOverlays() {
    Object.values(this.modals).forEach(({ overlay }) => {
      if (overlay) {
        overlay.style.display = 'none'
        overlay.classList.remove('active')
      }
    })
    document.body.style.pointerEvents = ''
    document.body.style.overflow = ''
  }

  isModalOpen() {
    return this.activeModal !== null
  }

  showAddSubgroup() {
    this.showModal('addSubgroup')
    setTimeout(() => {
      const input = document.getElementById('subgroupNameInput')
      if (input) input.focus()
    }, 100)
  }

  hideAddSubgroup() {
    this.hideModal('addSubgroup')
  }

  getActiveModal() {
    return this.activeModal
  }

  showConfirmation(message, onConfirm, onCancel, title) {
    onCancel = onCancel || null
    title = title || 'Confirm Delete'

    this._confirmCallback = onConfirm
    this._cancelCallback = onCancel

    document.getElementById('confirmTitle').textContent = title
    document.getElementById('confirmMessage').textContent = message

    this.showModalStacked('confirmation')

    const yesBtn = document.getElementById('confirmYesBtn')
    const noBtn = document.getElementById('confirmNoBtn')

    const handleYes = () => {
      this.hideModalStacked('confirmation')
      if (this._confirmCallback) {
        this._confirmCallback()
      }
      cleanup()
    }

    const handleNo = () => {
      this.hideModalStacked('confirmation')
      if (this._cancelCallback) {
        this._cancelCallback()
      }
      cleanup()
    }

    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleYes()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleNo()
      }
    }

    const cleanup = () => {
      yesBtn.removeEventListener('click', handleYes)
      noBtn.removeEventListener('click', handleNo)
      document.removeEventListener('keydown', handleKeydown)
      this._confirmCallback = null
      this._cancelCallback = null
    }

    yesBtn.addEventListener('click', handleYes)
    noBtn.addEventListener('click', handleNo)
    document.addEventListener('keydown', handleKeydown)

    setTimeout(() => yesBtn.focus(), 100)
  }

  showLoading(modalType, message = 'Loading...') {
    const { modal } = this.modals[modalType]
    if (modal) {
      const loadingDiv = document.createElement('div')
      loadingDiv.id = `modalLoading_${modalType}`
      loadingDiv.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `
      loadingDiv.innerHTML = `<p style="color: #666;">${message}</p>`
      modal.style.position = 'relative'
      modal.appendChild(loadingDiv)
    }
  }

  hideLoading(modalType = null) {
    if (modalType) {
      const loadingDiv = document.getElementById(`modalLoading_${modalType}`)
      if (loadingDiv) {
        loadingDiv.remove()
      }
    } else {
      Object.keys(this.modals).forEach((type) => {
        const loadingDiv = document.getElementById(`modalLoading_${type}`)
        if (loadingDiv) {
          loadingDiv.remove()
        }
      })
    }
  }

  animateIn(modalType) {
    const { modal } = this.modals[modalType]
    if (modal) {
      modal.style.transform = 'translate(-50%, -60%) scale(0.9)'
      modal.style.opacity = '0'

      requestAnimationFrame(() => {
        modal.style.transition = `all ${CONFIG.UI.MODAL_ANIMATION_DURATION}ms ease-out`
        modal.style.transform = 'translate(-50%, -50%) scale(1)'
        modal.style.opacity = '1'
      })
    }
  }

  showEditFood() {
    this.showModal('editFood')
    setTimeout(() => {
      const nameInput = document.getElementById('editFoodName')
      if (nameInput) nameInput.focus()
    }, 100)
  }

  hideEditFood() {
    this.hideModal('editFood')
  }

  destroy() {
    Object.values(this.modals).forEach(({ overlay }) => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    })
    document.body.style.overflow = 'auto'
    this.activeModal = null
  }
}

import { CONFIG } from './config.js';

export class ModalManager {
    constructor() {
        // FIXED: Create individual overlays for each modal type for better isolation
        this.modals = {
            foodDetails: {
                modal: document.getElementById('foodDetailsDropdown'),
                overlay: this.createOverlay('foodDetailsOverlay')
            },
            addFood: {
                modal: document.getElementById('addFoodDropdown'),
                overlay: this.createOverlay('addFoodOverlay')
            },
            manageTags: {
                modal: document.getElementById('manageTagsDropdown'),
                overlay: this.createOverlay('manageTagsOverlay')
            }
        };

        this.activeModal = null;
        this.initializeEventListeners();
        this.replaceSharedOverlay();
    }

    // FIXED: Create individual overlay for each modal
    createOverlay(id) {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // FIXED: Replace the shared overlay system
    // FIXED: Replace the shared overlay system
// FIXED: Replace the shared overlay system
replaceSharedOverlay() {
    // Don't remove the overlay, just disable its functionality
    const oldOverlay = document.getElementById('modalOverlay');
    if (oldOverlay) {
        oldOverlay.style.display = 'none !important';
        oldOverlay.style.visibility = 'hidden';
        // Remove any existing event listeners
        oldOverlay.replaceWith(oldOverlay.cloneNode(true));
    }
}

    initializeEventListeners() {
        // FIXED: Add individual click handlers for each overlay
        Object.keys(this.modals).forEach(modalType => {
            const { overlay } = this.modals[modalType];
            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.closeModal(modalType);
                });
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });

        // Prevent modal content clicks from closing modal
        Object.values(this.modals).forEach(({ modal }) => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        });
    }

    // FIXED: Generic method to show any modal
    showModal(modalType) {
    this.closeActiveModal(); // Close any open modal first
    
    const { modal, overlay } = this.modals[modalType];
    if (!modal || !overlay) return;

    this.activeModal = modalType;
    
    // FIXED: Reset modal dimensions to prevent size issues
    modal.style.width = '';
    modal.style.height = '';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '90vh';
    
    overlay.style.display = 'block';
    overlay.classList.add('active');
    modal.classList.add('active');
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    // Add animation if enabled
    if (CONFIG.FEATURES.ANIMATIONS_ENABLED) {
        this.animateIn(modalType);
    }
}

    // FIXED: Generic method to hide any modal
    hideModal(modalType) {
        const { modal, overlay } = this.modals[modalType];
        if (!modal || !overlay) return;

        const doHide = () => {
            overlay.style.display = 'none';
            overlay.classList.remove('active');
            modal.classList.remove('active');
            
            if (this.activeModal === modalType) {
                this.activeModal = null;
                document.body.style.overflow = 'auto';
            }
        };

        if (CONFIG.FEATURES.ANIMATIONS_ENABLED) {
            this.animateOut(modalType, doHide);
        } else {
            doHide();
        }
    }

    // FIXED: Close specific modal
    closeModal(modalType) {
        this.hideModal(modalType);
    }

    // Show food details modal
    showFoodDetails() {
        this.showModal('foodDetails');
    }

    // Hide food details modal
    hideFoodDetails() {
        this.hideModal('foodDetails');
    }

    // Show add food modal
    showAddFood() {
        this.showModal('addFood');
        
        // Focus on first input
        setTimeout(() => {
            const nameInput = document.getElementById('foodName');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    // Hide add food modal
    hideAddFood() {
        this.hideModal('addFood');
    }

    // Show manage tags modal
    showManageTags() {
        this.showModal('manageTags');
        
        // Focus on tag input
        setTimeout(() => {
            const tagInput = document.getElementById('newTagName');
            if (tagInput) tagInput.focus();
        }, 100);
    }

    // Hide manage tags modal
    hideManageTags() {
        this.hideModal('manageTags');
    }

    // Close currently active modal
    closeActiveModal() {
        if (this.activeModal) {
            this.hideModal(this.activeModal);
        }
    }

    // Check if any modal is open
    isModalOpen() {
        return this.activeModal !== null;
    }

    // Get currently active modal
    getActiveModal() {
        return this.activeModal;
    }

    // Show confirmation dialog
    showConfirmation(message, onConfirm, onCancel = null) {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
        return confirmed;
    }

    // Show loading state in modal
    showLoading(modalType, message = 'Loading...') {
        const { modal } = this.modals[modalType];
        if (modal) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = `modalLoading_${modalType}`;
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
            `;
            loadingDiv.innerHTML = `<p style="color: #666;">${message}</p>`;
            modal.style.position = 'relative';
            modal.appendChild(loadingDiv);
        }
    }

    // Hide loading state
    hideLoading(modalType = null) {
        if (modalType) {
            const loadingDiv = document.getElementById(`modalLoading_${modalType}`);
            if (loadingDiv) {
                loadingDiv.remove();
            }
        } else {
            // Remove all loading divs
            Object.keys(this.modals).forEach(type => {
                const loadingDiv = document.getElementById(`modalLoading_${type}`);
                if (loadingDiv) {
                    loadingDiv.remove();
                }
            });
        }
    }

    // Animate modal entrance
    animateIn(modalType) {
        const { modal } = this.modals[modalType];
        if (modal) {
            modal.style.transform = 'translate(-50%, -60%) scale(0.9)';
            modal.style.opacity = '0';
            
            // Trigger animation
            requestAnimationFrame(() => {
                modal.style.transition = `all ${CONFIG.UI.MODAL_ANIMATION_DURATION}ms ease-out`;
                modal.style.transform = 'translate(-50%, -50%) scale(1)';
                modal.style.opacity = '1';
            });
        }
    }

    // Animate modal exit
    animateOut(modalType, callback = null) {
        const { modal } = this.modals[modalType];
        if (modal) {
            modal.style.transition = `all ${CONFIG.UI.MODAL_ANIMATION_DURATION * 0.75}ms ease-in`;
            modal.style.transform = 'translate(-50%, -60%) scale(0.9)';
            modal.style.opacity = '0';
            
            setTimeout(() => {
                modal.style.transition = '';
                modal.style.transform = '';
                modal.style.opacity = '';
                if (callback) callback();
            }, CONFIG.UI.MODAL_ANIMATION_DURATION * 0.75);
        } else if (callback) {
            callback();
        }
    }

    // Enhanced show methods with animation (keeping for backward compatibility)
    showFoodDetailsAnimated() {
        this.showFoodDetails();
    }

    showAddFoodAnimated() {
        this.showAddFood();
    }

    showManageTagsAnimated() {
        this.showManageTags();
    }

    // Enhanced hide methods with animation (keeping for backward compatibility)
    hideFoodDetailsAnimated() {
        this.hideFoodDetails();
    }

    hideAddFoodAnimated() {
        this.hideAddFood();
    }

    hideManageTagsAnimated() {
        this.hideManageTags();
    }

    // FIXED: Cleanup method for proper resource management
    destroy() {
        // Remove created overlays
        Object.values(this.modals).forEach(({ overlay }) => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        // Reset body overflow
        document.body.style.overflow = 'auto';
        
        this.activeModal = null;
    }
}
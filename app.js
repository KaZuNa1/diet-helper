import { CONFIG } from './config.js';
import { Food } from './models.js';
import { DataManager } from './data.js';
import { UIManager } from './ui.js';
import { ModalManager } from './modal.js';

class DietHelper {
    constructor() {
        this.foods = [];
        this.tags = [];
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.modalManager = new ModalManager();
        this.init();
    }

    async init() {
        const result = await this.dataManager.loadData();
        if (result.success) {
            this.foods = result.data.foods;
            this.tags = result.data.tags;
        }
        this.initializeEventListeners();
        this.uiManager.renderFoods(this.foods, this.tags);
    }

    initializeEventListeners() {
        // Add Food Button
        document.getElementById('addFoodBtn').addEventListener('click', () => {
            this.showAddFoodForm();
        });

        // Manage Tags Button
        document.getElementById('manageTagsBtn').addEventListener('click', () => {
            this.showManageTagsForm();
        });

        // Save Food Button
        document.getElementById('saveFoodBtn').addEventListener('click', () => {
            this.saveFood();
        });

        // Cancel Food Button
        document.getElementById('cancelFoodBtn').addEventListener('click', () => {
            this.hideAddFoodForm();
        });

        // Add Tag Button
        document.getElementById('addTagBtn').addEventListener('click', () => {
            this.addTag();
        });

        // Close Food Details Button
        document.getElementById('closeFoodDetailsBtn').addEventListener('click', () => {
            this.hideFoodDetails();
        });

        // Close Tags Button
        document.getElementById('closeTagsBtn').addEventListener('click', () => {
            this.hideManageTagsForm();
        });
    }

    showAddFoodForm() {
        this.uiManager.renderTagsForSelection(this.tags);
        this.modalManager.showAddFood();
    }

    hideAddFoodForm() {
        this.modalManager.hideAddFood();
        this.uiManager.clearFoodForm();
    }

    showManageTagsForm() {
        this.uiManager.renderExistingTags(this.tags);
        this.modalManager.showManageTags();
    }

    hideManageTagsForm() {
        this.modalManager.hideManageTags();
    }

    showFoodDetails(foodId) {
        const food = this.foods.find(f => f.id === foodId);
        if (!food) return;

        this.uiManager.showFoodDetails(food, this.tags);
        this.modalManager.showFoodDetails();
    }

    hideFoodDetails() {
        this.modalManager.hideFoodDetails();
    }

    async saveFood() {
        const formData = this.uiManager.getFoodFormData();
        
        if (!formData.name) {
            this.uiManager.showError('foodNameError', CONFIG.MESSAGES.ERRORS.FOOD_NAME_REQUIRED);
            this.uiManager.focusElement('foodName');
            return;
        }
        
        this.uiManager.hideError('foodNameError');

        // Handle image
        let imageUrl = '';
        if (formData.image) {
            this.modalManager.showLoading('addFood', 'Saving image...');
            const imageResult = await this.dataManager.saveImage(formData.image);
            this.modalManager.hideLoading();
            
            if (imageResult.success) {
                imageUrl = imageResult.path;
            }
        }

        this.createAndSaveFood(formData.name, imageUrl, formData.tags);
    }

    async createAndSaveFood(name, imageUrl, selectedTags) {
        const newFood = new Food(
            Date.now(),
            name,
            imageUrl,
            false,
            selectedTags
        );

        // Validate food data
        const validation = this.dataManager.validateFood(newFood);
        if (!validation.isValid) {
            alert('Invalid food data: ' + validation.errors.join(', '));
            return;
        }

        this.foods.push(newFood);
        await this.saveAllData();
        this.uiManager.renderFoods(this.foods, this.tags);
        this.hideAddFoodForm();
    }

    async addTag() {
        const formData = this.uiManager.getTagFormData();
        
        if (!formData.name) {
            this.uiManager.showError('tagNameError', CONFIG.MESSAGES.ERRORS.TAG_NAME_REQUIRED);
            this.uiManager.focusElement('newTagName');
            return;
        }
        
        this.uiManager.hideError('tagNameError');

        const newTag = {
            id: Date.now(),
            name: formData.name
        };

        // Validate tag data
        const validation = this.dataManager.validateTag(newTag);
        if (!validation.isValid) {
            alert('Invalid tag data: ' + validation.errors.join(', '));
            return;
        }

        this.tags.push(newTag);
        this.uiManager.clearTagForm();
        await this.saveAllData();
        this.uiManager.renderExistingTags(this.tags);
    }

    async deleteTag(tagId) {
        const confirmed = this.modalManager.showConfirmation(
            CONFIG.MESSAGES.CONFIRMATIONS.DELETE_TAG,
            () => {
                this.performDeleteTag(tagId);
            }
        );
    }

    async performDeleteTag(tagId) {
        this.tags = this.tags.filter(tag => tag.id !== tagId);
        // Remove tag from all foods
        this.foods.forEach(food => {
            food.tags = food.tags.filter(id => id !== tagId);
        });
        await this.saveAllData();
        this.uiManager.renderExistingTags(this.tags);
        // Re-render foods in case any displayed foods had this tag
        this.uiManager.renderFoods(this.foods, this.tags);
    }

    async saveAllData() {
        const data = {
            foods: this.foods,
            tags: this.tags
        };
        
        const result = await this.dataManager.saveData(data);
        if (!result.success) {
            console.error('Failed to save data:', result.error);
            alert(CONFIG.MESSAGES.ERRORS.SAVE_FAILED);
        }
    }
}

// Initialize the app
const dietHelper = new DietHelper();

// Make available for HTML onclick handlers (only this instance)
window.dietHelper = dietHelper;
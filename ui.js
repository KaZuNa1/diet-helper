import { CONFIG } from './config.js';

export class UIManager {
    constructor() {
        this.elements = {
    categoriesContainer: document.getElementById('categoriesContainer'),
    tagsList: document.getElementById('tagsList'),
    existingTags: document.getElementById('existingTags'),
    detailsImage: document.getElementById('detailsImage'),
    detailsName: document.getElementById('detailsName'),
    detailsTags: document.getElementById('detailsTags')
};
        
        // FIXED: Track event listeners for cleanup
        this.eventListeners = new Map();
        this.currentFoodElements = [];
        this.currentTagElements = [];
    }

    // FIXED: Add event listener with cleanup tracking
    addEventListenerWithCleanup(element, event, handler, identifier) {
        // Remove existing listener if it exists
        this.removeEventListener(identifier);
        
        // Add new listener
        element.addEventListener(event, handler);
        
        // Store for cleanup
        this.eventListeners.set(identifier, {
            element,
            event,
            handler
        });
    }

    // FIXED: Remove specific event listener
    removeEventListener(identifier) {
        const listener = this.eventListeners.get(identifier);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(identifier);
        }
    }

    // FIXED: Clean up all event listeners
    cleanup() {
        this.eventListeners.forEach((listener, identifier) => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();
        this.currentFoodElements = [];
        this.currentTagElements = [];
    }

    // FIXED: Render all foods in grid layout with proper event management
    renderCategories(categories, tags) {
    this.cleanup();
    this.elements.categoriesContainer.innerHTML = '';

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-container';
        categoryDiv.style.cssText = 'border: 1px solid #ccc; margin: 10px; padding: 10px;';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 10px;';
        
        headerDiv.innerHTML = `
            <button onclick="window.dietHelper.showAddFoodForm(${category.id})" style="padding: 5px 10px;">+ Add Food</button>
            <div>
                <span id="categoryName-${category.id}" 
      style="margin-right: 10px; font-weight: bold; cursor: pointer; padding: 2px 5px;" 
      ondblclick="window.dietHelper.startRenameCategory(${category.id})"
      title="Double-click to rename">${this.escapeHtml(category.name)}</span>
<button onclick="window.dietHelper.startRenameCategory(${category.id})" style="padding: 5px 10px;">Rename</button>
                <button onclick="window.dietHelper.deleteCategory(${category.id})" style="padding: 5px 10px;">Delete</button>
            </div>
        `;
        
        categoryDiv.appendChild(headerDiv);
        
        const foodsDiv = document.createElement('div');
        foodsDiv.style.cssText = 'display: flex; flex-wrap: wrap;';
        
        if (category.foods.length === 0) {
            foodsDiv.innerHTML = '<p style="color: #666;">No foods in this category</p>';
        } else {
            category.foods.forEach(food => {
                const foodDiv = document.createElement('div');
                foodDiv.className = 'food-item';
                
                foodDiv.innerHTML = `
                    ${food.imageUrl ? 
                        `<img src="${food.imageUrl}" class="food-image" data-category-id="${category.id}" data-food-id="${food.id}">` : 
                        `<div class="food-image" style="background: #f0f0f0; line-height: 100px; cursor: pointer;" data-category-id="${category.id}" data-food-id="${food.id}">No Image</div>`
                    }
                    <div class="food-name">${this.escapeHtml(food.name)}</div>
                `;
                
                const imageElement = foodDiv.querySelector('.food-image');
                const clickHandler = () => {
                    window.dietHelper.showCategoryFoodDetails(category.id, food.id);
                };
                
                const listenerId = `food-image-${category.id}-${food.id}`;
                this.addEventListenerWithCleanup(imageElement, 'click', clickHandler, listenerId);
                this.currentFoodElements.push(listenerId);
                
                foodsDiv.appendChild(foodDiv);
            });
        }
        
        categoryDiv.appendChild(foodsDiv);
        this.elements.categoriesContainer.appendChild(categoryDiv);
    });
}

    // Render tags for selection in food form
    renderTagsForSelection(tags) {
        this.elements.tagsList.innerHTML = '';

        if (tags.length === 0) {
            const noTagsMsg = document.createElement('p');
            noTagsMsg.textContent = 'No tags available. Add some tags first!';
            noTagsMsg.style.color = '#666';
            noTagsMsg.style.fontSize = '12px';
            this.elements.tagsList.appendChild(noTagsMsg);
            return;
        }

        tags.forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.className = 'tag-item';
            tagDiv.innerHTML = `
                <input type="checkbox" class="tag-checkbox" value="${tag.id}" id="tag_${tag.id}">
                <label for="tag_${tag.id}">${this.escapeHtml(tag.name)}</label>
            `;
            this.elements.tagsList.appendChild(tagDiv);
        });
    }

    // FIXED: Render existing tags in manage tags form with proper event management
    renderExistingTags(tags) {
        // Clean up existing tag event listeners
        this.currentTagElements.forEach(identifier => {
            this.removeEventListener(identifier);
        });
        this.currentTagElements = [];

        this.elements.existingTags.innerHTML = '';

        if (tags.length === 0) {
            const noTagsMsg = document.createElement('p');
            noTagsMsg.textContent = 'No tags created yet.';
            noTagsMsg.style.color = '#666';
            noTagsMsg.style.fontSize = '12px';
            this.elements.existingTags.appendChild(noTagsMsg);
            return;
        }

        tags.forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.className = 'tag-item';
            tagDiv.innerHTML = `
                <span>${this.escapeHtml(tag.name)}</span>
                <button class="delete-tag-btn" data-tag-id="${tag.id}" style="margin-left: 10px; padding: 2px 8px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
            `;
            
            // FIXED: Add click event listener with cleanup tracking
            const deleteBtn = tagDiv.querySelector('.delete-tag-btn');
            const clickHandler = () => {
                window.dietHelper.deleteTag(tag.id);
            };
            
            const listenerId = `delete-tag-${tag.id}`;
            this.addEventListenerWithCleanup(deleteBtn, 'click', clickHandler, listenerId);
            this.currentTagElements.push(listenerId);
            
            this.elements.existingTags.appendChild(tagDiv);
        });
    }

    // Show food details in modal
    showFoodDetails(food, tags) {
        const tagNames = food.tags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? tag.name : '';
        }).filter(name => name);

        // Populate details
        this.elements.detailsImage.src = food.imageUrl || '';
        this.elements.detailsImage.style.display = food.imageUrl ? 'block' : 'none';
        this.elements.detailsImage.style.width = CONFIG.UI.FOOD_IMAGE_SIZE.MODAL.width + 'px';
        this.elements.detailsImage.style.height = CONFIG.UI.FOOD_IMAGE_SIZE.MODAL.height + 'px';
        
        if (!food.imageUrl) {
            // Show placeholder for no image
            this.elements.detailsImage.style.display = 'block';
            this.elements.detailsImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        }
        
        this.elements.detailsName.textContent = food.name;
        this.elements.detailsTags.textContent = tagNames.length > 0 ? `Tags: ${tagNames.join(', ')}` : 'No tags';
    }

    // Clear food form
    clearFoodForm() {
        const nameField = document.getElementById('foodName');
        const imageField = document.getElementById('foodImage');
        const errorDiv = document.getElementById('foodNameError');
        
        if (nameField) nameField.value = '';
        if (imageField) imageField.value = '';
        if (errorDiv) errorDiv.classList.add('hidden');
        
        // Clear tag selections
        const checkboxes = document.querySelectorAll('.tag-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
    }

    // Clear tag form
    clearTagForm() {
        const tagField = document.getElementById('newTagName');
        const errorDiv = document.getElementById('tagNameError');
        
        if (tagField) tagField.value = '';
        if (errorDiv) errorDiv.classList.add('hidden');
    }

    // Show/hide error messages
    showError(elementId, message = null) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            // Use provided message or default from config
            const errorMessage = message || CONFIG.MESSAGES.ERRORS.FOOD_NAME_REQUIRED;
            errorDiv.textContent = errorMessage;
            errorDiv.classList.remove('hidden');
        }
    }

    hideError(elementId) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    // Get selected tags from checkboxes
    getSelectedTags() {
        const selectedTags = [];
        const checkboxes = document.querySelectorAll('.tag-checkbox:checked');
        checkboxes.forEach(cb => {
            selectedTags.push(parseInt(cb.value));
        });
        return selectedTags;
    }

    // Get form input values
    getFoodFormData() {
        return {
            name: document.getElementById('foodName')?.value.trim() || '',
            image: document.getElementById('foodImage')?.files[0] || null,
            tags: this.getSelectedTags()
        };
    }

    getTagFormData() {
        return {
            name: document.getElementById('newTagName')?.value.trim() || ''
        };
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show loading state
    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<p style="text-align: center; color: #666;">${message}</p>`;
        }
    }

    // Focus on element
    focusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            setTimeout(() => element.focus(), 100);
        }
    }

    // FIXED: Cleanup method to be called when UIManager is destroyed
    destroy() {
        this.cleanup();
    }
}
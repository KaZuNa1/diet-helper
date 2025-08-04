import { CONFIG, ConfigUtils } from './config.js'

export class DataManager {
  constructor() {
    this.dataFile = CONFIG.FILES.DATA_FILE
    this.imagesDir = CONFIG.FILES.IMAGES_DIR
    this.hiddenCanvas = null // ADD THIS LINE
  }

  // Save data to JSON file
  async saveData(data) {
    try {
      if (typeof require !== 'undefined') {
        // Electron environment
        const { ipcRenderer } = require('electron')
        const result = await ipcRenderer.invoke('save-data', data)
        return result
      } else {
        // Browser fallback
        localStorage.setItem(CONFIG.STORAGE.MAIN_DATA, JSON.stringify(data))
        return { success: true }
      }
    } catch (error) {
      console.error('Error saving data:', error)
      return { success: false, error: error.message }
    }
  }

  // Load data from JSON file
  async loadData() {
    try {
      if (typeof require !== 'undefined') {
        // Electron environment
        const { ipcRenderer } = require('electron')
        const data = await ipcRenderer.invoke('load-data')
        return {
          success: true,
          data: {
            foods: data.foods || [],
            tags: data.tags || [],
            categories: data.categories || [],
          },
        }
      } else {
        // Browser fallback
        const data = JSON.parse(localStorage.getItem(CONFIG.STORAGE.MAIN_DATA) || '{}')
        return {
          success: true,
          data: {
            foods: data.foods || [],
            tags: data.tags || [],
            categories: data.categories || [],
          },
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      return {
        success: false,
        data: { foods: [], tags: [], categories: [] },
        error: error.message,
      }
    }
  }

  // Save image file - FIXED: Now converts to base64 for persistence
  async saveImage(imageFile) {
    try {
      if (!imageFile) {
        return { success: false, error: 'No image file provided' }
      }

      // Validate image using ConfigUtils
      const validation = ConfigUtils.validateImage(imageFile)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      if (typeof require !== 'undefined') {
        // Electron environment - save image to file system
        const reader = new FileReader()

        return new Promise((resolve) => {
          reader.onload = async (e) => {
            try {
              const { ipcRenderer } = require('electron')
              const fileName = `food_${Date.now()}.${imageFile.name.split('.').pop()}`
              const result = await ipcRenderer.invoke('save-image', e.target.result, fileName)
              resolve(result)
            } catch (error) {
              resolve({ success: false, error: error.message })
            }
          }
          reader.readAsDataURL(imageFile)
        })
      } else {
        // Browser fallback - convert to base64 for localStorage persistence
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              // Optionally compress image if it's too large
              const base64Data = e.target.result
              if (CONFIG.FEATURES.IMAGE_COMPRESSION && base64Data.length > 500000) {
                // ~375KB
                this.compressImage(base64Data, imageFile.type)
                  .then((compressedData) => {
                    resolve({ success: true, path: compressedData })
                  })
                  .catch((error) => {
                    console.warn('Image compression failed, using original:', error)
                    resolve({ success: true, path: base64Data })
                  })
              } else {
                resolve({ success: true, path: base64Data })
              }
            } catch (error) {
              resolve({ success: false, error: error.message })
            }
          }
          reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read image file' })
          }
          reader.readAsDataURL(imageFile)
        })
      }
    } catch (error) {
      console.error('Error saving image:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteImage(imagePath) {
    try {
      if (!imagePath) return { success: true }

      if (typeof require !== 'undefined') {
        // Electron environment - delete actual file
        try {
          const { ipcRenderer } = require('electron')
          const result = await ipcRenderer.invoke('delete-image', imagePath)
          return result
        } catch (electronError) {
          // If handler not registered, just log warning
          console.warn('Image deletion not implemented in Electron main process')
          return { success: true, warning: 'Image handler not registered' }
        }
      } else {
        // Browser environment - no file to delete (base64 stored in localStorage)
        return { success: true }
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      // Don't fail the food deletion if image deletion fails
      return { success: true, warning: 'Image file could not be deleted' }
    }
  }

  // Compress image to reduce storage size
  async compressImage(base64Data, mimeType) {
    return new Promise((resolve, reject) => {
      // FIXED: Create hidden canvas to prevent visual glitches
      if (!this.hiddenCanvas) {
        this.hiddenCanvas = document.createElement('canvas')
        this.hiddenCanvas.style.cssText = `
                position: absolute;
                left: -9999px;
                top: -9999px;
                visibility: hidden;
            `
        document.body.appendChild(this.hiddenCanvas)
      }

      const canvas = this.hiddenCanvas // Use hidden canvas instead of creating new one
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedData = canvas.toDataURL(mimeType || 'image/jpeg', CONFIG.IMAGES.QUALITY)
        resolve(compressedData)
      }

      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = base64Data
    })
  }

  // Validate food data
  validateFood(foodData) {
    const errors = []

    const nameValidation = ConfigUtils.validateFoodName(foodData.name)
    if (!nameValidation.valid) {
      errors.push(nameValidation.error)
    }

    if (!foodData.id || typeof foodData.id !== 'number') {
      errors.push('Food ID is required and must be a number')
    }

    if (foodData.tags && !Array.isArray(foodData.tags)) {
      errors.push('Tags must be an array')
    }

    if (foodData.tags && foodData.tags.length > CONFIG.VALIDATION.MAX_TAGS_PER_FOOD) {
      errors.push(CONFIG.MESSAGES.ERRORS.MAX_TAGS_PER_FOOD)
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    }
  }

  // Validate tag data
  validateTag(tagData) {
    const errors = []

    const nameValidation = ConfigUtils.validateTagName(tagData.name)
    if (!nameValidation.valid) {
      errors.push(nameValidation.error)
    }

    if (!tagData.id || typeof tagData.id !== 'number') {
      errors.push('Tag ID is required and must be a number')
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    }
  }

  // Create backup of current data
  async createBackup() {
    try {
      const loadResult = await this.loadData()
      if (!loadResult.success) {
        return { success: false, error: 'Failed to load current data for backup' }
      }

      const backupData = {
        ...loadResult.data,
        backupDate: new Date().toISOString(),
      }

      if (typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron')
        const backupFileName = `backup_${Date.now()}.json`
        // You'd need to add a backup IPC handler in main.js
        // const result = await ipcRenderer.invoke('create-backup', backupData, backupFileName);
        // return result;

        // For now, just return success
        return { success: true, message: 'Backup feature needs IPC handler implementation' }
      } else {
        localStorage.setItem(
          `${CONFIG.STORAGE.BACKUP_PREFIX}${Date.now()}`,
          JSON.stringify(backupData)
        )
        return { success: true, message: 'Backup created in localStorage' }
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      return { success: false, error: error.message }
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager
} else {
  window.DataManager = DataManager
}

const CONFIG = {
  // File paths and directories
  FILES: {
    DATA_FILE: 'data.json',
    BACKUP_DIR: 'backups',
    IMAGES_DIR: 'images',
    LOGS_DIR: 'logs',
  },

  // Storage keys for browser fallback
  STORAGE: {
    MAIN_DATA: 'dietHelperData',
    BACKUP_PREFIX: 'dietHelperBackup_',
    SETTINGS: 'dietHelperSettings',
  },

  // UI Configuration
  UI: {
    FOOD_IMAGE_SIZE: {
      GRID: { width: 75, height: 75 },
      MODAL: { width: 200, height: 200 },
    },
    MODAL_ANIMATION_DURATION: 200,
    GRID_COLUMNS: 'auto-fit',
    MIN_CARD_WIDTH: 120,
  },

  // Validation rules
  VALIDATION: {
    FOOD_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100,
      REQUIRED: true,
    },
    TAG_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50,
      REQUIRED: true,
    },
    MAX_TAGS_PER_FOOD: 10,
    MAX_TOTAL_TAGS: 100,
    MAX_TOTAL_FOODS: 1000,
  },

  // Image handling
  IMAGES: {
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    QUALITY: 0.8,
    THUMBNAIL_SIZE: { width: 100, height: 100 },
  },

  // Default data structure
  DEFAULTS: {
    EMPTY_DATA: {
      foods: [],
      tags: [],
    },
    NEW_FOOD: {
      id: null,
      name: '',
      imageUrl: '',
      selected: false,
      tags: [],
    },
    NEW_TAG: {
      id: null,
      name: '',
    },
  },

  // Error messages
  MESSAGES: {
    ERRORS: {
      FOOD_NAME_REQUIRED: 'Please enter food name',
      TAG_NAME_REQUIRED: 'Please enter tag name',
      FOOD_NAME_TOO_LONG: 'Food name is too long (max 100 characters)',
      TAG_NAME_TOO_LONG: 'Tag name is too long (max 50 characters)',
      INVALID_IMAGE_FORMAT: 'Unsupported image format. Please use JPG, PNG, GIF, or WebP',
      IMAGE_TOO_LARGE: 'Image file is too large (max 5MB)',
      SAVE_FAILED: 'Failed to save data. Please try again.',
      LOAD_FAILED: 'Failed to load data',
      MAX_FOODS_REACHED: 'Maximum number of foods reached (1000)',
      MAX_TAGS_REACHED: 'Maximum number of tags reached (100)',
      MAX_TAGS_PER_FOOD: 'Maximum 10 tags per food item',
      DELETE_FOOD_FAILED: 'Failed to delete food. Please try again.',
    },
    SUCCESS: {
      FOOD_SAVED: 'Food saved successfully',
      TAG_SAVED: 'Tag saved successfully',
      DATA_LOADED: 'Data loaded successfully',
      BACKUP_CREATED: 'Backup created successfully',
      FOOD_DELETED: 'Food deleted successfully',
    },
    CONFIRMATIONS: {
      DELETE_TAG: 'Are you sure you want to delete this tag? It will be removed from all foods.',
      DELETE_FOOD: 'Are you sure you want to delete this food item? This action cannot be undone.',
      CLEAR_ALL_DATA: 'Are you sure you want to clear all data? This cannot be undone.',
      RESTORE_BACKUP: 'Are you sure you want to restore from backup? Current data will be lost.',
    },
  },

  // Feature flags
  FEATURES: {
    ANIMATIONS_ENABLED: true,
    BACKUP_ENABLED: true,
    IMAGE_COMPRESSION: true,
    KEYBOARD_SHORTCUTS: true,
    DARK_MODE: false,
    EXPORT_IMPORT: true,
    STATISTICS: false,
  },

  // Keyboard shortcuts
  SHORTCUTS: {
    ADD_FOOD: 'Ctrl+N',
    MANAGE_TAGS: 'Ctrl+T',
    CLOSE_MODAL: 'Escape',
    SAVE: 'Ctrl+S',
    SEARCH: 'Ctrl+F',
    DELETE: 'Delete',
  },

  // Development settings
  DEBUG: {
    ENABLED: false,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    SHOW_PERFORMANCE: false,
  },

  // App metadata
  APP: {
    NAME: 'Diet Helper',
    VERSION: '1.0.0',
    AUTHOR: 'Your Name',
    DESCRIPTION: 'A simple diet management application',
  },

  // Environment detection
  ENV: {
    IS_ELECTRON: typeof require !== 'undefined',
    IS_DEVELOPMENT: false, // Will be set based on environment
  },
}

// Utility functions for config
const ConfigUtils = {
  // Get nested config value safely
  get(path, defaultValue = null) {
    const keys = path.split('.')
    let current = CONFIG

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return defaultValue
      }
    }

    return current
  },

  // Set nested config value
  set(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    let current = CONFIG

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }

    current[lastKey] = value
  },

  // Validate image file
  validateImage(file) {
    if (!file) return { valid: false, error: 'No file provided' }

    const extension = file.name.split('.').pop().toLowerCase()
    if (!CONFIG.IMAGES.SUPPORTED_FORMATS.includes(extension)) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.INVALID_IMAGE_FORMAT,
      }
    }

    if (file.size > CONFIG.IMAGES.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.IMAGE_TOO_LARGE,
      }
    }

    return { valid: true }
  },

  // Validate food name
  validateFoodName(name) {
    if (!name || name.trim().length === 0) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.FOOD_NAME_REQUIRED,
      }
    }

    if (name.length > CONFIG.VALIDATION.FOOD_NAME.MAX_LENGTH) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.FOOD_NAME_TOO_LONG,
      }
    }

    return { valid: true }
  },

  // Validate tag name
  validateTagName(name) {
    if (!name || name.trim().length === 0) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.TAG_NAME_REQUIRED,
      }
    }

    if (name.length > CONFIG.VALIDATION.TAG_NAME.MAX_LENGTH) {
      return {
        valid: false,
        error: CONFIG.MESSAGES.ERRORS.TAG_NAME_TOO_LONG,
      }
    }

    return { valid: true }
  },

  // Check if feature is enabled
  isFeatureEnabled(feature) {
    return CONFIG.FEATURES[feature] === true
  },

  // Get file path
  getFilePath(fileKey) {
    return CONFIG.FILES[fileKey] || ''
  },

  // Get storage key
  getStorageKey(keyName) {
    return CONFIG.STORAGE[keyName] || ''
  },

  // Debug logging
  log(level, message, data = null) {
    if (!CONFIG.DEBUG.ENABLED) return

    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(CONFIG.DEBUG.LOG_LEVEL)
    const messageLevelIndex = levels.indexOf(level)

    if (messageLevelIndex >= currentLevelIndex) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

      console[level === 'debug' ? 'log' : level](logMessage, data || '')
    }
  },
}

// Set environment
ConfigUtils.set('ENV.IS_DEVELOPMENT', window.location.hostname === 'localhost')

// Export using ES6 modules
export { CONFIG, ConfigUtils }

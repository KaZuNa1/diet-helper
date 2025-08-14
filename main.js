const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('save-data', async (event, data) => {
  try {
    const dataPath = path.join(__dirname, 'data.json')
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-data', async () => {
  try {
    const dataPath = path.join(__dirname, 'data.json')
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8')
      return JSON.parse(data)
    }
    return { foods: [], tags: [] }
  } catch (error) {
    return { foods: [], tags: [] }
  }
})

ipcMain.handle('save-image', async (event, imageData, fileName) => {
  try {
    const imagesDir = path.join(__dirname, 'images')
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir)
    }

    const imagePath = path.join(imagesDir, fileName)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(imagePath, base64Data, 'base64')

    return { success: true, path: path.join('images', fileName) }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-image', async (event, imagePath) => {
  try {
    const fs = require('fs').promises
    const path = require('path')

    const fullPath = path.join(__dirname, imagePath)

    try {
      await fs.access(fullPath)
      await fs.unlink(fullPath)
      return { success: true }
    } catch (err) {
      return { success: true }
    }
  } catch (error) {
    console.error('Error deleting image file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('force-focus', async () => {
  mainWindow.focus()
  mainWindow.webContents.focus()
  return { success: true }
})

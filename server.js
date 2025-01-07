import express from 'express'
import multer from 'multer'
import cors from 'cors'
import * as XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const upload = multer({ storage: multer.memoryStorage() })

// Middleware
app.use(cors())
app.use(express.json())

// API Endpoint
app.post('/api/transform', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = req.body.sheetName || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(worksheet)

    const { idField, amountField, descriptionField } = req.body
    if (!idField || !amountField || !descriptionField) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Transformation logic
    const groupedData = json.reduce((acc, row) => {
      const memberId = row[idField]
      if (!acc[memberId]) {
        acc[memberId] = {
          ...row,
          components: {}
        }
      }
      const component = row[descriptionField]
      acc[memberId].components[component] = (acc[memberId].components[component] || 0) + parseFloat(row[amountField])
      return acc
    }, {})

    const components = [...new Set(json.map(row => row[descriptionField]))]
    const transformed = Object.values(groupedData).map(member => {
      const newRow = { ...member }
      delete newRow.components
      components.forEach(comp => {
        newRow[comp] = member.components[comp] || 0
      })
      newRow.Gesamtbetrag = components.reduce((sum, comp) => sum + (newRow[comp] || 0), 0)
      return newRow
    })

    res.json({
      data: transformed,
      columns: [idField, ...components, 'Gesamtbetrag']
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error processing file' })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

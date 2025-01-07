// Update the API call in the transformData function to:
const transformData = async () => {
  if (!file || !selectedSheet || !idField || !amountField || !descriptionField) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('sheetName', selectedSheet)
  formData.append('idField', idField)
  formData.append('amountField', amountField)
  formData.append('descriptionField', descriptionField)

  try {
    const response = await fetch('/api/transform', {
      method: 'POST',
      body: formData
    })
    const data = await response.json()
    setTransformedData(data)
  } catch (error) {
    console.error('Error:', error)
  }
}

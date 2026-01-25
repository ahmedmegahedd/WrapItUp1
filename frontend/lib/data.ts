import api from './api'

export async function getProducts() {
  try {
    const response = await api.get('/products')
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProduct(slug: string) {
  try {
    const response = await api.get(`/products/slug/${slug}`)
    return response.data
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function getCollections(homepageOnly = false) {
  try {
    const response = await api.get('/collections', {
      params: homepageOnly ? { homepageOnly: 'true' } : {},
    })
    return response.data
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

export async function getCollection(slug: string) {
  try {
    const response = await api.get(`/collections/slug/${slug}`)
    return response.data
  } catch (error) {
    console.error('Error fetching collection:', error)
    return null
  }
}

export async function getTimeSlots() {
  try {
    const response = await api.get('/delivery/time-slots')
    return response.data
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return []
  }
}

export async function getDisabledDates() {
  try {
    const response = await api.get('/delivery/disabled-dates')
    return response.data
  } catch (error) {
    console.error('Error fetching disabled dates:', error)
    return []
  }
}

export async function getProductAddons(productId: string) {
  try {
    const response = await api.get(`/addons/product/${productId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching product add-ons:', error)
    return []
  }
}

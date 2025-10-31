import { API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

// POST: Añadir una ruta a favoritos
export const addFavorite = async (routeId, signal) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADD_FAVORITE(routeId), {
      method: 'POST',
      headers: getAuthHeaders(),
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'No se pudo añadir a favoritos.');
    }
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error en addFavorite:', error);
    }
    throw error;
  }
};

// DELETE: Eliminar una ruta de favoritos
export const removeFavorite = async (routeId, signal) => {
  try {
    const response = await fetch(API_ENDPOINTS.REMOVE_FAVORITE(routeId), {
      method: 'POST',
      headers: getAuthHeaders(),
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'No se pudo eliminar de favoritos.');
    }
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error en removeFavorite:', error);
    }
    throw error;
  }
};

// GET: Obtener las rutas favoritas de un usuario
export const getUserFavorites = async (userId, signal) => {
  try {
    const response = await fetch(API_ENDPOINTS.USER_FAVORITES(userId), {
      headers: getAuthHeaders(), // Aunque sea GET, puede que en el futuro se proteja
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'No se pudieron obtener las rutas favoritas.');
    }
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error en getUserFavorites:', error);
    }
    throw error;
  }
};
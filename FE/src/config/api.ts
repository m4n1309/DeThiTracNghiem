// Central API configuration
// - Development: uses VITE_API_URL from .env.development (http://localhost:3001/api)
// - Production: defaults to '/api' (proxied through nginx)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default API_BASE_URL;

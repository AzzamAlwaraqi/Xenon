export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const APP_NAME = 'Xenon'

export const ROLES = {
  CLIENT: 'client',
  VENDOR: 'vendor',
  ADMIN:  'admin',
}

export const HTTP_STATUS = {
  OK:           200,
  CREATED:      201,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  SERVER_ERROR: 500,
}

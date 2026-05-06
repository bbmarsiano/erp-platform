import type { ApiError, ApiResponse } from '../types/api.types.js'

export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message
})

export const createErrorResponse = (
  error: string,
  code: string,
  statusCode: number
): ApiError => ({
  success: false,
  error,
  code,
  statusCode
})

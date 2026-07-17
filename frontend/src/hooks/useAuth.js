export const useAuth = () => {
  // TODO: connect to auth store (Redux slice or Context)
  return {
    isAuthenticated: false,
    user: null,
    login:  async () => {},
    logout: async () => {},
  }
}

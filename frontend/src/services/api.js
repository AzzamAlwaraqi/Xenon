// TODO: Install axios → npm i axios
// import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
// })

// export default api
export { BASE_URL }

export function isSimultaneousLoginConflict(error) {
  return error?.status === 500 && /duplicate key|token_id_1/i.test(error.serverMessage || '')
}

function defaultDelay() {
  const milliseconds = 1100 + Math.floor(Math.random() * 1400)
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function retrySimultaneousLogin(operation, { attempts = 3, delay = defaultDelay } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (!isSimultaneousLoginConflict(error) || attempt === attempts - 1) throw error
      await delay(attempt)
    }
  }
  throw new Error('The login could not be completed after a simultaneous-session conflict.')
}

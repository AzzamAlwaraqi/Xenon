// Libraries
import { useEffect, useState } from 'react'

// Load API data while preventing updates after unmount
export default function useApi(load, dependencies = []) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let active = true

    load()
      .then((data) => {
        if (active) setState({ loading: false, data, error: '' })
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error: error.message })
      })

    return () => { active = false }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

import React, { createContext, useState } from 'react'

export const ApiStatusContext = createContext()

export function ApiStatusProvider({ children }) {
  const [apiConnected, setApiConnected] = useState(false)
  return (
    <ApiStatusContext.Provider value={{ apiConnected, setApiConnected }}>
      {children}
    </ApiStatusContext.Provider>
  )
} 
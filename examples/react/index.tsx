import React, { useEffect, useState } from 'react'
import { createStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { createAframeStore, createBridge, useAframeStore, useAframeState } from 'rtk-aframe-bridge'

// Example Redux slice
const gameSlice = {
  name: 'game',
  initialState: {
    player: {
      position: { x: 0, y: 0.5, z: -3 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    score: 0,
    level: 1,
    isPlaying: false
  },
  reducers: {
    updatePlayerPosition: (state: any, action: any) => {
      state.player.position = action.payload
    },
    updateScore: (state: any, action: any) => {
      state.score = action.payload
    },
    updateLevel: (state: any, action: any) => {
      state.level = action.payload
    },
    setPlaying: (state: any, action: any) => {
      state.isPlaying = action.payload
    }
  }
}

// Create Redux store
const store = createStore((state = gameSlice.initialState, action: any) => {
  switch (action.type) {
    case 'UPDATE_PLAYER_POSITION':
      return {
        ...state,
        player: {
          ...state.player,
          position: action.payload
        }
      }
    case 'UPDATE_SCORE':
      return {
        ...state,
        score: action.payload
      }
    case 'UPDATE_LEVEL':
      return {
        ...state,
        level: action.payload
      }
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload
      }
    default:
      return state
  }
})

// Create A-Frame store and bridge
const aframeStore = createAframeStore()
const bridge = createBridge({
  reduxStore: store,
  aframeStore: aframeStore,
  stateSelector: (state) => state
})

// Start the bridge
bridge.start()

// Game UI Component
function GameUI() {
  const gameState = useAframeStore(aframeStore)
  const score = useAframeState(aframeStore, 'score')
  const level = useAframeState(aframeStore, 'level')
  const isPlaying = useAframeState(aframeStore, 'isPlaying')

  const handleStartGame = () => {
    store.dispatch({ type: 'SET_PLAYING', payload: true })
  }

  const handleStopGame = () => {
    store.dispatch({ type: 'SET_PLAYING', payload: false })
  }

  const handleAddScore = () => {
    store.dispatch({ type: 'UPDATE_SCORE', payload: score + 10 })
  }

  const handleNextLevel = () => {
    store.dispatch({ type: 'UPDATE_LEVEL', payload: level + 1 })
  }

  const handleMovePlayer = () => {
    const x = (Math.random() - 0.5) * 4
    const z = -3 + (Math.random() - 0.5) * 4
    store.dispatch({ 
      type: 'UPDATE_PLAYER_POSITION', 
      payload: { x, y: 0.5, z } 
    })
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 1000, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Game Controls</h2>
      <div>
        <p>Score: {score}</p>
        <p>Level: {level}</p>
        <p>Playing: {isPlaying ? 'Yes' : 'No'}</p>
        <p>Player Position: {JSON.stringify(gameState.player.position)}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleStartGame} style={{ margin: '5px' }}>
          Start Game
        </button>
        <button onClick={handleStopGame} style={{ margin: '5px' }}>
          Stop Game
        </button>
        <button onClick={handleAddScore} style={{ margin: '5px' }}>
          Add Score
        </button>
        <button onClick={handleNextLevel} style={{ margin: '5px' }}>
          Next Level
        </button>
        <button onClick={handleMovePlayer} style={{ margin: '5px' }}>
          Move Player
        </button>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  return (
    <Provider store={store}>
      <div>
        <GameUI />
        <div id="aframe-scene">
          {/* A-Frame scene will be rendered here */}
        </div>
      </div>
    </Provider>
  )
}

export default App

# RTK-AFrame Bridge

A bridge between Redux Toolkit and A-Frame for synchronized state management. This package allows you to maintain a single source of truth in your Redux store while keeping your A-Frame scene in sync with real-time updates.

## Features

- 🔄 **Automatic State Synchronization**: Redux state changes automatically sync to A-Frame
- 🎯 **Selective State Updates**: Use selectors to sync only the state you need
- ⚡ **Real-time Updates**: A-Frame components react to state changes instantly
- 🎮 **A-Frame Components**: Built-in components for reactive state management
- 🔗 **React Integration**: Hooks for accessing A-Frame state from React components
- 📦 **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install rtk-aframe-bridge
```

## Quick Start

### 1. Setup Redux Store

```typescript
import { configureStore, createSlice } from "@reduxjs/toolkit";

const gameSlice = createSlice({
  name: "game",
  initialState: {
    player: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    score: 0,
    level: 1,
  },
  reducers: {
    updatePlayerPosition: (state, action) => {
      state.player.position = action.payload;
    },
    updateScore: (state, action) => {
      state.score = action.payload;
    },
  },
});

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
```

### 2. Create A-Frame Store and Bridge

```typescript
import { createAframeStore, createBridge } from "rtk-aframe-bridge";

// Create A-Frame store
const aframeStore = createAframeStore();

// Create bridge
const bridge = createBridge({
  reduxStore: store,
  aframeStore: aframeStore,
  stateSelector: (state) => state.game, // Only sync the game slice
});

// Start the bridge
bridge.start();
```

### 3. Register A-Frame Components

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <script src="https://unpkg.com/rtk-aframe-bridge/dist/index.js"></script>
  </head>
  <body>
    <a-scene>
      <!-- Register the store system -->
      <a-entity id="aframe-store" aframe-store-system></a-entity>

      <!-- Use reactive components -->
      <a-box
        position="0 1 -3"
        aframe-state-component="statePath: player.position"
        material="color: red"
      >
      </a-box>

      <a-text
        position="0 2 -3"
        aframe-state-component="statePath: score"
        value="Score: 0"
      >
      </a-text>
    </a-scene>
  </body>
</html>
```

### 4. React Integration

```typescript
import React from "react";
import { useAframeStore, useAframeState } from "rtk-aframe-bridge";

function GameUI({ aframeStore }) {
  const gameState = useAframeStore(aframeStore);
  const score = useAframeState(aframeStore, "score");

  return (
    <div>
      <h2>Score: {score}</h2>
      <p>Player Position: {JSON.stringify(gameState.player.position)}</p>
    </div>
  );
}
```

## API Reference

### Core Functions

#### `createAframeStore(initialState?)`

Creates an A-Frame store that mirrors Redux state.

#### `createBridge(config)`

Creates a bridge between Redux and A-Frame stores.

**Config options:**

- `reduxStore`: Your Redux store instance
- `aframeStore`: A-Frame store instance
- `stateSelector`: Optional function to select specific state slice
- `syncInterval`: Optional sync interval in milliseconds (default: 16ms)

### React Hooks

#### `useAframeStore(aframeStore)`

Returns the current A-Frame store state.

#### `useAframeState(aframeStore, statePath)`

Returns a specific state value using dot notation path.

### A-Frame Components

#### `aframe-state-component`

Makes A-Frame entities reactive to state changes.

**Attributes:**

- `statePath`: Dot notation path to the state value (required)
- `transform`: Function name to transform the value
- `onStateChange`: Function name to call on state change

## Examples

### Basic Position Sync

```html
<a-box
  aframe-state-component="statePath: player.position"
  material="color: blue"
>
</a-box>
```

### Score Display

```html
<a-text
  position="0 2 -3"
  aframe-state-component="statePath: score"
  value="Score: 0"
>
</a-text>
```

### Custom Transformations

```javascript
// Register custom component
AFRAME.registerComponent("score-display", {
  transform: function (value) {
    return `Score: ${value}`;
  },

  onStateChange: function (newValue, oldValue) {
    console.log(`Score changed from ${oldValue} to ${newValue}`);
  },
});
```

```html
<a-text
  aframe-state-component="statePath: score; transform: score-display"
  value="Score: 0"
>
</a-text>
```

## License

MIT

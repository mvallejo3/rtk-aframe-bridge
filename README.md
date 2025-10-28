# RTK-AFrame Bridge

A bridge between Redux Toolkit and A-Frame for synchronized state management. This package allows you to maintain a single source of truth in your Redux store while keeping your A-Frame scene in sync with real-time updates.

## Use this package if:

- You want to integrate A-frame into an existing react app (that uses Redux Toolkit).
- You need to update the 3D scene based on changes to the react app store.
- You want to avoid your 3D scene reloading multiple times due to store updates.

## Why?

I wanted to use A-Frame to display a product configuration in 3D. In my case, the React app that I wanted to add 3D capabilities to was already pretty matured- It already had a robust interface with options that allows users to configure a product.

I just needed A-Frame to display said configuration in 3D and have some minor interactivity.

The issue that I ran into is that my 3D scene kept reloaidn due to store updates in the react app.

I ran into a problem while integrating A-Frame into an existing React Application: I wanted to build (and in some cases, update) the 3D scene based on my redux store, but manipulating 3D components in A-Frame from inside React comonents was very inefficient. You can use something like [aframe-react](https://www.npmjs.com/package/aframe-react), but they even have a whole section about how [React falls short](https://www.npmjs.com/package/aframe-react#making-react-viable) when it comes to performance on your 3D app.

In my case, the React app that I wanted to add 3D capabilities to was already pretty matured. There was a lot of functionality built into user's configuring a product and the initial integration was to simply show a product configuration in 3D. More 3D features would come later.

**Use cases**

- You have an existing react app that uses Redux Toolkit and you need A-Frame components to "listen" to changes in the store.
- You have a 2D UI where the user "configures" a 3D scene or product in real time.
- Integrate A-Frame into an existing react app, but keep the React and A-Frame runtimes separate.

**Caveats**

- The A-Frame state cannot make changes to the Redux store.
- Compatible with any Redux store, all docs and tests where created using Redux Toolkit.

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

```bash
yarn add rtk-aframe-bridge
```

## Quick Start

### 1. Setup Redux Bridge (middleware)

The middleware will run everytime there is a change to the Redux store. Make sure to add your own logic to reduce the number of calls made to update the A-Frame state.

```typescript
import { Middleware } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "lib/store";
import { createRTKBridgeMiddleware } from "rtk-aframe-bridge";

const aframeStateMiddleware = createRTKBridgeMiddleware<RootState, AppDispatch>(
  {
    // This runs on every store update
    onUpdate: (prevState, nextState, action) => {
      // Add some logic to check whether we should update the AFrame state

      // fire a reducer on the AFrame state
      AFRAME.scenes[0]?.emit?.("updateStore", nextState);
    },
  }
);

export default aframeStateMiddleware;
```

### 2. Create A-Frame State

```typescript
import { registerAframeState } from "rtk-aframe-bridge";
import { RootState, store } from "lib/store";

registerAframeState<RootState>({
  name: "rack_builder",
  // set the initial state when the scene loads
  initialState: () => store.getState(),
  handlers: {
    updateStore: function (state, action) {
      // update the state
      AFRAME.utils.extend(state, action || {});
    },
  },
});
```

### 3. Register A-Frame Components

```typescript
import { in2m } from "../helpers";
import { registerAframeComponentWithState } from "rtk-aframe-bridge";
import { RootState } from "lib/store";

type FloorPlaneSchema = {
  width: number;
  height: number;
};

type FloorPlane = {
  updatePlane: () => void;
};

registerAframeComponentWithState<FloorPlaneSchema, FloorPlane, RootState>(
  "floor-plane",
  {
    // This runs every time the state updates
    onStateUpdate: function (state) {
      // Avoid unnecessary updates
      const { height, width } = state.mountableArea.customDimensions;
      if (this.data.height !== height || this.data.width !== width) {
        this.data.height = height;
        this.data.width = width;
        this.updatePlane();
      }
    },

    schema: {
      width: { type: "number", default: 3 },
      height: { type: "number", default: 3 },
    },

    init: function () {
      // listen for state updates
      this.subscribe(this);

      this.el.addEventListener("loaded", () => {
        this.updatePlane();
      });
    },

    updatePlane: function () {
      this.el.setAttribute("width", in2m(this.data.width) + 0.2);
      this.el.setAttribute("height", in2m(this.data.height) + 0.2);
      this.el.setAttribute(
        "position",
        `0 ${-in2m(this.data.height) / 2 - 0.03} 0`
      );
    },
  }
);
```

### 4. React Integration

```jsx
import { Entity } from "aframe-react";
import { memo } from "react";

const FloorPlane = () => {
  return (
    <Entity
      floor-plane
      id="floor-plane"
      primitive="a-plane"
      rotation="-90 0 0"
      color="#EDEDED"
    />
  );
};

export default memo(FloorPlane);
```

## API Reference

### Core Functions

#### `registerAframeState(stateDefinition)`

Creates an A-Frame state that mirrors Redux store.

#### `createRTKBridgeMiddleware(config)`

Creates a bridge between the Redux store and A-Frame state.

**Config options:**

- `onUpdate`: Fires every time the store changes.

### Helpers

#### `registerAframeComponentWithState(name, component)`

Registers an A-Frame comopnent and types it to include the necessary methods to subscribe to changes on the store.

## License

MIT

# RTK-AFrame Bridge

A bridge between Redux Toolkit and A-Frame for synchronized state management. This package allows you to maintain a single source of truth in your Redux store while keeping your A-Frame scene in sync with real-time updates.

## Use this package if:

- You want to integrate A-frame into an existing react app (that uses Redux).
- You need to update the 3D scene based on changes to the react app store.
- You want to avoid your 3D scene reloading multiple times due to store updates.

## Installation

```bash
# npm
npm install rtk-aframe-bridge
# or yarn
yarn add rtk-aframe-bridge
```

## Features

- 🔄 **Automatic State Synchronization**: Redux state changes automatically sync to A-Frame
- 🎯 **Selective State Updates**: Use selectors to sync only the state you need
- ⚡ **Real-time Updates**: A-Frame components react to state changes instantly
- 🎮 **A-Frame Components**: Built-in component register helper for reactive state management
- ⚠️ **Avoid Shortfalls**: By keeping any AFrame logic outside of the React runtime you get the best out of both worlds- React's state management, and AFrame's rendering speed.
- 📦 **TypeScript Support**: Full TypeScript definitions included

**Use cases**

- You have an existing react app that uses Redux Toolkit and you need A-Frame components to "listen" to changes in the store.
- You have a 2D UI where the user "configures" a 3D scene or product in real time.
- Integrate A-Frame into an existing react app, but keep the React and A-Frame runtimes separate.

**Caveats**

- The A-Frame state cannot make changes to the Redux store.
- Compatible with any Redux store, all docs and tests where created using Redux Toolkit.

## Quick Start

### 1. Setup Redux Bridge (middleware)

Use `createRTKBridgeMiddleware(config)` to create a redux middleware. Config takes one property, `onUpdate`, which gets called everytime there is a change to the Redux store.

`onUpdate` will receive 3 arguments: `prevState` the state before the change took place, `nextState` the state after the change takes place, and the `action` that triggered the change.

In order to update the AFrame state, you `emit` an event on the scene. The event name will match a reducer in the AFrame state (see step 2).

Make sure to include your own logic to reduce the number of events emitted on the scene.

```typescript
import { Middleware } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "lib/store";
import { createRTKBridgeMiddleware } from "rtk-aframe-bridge";

const aframeStateMiddleware = createRTKBridgeMiddleware<RootState, AppDispatch>(
  {
    // This runs on every store update
    onUpdate: (prevState, nextState, action) => {
      // Add some logic to check whether we should update the AFrame state
      if (!shouldEmit(prevState, nextState)) return;
      // fire a reducer/handler on the AFrame state
      AFRAME.scenes[0]?.emit?.("updateStore", nextState);
    },
  }
);

export default aframeStateMiddleware;
```

### 2. Register A-Frame State

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

## Backstory

I wanted to use A-Frame to display a product configuration in 3D. In my case, the React app that I wanted to add 3D capabilities to already had an interface with a robust set of options for users to configure a product. I wanted to leverage this interface and the store that kept track of all the changes and simply update the 3D scene accordingly.

My first attempt was to use the package [aframe-react](https://www.npmjs.com/package/aframe-react) to build my scene and a few Entities to display the 3D product config. This worked in the sense that I was able to make updates to my 3D scene in real time, but it got clunky and inefficient real quick.

There were moments when the entire 3D scene would reload due to a change in the store. This was annoying becuase if you had moved in the scene or rotated the camera at all, the reload would cause the camera to reset and that was not a great experience.

To be fair, aframe-react has a whole section about how [React falls short](https://www.npmjs.com/package/aframe-react#making-react-viable) when it comes to performance on your 3D app.

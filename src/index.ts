import "aframe";
import { registerAframeSystem } from "./helpers";
import { AFrameComponent, AframeState, AframeStateRegister } from "./types";
import { System } from "aframe";

const STATE_UPDATE_EVENT = "stateupdate";

export interface AFrameStateSchema {}

export interface AFrameStateSystem {
  state: AFrameStateSchema;
  subscriptions: AFrameComponent[];
  subscribe: (component: AFrameComponent) => void;
  unsubscribe: (component: AFrameComponent) => void;
  initEventHandlers: () => void;
  dispatch: (actionName: string, payload?: AFrameStateSchema) => void;
  registerListener: (actionName: string) => void;
  notifyStateUpdate: () => void;
};

export type RTKBridgeSystem = System<AFrameStateSchema> & AFrameStateSystem;

const State: AframeState = {
  name: "rtk_bridge",
  initialState: {},
  handlers: {},
};

/**
 * Subscribes a component to the RTK bridge state.
 * @param component AFrameComponent The component to subscribe
 */
export const subscribe = (component: AFrameComponent) => {
  const system = AFRAME.scenes[0].systems[
    State.name
  ] as RTKBridgeSystem;
  if (system) {
    system.subscribe(component);
  }
};

/**
 * Registers an A-Frame state.
 * @param definition Partial<AframeState> The state definition
 */
export const registerAframeState: AframeStateRegister = (definition) => {
  AFRAME.utils.extendDeep(State, definition);
};

/**
 * Registers an A-Frame system that manages the RTK bridge state.
 */
registerAframeSystem<AFrameStateSchema, AFrameStateSystem>(State.name, {
  state: {},
  subscriptions: [],

  init: function () {
    // Initialize state from the store when the system is created
    // This happens when the scene is initialized
    const _state =
      State.initialState instanceof Function
        ? State.initialState()
        : State.initialState;
    // @ts-expect-error we know clone exists
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.state = AFRAME.utils.clone<AFrameStateSchema>(_state);

    this.subscriptions = [];
    this.notifyStateUpdate = this.notifyStateUpdate.bind(this);

    // Register event handlers for state actions
    // These are basically the "reducers" in Redux terminology
    this.initEventHandlers();

    this.el.addEventListener("loaded", this.notifyStateUpdate);
  },

  subscribe: function (component) {
    this.subscriptions.push(component);
  },

  unsubscribe: function (component) {
    this.subscriptions = this.subscriptions.filter((sub) => sub !== component);
  },

  initEventHandlers: function () {
    let actionName: string;
    const registeredActions: string[] = [];
    const registerListener = this.registerListener.bind(this);
    
    // Use declared handlers to know what events to listen to.
    for (actionName in State.handlers) {
      // Only need to register one handler for each event.
      if (registeredActions.indexOf(actionName) !== -1) {
        continue;
      }
      registeredActions.push(actionName);
      registerListener(actionName);
    }
  },

  registerListener: function (actionName: string) {
    this.el.addEventListener(actionName, (evt: Event) => {
      this.dispatch(actionName, (evt as CustomEvent<AFrameStateSchema>).detail);
    });
  },

  dispatch: function (actionName: string, payload?: AFrameStateSchema) {
    // Call handler.
    State.handlers[actionName](this.state, payload);

    // Notify subscribers.
    this.notifyStateUpdate();

    // Emit.
    this.el.emit(STATE_UPDATE_EVENT, {
      action: actionName,
      payload,
    });
  },

  notifyStateUpdate: function () {
    let currentUpdateCount = 0;
    const toUpdate: AFrameComponent[] = [];

    for (let i = 0; i < this.subscriptions.length; i++) {
      // Keep track to only update subscriptions once.
      if (toUpdate.indexOf(this.subscriptions[i]) === -1) {
        toUpdate.push(this.subscriptions[i]);
        currentUpdateCount++;
      }
    }

    // Update subscriptions.
    for (let j = 0; j < currentUpdateCount; j++) {
      const subscriber = toUpdate.pop();
      // @ts-expect-error we know onStateUpdate exists
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      subscriber.onStateUpdate(this.state);
    }
  },
});

import "aframe";
import { registerAframeSystem } from "./helpers";
import { AFrameComponent, AframeState, AframeStateRegister } from "./types";
import { System } from "aframe";

const STATE_UPDATE_EVENT = "stateupdate";

/**
 * The schema for the A-Frame state.
 * Used to set the schema for the A-Frame system used to manage the state.
 * @param T The type of the state
 * @returns The schema for the A-Frame state
 */
export type AFrameStateSchema<T extends object = object> = T;

/**
 * The system class for the A-Frame state.
 * @param T The type of the state
 * @returns The system for the A-Frame state
 */
export type AFrameStateSystem<T extends object = object> = {
  state: T;
  subscriptions: AFrameComponent[];
  subscribe: (component: AFrameComponent) => void;
  unsubscribe: (component: AFrameComponent) => void;
  initEventHandlers: () => void;
  dispatch: (actionName: string, payload?: T) => void;
  registerListener: (actionName: string) => void;
  notifyStateUpdate: () => void;
};

/**
 * The System for the RTK Bridge.
 * @param T The type of the state
 * @returns The system for the RTK Bridge
 */
export type RTKBridgeSystem<T extends object = object> = System<T> &
  AFrameStateSystem<T>;

/**
 * The state for the RTK Bridge.
 * Guarantees the state exists as a single shared instance.
 */
const State: AframeState = {
  name: "rtk_bridge",
  initialState: {},
  handlers: {},
};

/**
 * Subscribes a component to the RTK bridge state.
 * @param component AFrameComponent The component to subscribe
 */
export const subscribe = function (component: AFrameComponent) {
  const system = AFRAME.scenes[0].systems[State.name] as RTKBridgeSystem;
  if (system) {
    system.subscribe(component);
  }
};

/**
 * Gets the system for the RTK Bridge.
 * @param T The type of the state
 * @returns The system for the RTK Bridge
 */
export const getSystem = function <T extends object = object>(): RTKBridgeSystem<T> {
  return AFRAME.scenes[0].systems[State.name] as RTKBridgeSystem<T>;
};

/**
 * Registers an A-Frame state.
 * @param definition Partial<AframeState> The state definition
 */
export const registerAframeState: AframeStateRegister = <
  T extends object = object
>(
  definition: AframeState<T>
) => {
  AFRAME.utils.extendDeep(State, definition);
  // if state is a function, extendDeep will skip it.
  // so we need to set the initial state manually.
  if (definition.initialState instanceof Function) {
    State.initialState = definition.initialState;
  }
  /**
   * Registers an A-Frame system that manages the RTK bridge state.
   */
  registerAframeSystem<AFrameStateSchema<T>, AFrameStateSystem<T>>(State.name, {
    state: {} as T,
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
      this.state = AFRAME.utils.clone<T>(_state);
      // reset subscriptions
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
      this.subscriptions = this.subscriptions.filter(
        (sub) => sub !== component
      );
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
        this.dispatch(actionName, (evt as CustomEvent<T>).detail);
      });
    },

    dispatch: function (actionName: string, payload?: T) {
      // Call handler.
      State.handlers[actionName](this.state, payload);

      // Notify subscribers.
      this.notifyStateUpdate();

      // Emit event once the state has been updated.
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
};

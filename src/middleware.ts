import {
  Dispatch,
  Middleware,
  MiddlewareAPI,
  PayloadAction,
} from "@reduxjs/toolkit";

/**
 * The configuration for the RTK Bridge middleware.
 * @param T The type of the state
 * @returns The configuration for the RTK Bridge middleware
 */
export type RTKBridgeMiddlewareConfig<T> = {
  // beforeUpdate?: (prev: T, next: T, action: PayloadAction<T>) => void;
  // afterUpdate?: (prev: T, next: T, action: PayloadAction<T>) => void;
  onUpdate?: (prev: T, next: T, action: PayloadAction<T>) => void;
};

/**
 * Creates a middleware for redux toolkit to synchronize the state with the RTK Bridge.
 * @param config The configuration for the RTK Bridge middleware
 * @returns The middleware for the RTK Bridge
 */
export const createRTKBridgeMiddleware = <
  T extends object,
  D extends Dispatch<PayloadAction<T>>,
>(
  config: RTKBridgeMiddlewareConfig<T>
): Middleware<unknown, T, D> => {
  return (api: MiddlewareAPI<D, T>) => (next) => (action) => {
    // Get state before reducer processes the action
    const prevState = api.getState();
    // Forward the action to the reducer
    const result = next(action);
    // Get state after reducer processes the action
    const nextState = api.getState();

    config.onUpdate?.(prevState, nextState, action as PayloadAction<T>);

    return result;
  };
};
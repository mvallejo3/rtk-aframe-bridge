import { Component, System } from "aframe";
import { RTKBridgeSystem } from "./bridge";

// Global declarations
declare global {
  interface Utils {
    clone<T extends object>(obj: T): T;
  }
}

export type AframeState<T extends object = object> = {
  name: string;
  initialState: T | (() => T);
  handlers: Record<string, (state: T, action?: T) => void>;
}


export type AframeStateRegister = <T extends object = object>(
  definition: AframeState<T>
) => void;


// This type is used to define A-Frame components with proper typing for the schema and methods.
export type AFrameComponent<
  T extends object = object,
  C extends object = object,
> = C & Partial<Component<T>> & ThisType<C & Component<T>>;

// This type defines the signature for the function that registers A-Frame components.
export type AframeComponentRegister = <
  T extends object = object,
  C extends object = Partial<Component<T>>,
  S extends object = System,
  SE extends object = object,
>(
  name: string,
  component: Partial<Component<T, System<S> & SE>> &
    C &
    ThisType<Component<T, System<S> & SE> & C>
) => void;

type AframeStateMethods<S extends object = object> = {
  subscribe: (component: AFrameComponent) => void;
  onStateUpdate: (state: S) => void;
};
// This type defines the signature for the function that registers A-Frame components that listen to state updates.
export type AframeComponentWithStateRegister = <
  T extends object = object,
  C extends object = object,
  S extends object = object,
>(
  name: string,
  component: 
    // AFrameComponent<T, C & AframeStateMethods<S>>
    Partial<Component<T, RTKBridgeSystem<S>>> &
    C & Partial<AframeStateMethods<S>> &
    ThisType<Component<T, RTKBridgeSystem<S>> & C & AframeStateMethods<S>>
) => void;

// This type defines the signature for the function that registers A-Frame systems.
export type AframeSystemRegister = <
  T extends object = object,
  C extends object = T & Partial<System<T>>,
>(
  name: string,
  system: AFrameComponent<T, C>
) => void;

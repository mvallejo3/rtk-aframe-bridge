// import * as THREE from "three";
import { Component, System } from "aframe";
import { AFrameStateSchema, AFrameStateSystem } from ".";

// Global declarations
declare global {
  interface Utils {
    clone<T extends object>(obj: T): T;
  }
}

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

type AframeStateMethods = {
  subscribe: (component: AFrameComponent) => void;
  onStateUpdate: (state: AFrameStateSchema) => void;
};
// This type defines the signature for the function that registers A-Frame components that listen to state updates.
export type AframeComponentWithStateRegister = <
  T extends object = object,
  C extends object = Partial<Component<T>>,
>(
  name: string,
  component: Partial<
    Component<T, System<AFrameStateSchema> & AFrameStateSystem>
  > &
    C & { onStateUpdate?: (state: AFrameStateSchema) => void } & ThisType<
      Component<T, System<AFrameStateSchema> & AFrameStateSystem> &
        C &
        AframeStateMethods
    >
) => void;

// This type defines the signature for the function that registers A-Frame systems.
export type AframeSystemRegister = <
  T extends object = object,
  C extends object = Partial<System<T>>,
>(
  name: string,
  system: Partial<System<T>> & C & ThisType<System<T> & C>
) => void;

export interface AframeState<T extends object = object> {
  name: string;
  initialState: T | (() => T);
  handlers: Record<string, (state: T, action?: T) => void>;
}

export type AframeStateRegister = <T extends object = object>(
  definition: Partial<AframeState<T>>
) => void;


import "aframe";
import {
  AframeSystemRegister,
  AframeComponentRegister,
  AframeComponentWithStateRegister,
} from "./types";
import { subscribe } from ".";

/**
 * Registers an A-Frame component.
 * @param name string The component name
 * @param component Component The component definition
 */
export const registerAframeComponent: AframeComponentRegister = (
  name,
  component
) => {
  AFRAME.registerComponent(name, component);
};

/**
 * Registers an A-Frame component that listens to state updates.
 * @param name string The component name
 * @param component Component The component definition. A method `onStateUpdate` will be called on state updates.
 */
export const registerAframeComponentWithState: AframeComponentWithStateRegister =
  (name, component) => {
    registerAframeComponent(name, { ...component, subscribe });
  };

/**
 */
export const registerAframeSystem: AframeSystemRegister = (name, system) => {
  AFRAME.registerSystem(name, system);
};

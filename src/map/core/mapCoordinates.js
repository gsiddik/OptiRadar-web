// The coordinate system of the map style that is on screen. It lives apart from the map itself so the helpers that
// convert coordinates (and so the first screen) do not have to load the map library; the map sets it when its style
// changes.
const state = { coordinateSystem: undefined };

export const getCoordinateSystem = () => state.coordinateSystem;

export const setCoordinateSystem = (value) => {
  state.coordinateSystem = value;
};

import { createContext, useContext } from "react";

/** Colours for the 3D twin. three.js needs real colours (not CSS variables), so each theme has its own set. */
export interface ScenePalette {
  background: string;
  ground: string;
  gridMajor: string;
  gridMinor: string;
  hemiSky: string;
  hemiGround: string;
  ambient: number;
  sun: number;
  shadow: number;
  snow: string;
  cladding: string;
  tank: string;
  glass: string;
  steel: string;
  dark: string;
  edge: string;
  rock: string;
  hill: string;
  walkway: string;
  /** Ice-free rock of the oasis / headland. */
  oasis: string;
  lake: string;
  lakeEdge: string;
  sea: string;
  ice: string;
  iceFace: string;
  /** Bharati's aluminium skin and Maitri's panel cladding. */
  aluminium: string;
  panel: string;
  solar: string;
}

export const LIGHT_SCENE: ScenePalette = {
  background: "#EAF2FB",
  ground: "#FFFFFF",
  gridMajor: "#C6E1FF",
  gridMinor: "#E3EEFA",
  hemiSky: "#FFFFFF",
  hemiGround: "#C6E1FF",
  ambient: 0.9,
  sun: 1.1,
  shadow: 0.12,
  snow: "#8FB3D9",
  cladding: "#FFFFFF",
  tank: "#F4F8FC",
  glass: "#7FA3C8",
  steel: "#AEBBCB",
  dark: "#5A6B80",
  edge: "#1D4F86",
  rock: "#9AA5B2",
  hill: "#EDF2F8",
  walkway: "#D3DCE7",
  oasis: "#B7BCC3",
  lake: "#BFDDF3",
  lakeEdge: "#9CC4E4",
  sea: "#5E8DB8",
  ice: "#F7FAFD",
  iceFace: "#D6E6F5",
  aluminium: "#D5DCE4",
  panel: "#E9EEF3",
  solar: "#27456B",
};

/** Polar night: dark sky, moonlit blue snow, softer light. */
export const DARK_SCENE: ScenePalette = {
  background: "#0B1422",
  ground: "#1D2D44",
  gridMajor: "#2F4A6E",
  gridMinor: "#23364F",
  hemiSky: "#A9C3E3",
  hemiGround: "#0D1624",
  ambient: 0.5,
  sun: 0.85,
  shadow: 0.35,
  snow: "#DCE8F7",
  cladding: "#C3CEDC",
  tank: "#B7C3D2",
  glass: "#F2C46D",
  steel: "#7D8BA0",
  dark: "#3C4A5C",
  edge: "#8BBCF0",
  rock: "#4E5B6B",
  hill: "#1A2A40",
  walkway: "#3A4D66",
  oasis: "#2E3B4D",
  lake: "#3B5F86",
  lakeEdge: "#4D76A1",
  sea: "#0F2238",
  ice: "#2A3D57",
  iceFace: "#33496A",
  aluminium: "#8E9BAD",
  panel: "#A9B6C6",
  solar: "#1B2F4C",
};

export const ScenePaletteContext = createContext<ScenePalette>(LIGHT_SCENE);

export function useScenePalette(): ScenePalette {
  return useContext(ScenePaletteContext);
}

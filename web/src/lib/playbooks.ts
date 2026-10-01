// Emergency checklists, based on docs/sops.md. Prototype content, not official NCPOR procedures.

export type EmergencyKind = "fire" | "medevac" | "power" | "blizzard";

export interface Playbook {
  kind: EmergencyKind;
  label: string;
  summary: string;
  /** SOP section the steps come from. */
  sop: string;
  steps: string[];
}

export const PLAYBOOKS: Record<EmergencyKind, Playbook> = {
  fire: {
    kind: "fire",
    label: "Fire",
    summary: "Fire or smoke in a station building.",
    sop: "SOP 5 — Fire",
    steps: [
      "Raise the fire alarm and announce the building and room on the public address system.",
      "Fight the fire with an extinguisher only if it is small and your exit is behind you.",
      "Isolate fuel lines and electrical supply to the affected building.",
      "Muster all crew at the designated point.",
      "Complete a head count within 5 minutes and report anyone missing.",
      "Fire team protects the fuel farm and power house first.",
      "Station leader informs NCPOR Goa by satellite phone.",
    ],
  },
  medevac: {
    kind: "medevac",
    label: "Medical evacuation",
    summary: "A crew member needs care the station cannot provide.",
    sop: "SOP 6 — Medical evacuation",
    steps: [
      "Medical officer stabilises the patient and records vital signs every 15 minutes.",
      "Station leader informs NCPOR Goa and requests medical advice by satellite link.",
      "Check the weather window for helicopter, aircraft or ship transfer.",
      "Agree the evacuation route and receiving facility with NCPOR.",
      "Prepare the patient, medical records and medicines for the move.",
      "Assign a crew member to travel with the patient.",
    ],
  },
  power: {
    kind: "power",
    label: "Power failure",
    summary: "Loss of generator power to the station.",
    sop: "SOP 7 — Power failure",
    steps: [
      "Confirm battery backup is carrying comms, medical and heating controls (30 min minimum).",
      "Start the standby generator and let it warm up for 5 minutes.",
      "Restore power to living quarters, medical unit and comms first.",
      "Shed non-essential loads: labs, workshops, laundry.",
      "If no generator runs within 1 hour, move the crew to the warmest building.",
      "Find the cause before reconnecting the failed generator, and log the event.",
    ],
  },
  blizzard: {
    kind: "blizzard",
    label: "Blizzard / person missing",
    summary: "Severe weather with crew outside, or a crew member unaccounted for.",
    sop: "SOP 4 — Blizzard and SOP 8 — Person missing",
    steps: [
      "Sound the general alarm and stop all outdoor work.",
      "Take a head count and check the field book for teams outside.",
      "Call field teams on VHF and satellite phone; teams that cannot return shelter in place.",
      "Collect the missing person's last known position, time, clothing and equipment.",
      "Fit guide ropes between buildings; nobody moves outside alone.",
      "Send search teams of 3 or more with radios once visibility allows.",
      "Inform NCPOR Goa within 1 hour and request help from neighbouring stations if needed.",
    ],
  },
};

export const EMERGENCY_KINDS: EmergencyKind[] = ["fire", "medevac", "power", "blizzard"];

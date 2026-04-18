export interface JointDef {
  name: string;
  position: [number, number, number];
  parent: string | null;
}

export interface SkeletonTemplate {
  name: string;
  joints: JointDef[];
}

export const HUMAN_TEMPLATE: SkeletonTemplate = {
  name: "Human",
  joints: [
    { name: "Hips", position: [0, 0.95, 0], parent: null },
    { name: "Spine", position: [0, 1.15, 0], parent: "Hips" },
    { name: "Chest", position: [0, 1.35, 0], parent: "Spine" },
    { name: "Neck", position: [0, 1.52, 0], parent: "Chest" },
    { name: "Head", position: [0, 1.7, 0], parent: "Neck" },

    { name: "L_Shoulder", position: [-0.18, 1.48, 0], parent: "Chest" },
    { name: "L_UpperArm", position: [-0.38, 1.4, 0], parent: "L_Shoulder" },
    { name: "L_LowerArm", position: [-0.6, 1.18, 0], parent: "L_UpperArm" },
    { name: "L_Hand", position: [-0.78, 0.98, 0], parent: "L_LowerArm" },

    { name: "R_Shoulder", position: [0.18, 1.48, 0], parent: "Chest" },
    { name: "R_UpperArm", position: [0.38, 1.4, 0], parent: "R_Shoulder" },
    { name: "R_LowerArm", position: [0.6, 1.18, 0], parent: "R_UpperArm" },
    { name: "R_Hand", position: [0.78, 0.98, 0], parent: "R_LowerArm" },

    { name: "L_UpperLeg", position: [-0.15, 0.85, 0], parent: "Hips" },
    { name: "L_LowerLeg", position: [-0.15, 0.48, 0], parent: "L_UpperLeg" },
    { name: "L_Foot", position: [-0.15, 0.05, 0], parent: "L_LowerLeg" },

    { name: "R_UpperLeg", position: [0.15, 0.85, 0], parent: "Hips" },
    { name: "R_LowerLeg", position: [0.15, 0.48, 0], parent: "R_UpperLeg" },
    { name: "R_Foot", position: [0.15, 0.05, 0], parent: "R_LowerLeg" },
  ],
};

export const ANIMAL_TEMPLATE: SkeletonTemplate = {
  name: "Animal (Quadruped)",
  joints: [
    { name: "Root", position: [0, 0.75, 0], parent: null },
    { name: "Spine_Front", position: [0, 0.78, -0.3], parent: "Root" },
    { name: "Spine_Back", position: [0, 0.78, 0.3], parent: "Root" },
    { name: "Neck", position: [0, 0.88, -0.55], parent: "Spine_Front" },
    { name: "Head", position: [0, 0.98, -0.75], parent: "Neck" },

    { name: "Tail_1", position: [0, 0.82, 0.5], parent: "Spine_Back" },
    { name: "Tail_2", position: [0, 0.88, 0.7], parent: "Tail_1" },

    { name: "FL_UpperLeg", position: [-0.18, 0.55, -0.35], parent: "Spine_Front" },
    { name: "FL_LowerLeg", position: [-0.18, 0.28, -0.35], parent: "FL_UpperLeg" },
    { name: "FL_Foot", position: [-0.18, 0.04, -0.35], parent: "FL_LowerLeg" },

    { name: "FR_UpperLeg", position: [0.18, 0.55, -0.35], parent: "Spine_Front" },
    { name: "FR_LowerLeg", position: [0.18, 0.28, -0.35], parent: "FR_UpperLeg" },
    { name: "FR_Foot", position: [0.18, 0.04, -0.35], parent: "FR_LowerLeg" },

    { name: "BL_UpperLeg", position: [-0.18, 0.55, 0.35], parent: "Spine_Back" },
    { name: "BL_LowerLeg", position: [-0.18, 0.28, 0.35], parent: "BL_UpperLeg" },
    { name: "BL_Foot", position: [-0.18, 0.04, 0.35], parent: "BL_LowerLeg" },

    { name: "BR_UpperLeg", position: [0.18, 0.55, 0.35], parent: "Spine_Back" },
    { name: "BR_LowerLeg", position: [0.18, 0.28, 0.35], parent: "BR_UpperLeg" },
    { name: "BR_Foot", position: [0.18, 0.04, 0.35], parent: "BR_LowerLeg" },
  ],
};

export const TEMPLATES: Record<string, SkeletonTemplate> = {
  human: HUMAN_TEMPLATE,
  animal: ANIMAL_TEMPLATE,
};

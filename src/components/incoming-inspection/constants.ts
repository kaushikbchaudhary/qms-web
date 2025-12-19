import { IncomingInspectionChecklistRow, IncomingInspectionComponentType } from '@/lib/api/types/incomingInspection';

export const COMPONENT_LABELS: Record<IncomingInspectionComponentType, string> = {
  CONNECTOR: 'Connector',
  CRYSTAL: 'Crystal',
  DIODE: 'Diode',
  HEADER: 'Header',
  SWITCH: 'Switch (Appearance)',
  TRANSISTOR: 'Transistor',
  USB_MICRO_B: 'USB Micro B',
  INDUCTOR: 'Inductor',
  SWITCH_DIMENSION: 'Switch (Dimensions)',
  USB_TYPE_C: 'USB Type C',
};

export const DEFAULT_CHECKLISTS: Record<IncomingInspectionComponentType, IncomingInspectionChecklistRow[]> = {
  CONNECTOR: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The connector should be visually inspected using the approved master sample as a reference. The housing should be intact, with no cracks, deformation, or discoloration. All contact pins or terminals should be present, properly aligned, and free from bending, oxidation, or contamination. The locking or mating features should be undamaged and functional. The component should be clean, with no foreign material, and its overall appearance should match the approved master sample.',
    },
  ],
  CRYSTAL: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The crystal oscillator should be visually inspected using the approved master sample as a reference. The metal casing should be free from dents, scratches, corrosion, or deformation. Leads or terminals should be straight, clean, and free from oxidation or solder residue. The component should be free from any visible contamination or physical damage. If markings are present, they should be legible and match the specified part number. The overall appearance should conform to the master sample standard.',
    },
  ],
  DIODE: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The diode should be visually inspected using the approved master sample as a reference. The body should be free from cracks, chipping, burns, or discoloration. The surface of the component should be clean, with no signs of contamination or physical damage. Leads or terminals should be straight, intact, and free from oxidation or solder residue. The polarity marking, such as the cathode band, should be clearly visible and correctly positioned. The overall appearance should match the approved master sample.',
    },
  ],
  HEADER: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The header connector should be visually inspected using the approved master sample as a reference. The plastic housing should be free from cracks, warping, or discoloration. All metal pins should be straight, uniformly aligned, and securely fixed within the housing. The pins should be clean and free from oxidation, solder residue, or mechanical damage. The overall structure should be intact, with no foreign material or contamination. The component’s appearance should match the approved master sample in all respects.',
    },
  ],
  SWITCH: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The switch should be visually inspected using the approved master sample as a reference. The housing should be intact, with no cracks, warping, or discoloration. The actuator should be present, properly aligned, and free from any visible damage. Terminals or pins should be straight, clean, and free from oxidation or solder residue. Smooth tactile movement should be verified, if applicable. The overall appearance should conform to the approved master sample, with no signs of physical damage or contamination.',
    },
  ],
  TRANSISTOR: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The transistor should be visually inspected using the approved master sample as a reference. The body should be clean and free from cracks, chips, discoloration, or burn marks. All leads should be straight, uniformly formed, and free from oxidation or physical damage. Markings on the transistor should be clear and legible. The overall appearance should conform to the master sample, with no signs of contamination or handling damage.',
    },
  ],
  USB_MICRO_B: [
    {
      sr_no: 1,
      test_name: 'Appearance Test',
      specification:
        'The USB Micro B connector shall meet the visual acceptance criteria by conforming to the approved master sample. The connector housing must be intact and free from any visible cracks, warping, or deformation. All internal contact pins should be present, properly aligned, and free from oxidation, bending, or other physical damage. The outer shell must be securely attached, exhibiting no dents, corrosion, or looseness. The entire component must be clean, with no foreign material, contamination, or signs of mechanical stress. The overall appearance must match the approved sample to ensure it meets quality and assembly standards.',
    },
  ],
  INDUCTOR: [
    {
      sr_no: 1,
      test_name: 'Appearance',
      specification: 'No cracks, chips, dents, corrosion. Marking clear and correct.',
    },
    {
      sr_no: 2,
      test_name: 'Dimension',
      specification: 'Length 3.2 ± 2 mm; Width 6.85 ± 2 mm.',
    },
  ],
  SWITCH_DIMENSION: [
    {
      sr_no: 1,
      test_name: 'Appearance',
      specification: 'Free from cracks, deformation, or rust. Actuator intact.',
    },
    {
      sr_no: 2,
      test_name: 'Dimension (Length)',
      specification: 'Length 8.55 ± 2 mm.',
    },
    {
      sr_no: 3,
      test_name: 'Dimension (Height)',
      specification: 'Height 2.95 ± 2 mm.',
    },
    {
      sr_no: 4,
      test_name: 'Dimension (Width)',
      specification: 'Width 3.85 ± 2 mm.',
    },
  ],
  USB_TYPE_C: [
    {
      sr_no: 1,
      test_name: 'Appearance',
      specification: 'No cracks, bent pins, oxidation, or foreign material. Marking clear.',
    },
  ],
};

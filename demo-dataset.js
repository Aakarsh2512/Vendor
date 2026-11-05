/* Fictional presentation records. No real vendors or registry IDs are used. */
(() => {
  const names = [
    "Northstar Office Supplies", "Cedar Ridge Components", "Harborlight Packaging", "Meridian Workplace Goods", "Blue Peak Industrial Supply",
    "Willow Creek Stationery", "Silverline Safety Products", "Brightpath Paper Co", "Evergreen Facilities Group", "Redwood Business Supply",
    "Clearwater Lab Essentials", "Summit Ridge Logistics", "Oakstone Maintenance Co", "Westhaven Print Services", "Morningstar Catering Group",
    "Pinecrest Electrical Supply", "Lakeside Uniform Works", "Fairview Medical Goods", "Stonebridge Cleaning Supply", "Greenfield Tech Parts",
    "Maple Gate Workwear", "Cobalt River Packaging", "Sunfield Food Services", "Ironwood Office Furniture", "Bluebell Learning Materials",
    "Highland Tool Partners", "Eastwind Fleet Supplies", "Golden Shore Hospitality", "Cloudline Network Goods", "Meadowbrook Janitorial",
    "Parkview Storage Systems", "Copperleaf Signworks", "Windward Building Products", "Riverbend Paper House", "Coralstone Safety Gear",
    "Foxglove Distribution", "Northgate Repair Supply", "Seabright Medical Systems", "Aspen Grove Workspace", "Beacon Hill Components",
    "Brookstone Textile Supply", "Crown Valley Food Goods", "Dovetail Equipment Co", "Elm Street Business Goods", "Frostline Shipping Supply",
    "Granite Bay Industrial", "Juniper Lane Stationery", "Kingswell Facility Supply", "Lighthouse Audio Visual", "Mosaic Field Services",
    "Red Maple Procurement", "Silver Birch Equipment", "Greenway Health Products", "Stone Harbor Distribution", "Golden Thread Textiles",
    "Westbridge Data Systems", "Crescent City Packaging", "Blue Lantern Electrical", "Hearthstone Kitchen Supply", "Cloud Harbor Networks",
    "Oak Valley Medical Supply", "Riverstone Fleet Services", "High Meadow Foods", "Northwind Learning Co", "Copper Ridge Facilities",
    "Pioneer Field Equipment", "Brightwater Safety Group", "Willow Bend Logistics", "Summit Grove Interiors", "Clearpath Lab Partners",
    "Amber Coast Paper Goods", "Everwell Uniform Supply", "Granite Point Tools", "New Harbor Office Works", "Canyon Gate Components",
    "Daybreak Hospitality Goods", "Ironleaf Maintenance Supply", "Meadowline Tech Services", "Fairview Packaging House", "Bluewater Workwear Co",
    "Linden Park Industrial", "Northstar Transit Supply", "Elmwood Sign and Print", "Silver Creek Catering", "Beacon Coast Medical Goods",
    "Openfield Storage Systems", "Morning Tide Business Supply", "Crownstone Audio Visual", "Pine Harbor Cleaning Products", "Eastgate Building Materials",
    "Juniper Coast Fleet Goods", "Westlake Stationery Partners", "Parkside Network Supply", "Frost Harbor Food Services", "Maple Shore Repair Co",
    "Bright Ridge Shipping", "Coral Bay Learning Supply", "Stonefield Energy Products", "Greenline Workplace Systems", "Lakeshore Distribution Group",
  ];

  const countryTargets = [
    { country: "India", count: 38 },
    { country: "United States", count: 24 },
    { country: "United Kingdom", count: 16 },
    { country: "Canada", count: 12 },
    { country: "Australia", count: 10 },
  ];

  function sampleId(country, index) {
    if (country === "India") return "DEMOA" + String(1001 + index).padStart(4, "0") + String.fromCharCode(65 + index % 26);
    if (country === "United States") return "12-" + String(3450000 + index).padStart(7, "0");
    if (country === "United Kingdom") return "GB" + String(123450000 + index).padStart(9, "0");
    if (country === "Canada") return String(700000000 + index) + "RT0001";
    return String(10000000000 + index);
  }

  const countryUse = new Map(countryTargets.map((entry) => [entry.country, 0]));
  const monthSchedule = [
    { monthOffset: 5, count: 11 },
    { monthOffset: 4, count: 14 },
    { monthOffset: 3, count: 18 },
    { monthOffset: 2, count: 23 },
    { monthOffset: 1, count: 20 },
    { monthOffset: 0, count: 14 },
  ];
  const monthOffsets = monthSchedule.flatMap((bucket) => Array(bucket.count).fill(bucket.monthOffset));

  const normalCases = names.map((legalName, index) => {
    const country = countryTargets
      .filter((entry) => countryUse.get(entry.country) < entry.count)
      .sort((left, right) => countryUse.get(left.country) / left.count - countryUse.get(right.country) / right.count)[0].country;
    const countryIndex = countryUse.get(country);
    countryUse.set(country, countryIndex + 1);
    const sequence = String(index + 1).padStart(3, "0");
    const legalEntityName = legalName + (country === "India" ? " Pvt. Ltd." : " Ltd.");
    return {
      legalName: legalEntityName,
      country,
      taxId: sampleId(country, countryIndex),
      email: "vendor-" + sequence + "@demo.example.com",
      accountHolder: legalEntityName,
      monthOffset: monthOffsets[index],
    };
  });

  const duplicateBase = normalCases[49];
  const edgeCases = [
    {
      scenario: "missing_bank_proof",
      scenarioLabel: "Missing bank proof",
      legalName: "Demo Westhaven Distribution Ltd.",
      country: "United Kingdom",
      taxId: "GB987650123",
      email: "vendor-edge-01@demo.example.com",
      accountHolder: "Demo Westhaven Distribution Ltd.",
      missingDocuments: ["Bank proof"],
    },
    {
      scenario: "invalid_tax_id",
      scenarioLabel: "Tax ID shape needs review",
      legalName: "Demo Silver Fern Supplies Pvt. Ltd.",
      country: "India",
      taxId: "INVALID123",
      email: "vendor-edge-02@demo.example.com",
      accountHolder: "Demo Silver Fern Supplies Pvt. Ltd.",
    },
    {
      scenario: "bank_name_mismatch",
      scenarioLabel: "Bank holder differs from vendor name",
      legalName: "Demo Riverstone Components Ltd.",
      country: "Canada",
      taxId: "712340987RT0001",
      email: "vendor-edge-03@demo.example.com",
      accountHolder: "Riverstone Treasury Services Ltd.",
    },
    {
      scenario: "possible_duplicate",
      scenarioLabel: "Possible duplicate submission",
      legalName: "Demo Mosaic Field Services Ltd.",
      country: duplicateBase.country,
      taxId: duplicateBase.taxId,
      email: duplicateBase.email,
      accountHolder: "Demo Mosaic Field Services Ltd.",
      duplicateOf: 49,
    },
  ];

  const rejectedCases = [
    {
      scenario: "duplicate_confirmed",
      scenarioLabel: "Duplicate confirmed by reviewer",
      country: "United States",
      duplicateOf: 16,
      reviewerReason: "Reviewer confirmed this submission duplicates an existing vendor profile after comparing the legal entity and registration details.",
      monthOffset: 0,
    },
    {
      scenario: "bank_mismatch_unresolved",
      scenarioLabel: "Bank ownership mismatch unresolved",
      legalName: "Rivergate Service Partners Ltd.",
      country: "Canada",
      taxId: sampleId("Canada", 500),
      email: "vendor-reject-02@demo.example.com",
      accountHolder: "Rivergate Treasury Holdings Ltd.",
      reviewerReason: "The account holder did not match the vendor legal name, and the discrepancy remained unresolved after clarification.",
      monthOffset: 1,
    },
    {
      scenario: "tax_id_unresolved",
      scenarioLabel: "Tax ID issue unresolved",
      legalName: "Amber Fern Supply Pvt. Ltd.",
      country: "India",
      taxId: "INVALID123",
      email: "vendor-reject-03@demo.example.com",
      accountHolder: "Amber Fern Supply Pvt. Ltd.",
      reviewerReason: "The vendor did not provide a corrected tax identifier after the final clarification request.",
      monthOffset: 2,
    },
    {
      scenario: "registration_name_conflict",
      scenarioLabel: "Registration name conflict",
      legalName: "Westbridge Industrial Supply Ltd.",
      registrationName: "Westbridge Industrial Trading Ltd.",
      country: "United Kingdom",
      taxId: sampleId("United Kingdom", 500),
      email: "vendor-reject-04@demo.example.com",
      accountHolder: "Westbridge Industrial Supply Ltd.",
      reviewerReason: "The submitted registration document named a different legal entity, and the vendor did not resolve the conflict.",
      monthOffset: 3,
    },
    {
      scenario: "terms_declined",
      scenarioLabel: "Required onboarding terms declined",
      legalName: "Golden Coast Facilities Pty. Ltd.",
      country: "Australia",
      taxId: sampleId("Australia", 500),
      email: "vendor-reject-05@demo.example.com",
      accountHolder: "Golden Coast Facilities Pty. Ltd.",
      reviewerReason: "The vendor declined the required onboarding terms during the fictional review.",
      monthOffset: 4,
    },
    {
      scenario: "ownership_confirmation_missing",
      scenarioLabel: "Ownership confirmation not provided",
      legalName: "Cedar Valley Components LLC",
      country: "United States",
      taxId: sampleId("United States", 500),
      email: "vendor-reject-06@demo.example.com",
      accountHolder: "Cedar Valley Operations LLC",
      reviewerReason: "The vendor did not provide the requested ownership confirmation, so the analyst recorded a reasoned reviewer rejection.",
      monthOffset: 5,
    },
    {
      scenario: "entity_details_not_corrected",
      scenarioLabel: "Entity details not corrected",
      legalName: "Pine Harbor Learning Supplies Pvt. Ltd.",
      registrationName: "Pine Harbor Learning Services Pvt. Ltd.",
      country: "India",
      taxId: sampleId("India", 500),
      email: "vendor-reject-07@demo.example.com",
      accountHolder: "Pine Harbor Learning Supplies Pvt. Ltd.",
      reviewerReason: "The legal entity details remained inconsistent after the vendor was asked to correct the submission.",
      monthOffset: 2,
    },
    {
      scenario: "no_response_to_followup",
      scenarioLabel: "No response to final follow-up",
      legalName: "Bluewater Systems Supply Pty. Ltd.",
      country: "Australia",
      taxId: sampleId("Australia", 501),
      email: "vendor-reject-08@demo.example.com",
      accountHolder: "Bluewater Systems Supply Pty. Ltd.",
      reviewerReason: "No response was received by the stated deadline, so the reviewer closed the fictional case as Rejected.",
      monthOffset: 0,
    },
  ];

  window.ASA_DEMO_DATASET = Object.freeze({
    version: "2026.3",
    countryTargets: countryTargets.map((entry) => ({ ...entry })),
    monthlyTargets: monthSchedule.map((entry) => ({ ...entry })),
    normalCases,
    edgeCases,
    rejectedCases,
  });
})();

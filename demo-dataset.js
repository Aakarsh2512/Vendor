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
  ];
  const countries = ["India", "United States", "United Kingdom", "Canada", "Australia"];

  function sampleId(country, index) {
    if (country === "India") return "DEMOA" + String(1001 + index).padStart(4, "0") + String.fromCharCode(65 + index % 26);
    if (country === "United States") return "12-" + String(3450000 + index).padStart(7, "0");
    if (country === "United Kingdom") return "GB" + String(123450000 + index).padStart(9, "0");
    if (country === "Canada") return String(700000000 + index) + "RT0001";
    return String(10000000000 + index);
  }

  const normalCases = names.map((legalName, index) => {
    const country = countries[index % countries.length];
    const sequence = String(index + 1).padStart(3, "0");
    return {
      legalName: legalName + (country === "India" ? " Pvt. Ltd." : " Ltd."),
      country,
      taxId: sampleId(country, index),
      email: "vendor-" + sequence + "@demo.example.com",
      accountHolder: legalName + (country === "India" ? " Pvt. Ltd." : " Ltd."),
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
    },
  ];

  window.ASA_DEMO_DATASET = Object.freeze({
    version: "2026.2",
    normalCases,
    edgeCases,
  });
})();

/*
 * Curated, source-linked reference data for the free local ASA Copilot.
 * This is a static help library, not a live registry or an authoritative legal dataset.
 */
window.ASA_KNOWLEDGE_BASE = Object.freeze({
  version: "1.1",
  reviewedOn: "2026-11-05",
  documents: [
    {
      name: "Registration document",
      reviewerCue: "Compare the legal name and registration details with the intake fields.",
    },
    {
      name: "Tax document",
      reviewerCue: "Check that the supplied tax or registration ID appears on the document and matches the intake value.",
    },
    {
      name: "Bank proof",
      reviewerCue: "Compare the account holder name with the vendor details. This prototype never asks for an account number.",
    },
  ],
  vendorTypes: [
    {
      id: "software",
      label: "Software, cloud, or IT services",
      typical: [
        { name: "Service description and access/data-flow summary", why: "Shows what the service does, which systems it touches, and what information it receives." },
        { name: "Security assurance evidence (if available)", why: "Review the scope and date of a SOC 2, ISO 27001, or equivalent report; a badge alone does not establish coverage." },
      ],
      conditional: [
        { when: "personalData", name: "Data processing terms and subprocessors", why: "Use when the provider handles personal or sensitive information; confirm roles, locations, retention, and deletion." },
        { when: "productionAccess", name: "Incident response and business continuity summary", why: "Useful when the service has production access or could interrupt a critical operation." },
      ],
    },
    {
      id: "professional",
      label: "Professional services or consulting",
      typical: [
        { name: "Statement of work and named delivery roles", why: "Makes the work, deliverables, owners, and access boundaries reviewable." },
        { name: "Relevant credentials or professional registrations", why: "Check where the engagement relies on regulated or specialist expertise." },
      ],
      conditional: [
        { when: "materialAdvice", name: "Professional indemnity or errors-and-omissions cover", why: "Consider when the advice or work could create material financial, operational, or client impact." },
        { when: "conflictSensitive", name: "Conflict-of-interest declaration", why: "Useful for procurement, assurance, valuation, or other work where independence matters." },
      ],
    },
    {
      id: "goods",
      label: "Goods, equipment, or supplies",
      typical: [
        { name: "Product specification and model/part list", why: "Confirms what is being purchased and supports receiving and quality checks." },
        { name: "Warranty, returns, and support terms", why: "Clarifies defect handling and the supplier's responsibilities after delivery." },
      ],
      conditional: [
        { when: "regulatedGoods", name: "Applicable safety or conformity declarations", why: "Request for regulated or safety-sensitive products, using the rules for the destination market." },
        { when: "crossBorder", name: "Country of origin and import/customs paperwork", why: "Relevant when goods cross borders; confirm which party is responsible for import obligations." },
      ],
    },
    {
      id: "logistics",
      label: "Logistics or transport",
      typical: [
        { name: "Service coverage, carrier, and subcontractor details", why: "Shows who handles the shipment and where the service operates." },
        { name: "Cargo liability and insurance summary", why: "Lets the reviewer compare coverage with the shipment value and service scope." },
      ],
      conditional: [
        { when: "crossBorder", name: "Relevant transport permits and customs process", why: "Confirm permits and customs responsibilities for the actual routes and goods." },
        { when: "regulatedGoods", name: "Special handling procedures and staff training", why: "Use when the vendor handles hazardous, temperature-controlled, or otherwise restricted goods." },
      ],
    },
    {
      id: "marketing",
      label: "Marketing or creative services",
      typical: [
        { name: "Deliverables, usage rights, and third-party asset list", why: "Clarifies ownership, licenses, channels, and reuse permissions." },
        { name: "Subcontractor and talent/creator details", why: "Makes third-party delivery roles and approvals visible." },
      ],
      conditional: [
        { when: "personalData", name: "Audience-data source and consent/permission records", why: "Request when campaigns use personal data, customer lists, tracking, or targeted audiences." },
        { when: "personalData", name: "Data processing terms and platform/subprocessor list", why: "Relevant when the provider or its platforms process personal information for the company." },
      ],
    },
    {
      id: "facilities",
      label: "Facilities or on-site services",
      typical: [
        { name: "Work method, service scope, and escalation contact", why: "Shows how the work is performed and who responds to an issue." },
        { name: "Insurance and relevant trade qualifications", why: "Lets the reviewer check whether cover and qualifications fit the work being done." },
      ],
      conditional: [
        { when: "onsite", name: "Site safety training and access records", why: "Apply the company's site-access and safety process to personnel who will attend." },
        { when: "regulatedGoods", name: "Task-specific permits or safety method statements", why: "Consider for electrical, construction, hazardous-material, or other controlled work." },
      ],
    },
    {
      id: "data-processing",
      label: "Data processing or business-process services",
      typical: [
        { name: "Data-flow, storage-location, and retention summary", why: "Identifies what data is handled, where it goes, and when it is deleted." },
        { name: "Security controls and incident-notification process", why: "Gives the reviewer evidence to assess protection and escalation arrangements." },
      ],
      conditional: [
        { when: "personalData", name: "Data processing terms and subprocessor register", why: "Usually relevant when personal or sensitive information is processed on the company's behalf." },
        { when: "criticalService", name: "Business continuity and recovery summary", why: "Useful if interruption would affect a critical business process." },
      ],
    },
    {
      id: "regulated",
      label: "Regulated, healthcare, or safety-sensitive services",
      typical: [
        { name: "Current licenses and regulator/professional registrations", why: "Confirm the relevant license, entity, activity, and jurisdiction with the approved source." },
        { name: "Quality, safety, or clinical-governance evidence", why: "Ask for evidence that fits the activity and the company's risk policy." },
      ],
      conditional: [
        { when: "personalData", name: "Privacy/data protection terms and access controls", why: "Relevant where health, identity, or other sensitive information is accessed or stored." },
        { when: "onsite", name: "Personnel credentials and site safety evidence", why: "Check people who will deliver the regulated or safety-sensitive work at company locations." },
      ],
    },
    {
      id: "other",
      label: "Other or not sure yet",
      typical: [
        { name: "Statement of work or purchase description", why: "Start by defining the work, deliverables, data access, locations, and responsible contacts." },
        { name: "Relevant business registration, tax, and payment evidence", why: "Follow the company's standard onboarding checklist and country-specific process." },
      ],
      conditional: [
        { when: "personalData", name: "Data handling and privacy/security evidence", why: "Consider when the vendor can access personal, confidential, or sensitive information." },
        { when: "onsite", name: "Insurance, qualifications, and site safety records", why: "Consider when work is performed at company locations or creates physical safety exposure." },
      ],
    },
  ],
  countries: [
    {
      country: "India",
      identifier: "PAN or GSTIN",
      format: "PAN is 10 alphanumeric characters. GSTIN is 15 alphanumeric characters.",
      pattern: "^(?:[A-Z]{5}\\d{4}[A-Z]|[A-Z0-9]{15})$",
      ruleDescription: "Basic PAN or GSTIN character and length shape only.",
      reviewerCue: "PAN and GSTIN are different identifiers. Confirm which identifier your process expects, then compare the full value with the source document.",
      sources: [
        { title: "Income Tax Department: PAN", url: "https://wmstatic-prd.incometaxindia.gov.in/web/guest/pan" },
        { title: "Income Tax Department: PAN format", url: "https://incometaxindia.gov.in/Documents/MOP_Volume_II.pdf" },
        { title: "GST Portal: GSTIN format guidance", url: "https://tutorial.gst.gov.in/downloads/invoiceuploadofflineutility.pdf" },
      ],
    },
    {
      country: "United States",
      identifier: "Employer Identification Number (EIN)",
      format: "EIN has 9 digits; it is commonly written with a hyphen after the first 2 digits.",
      pattern: "^\\d{2}-?\\d{7}$",
      ruleDescription: "Basic 9-digit EIN shape; the hyphen is optional.",
      reviewerCue: "This only checks the number shape. Match it against the vendor's source document; no IRS lookup is performed.",
      sources: [
        { title: "IRS: EIN format", url: "https://www.irs.gov/irm/part3/irm_03-024-038" },
      ],
    },
    {
      country: "United Kingdom",
      identifier: "VAT registration number",
      format: "A UK VAT registration number has 9 digits; this guide also accepts a GB prefix.",
      pattern: "^(?:GB)?\\d{9}$",
      ruleDescription: "Basic 9-digit VAT number shape, optionally prefixed by GB.",
      reviewerCue: "A format match does not prove the registration is active or belongs to this vendor. Compare the source and use the official checker if your process requires verification.",
      sources: [
        { title: "GOV.UK: VAT registration number", url: "https://www.gov.uk/register-for-vat/how-register-for-vat" },
        { title: "HMRC: Checking a VAT number", url: "https://www.gov.uk/hmrc-internal-manuals/enquiry-manual/em3058" },
      ],
    },
    {
      country: "Canada",
      identifier: "Business Number (BN)",
      format: "A BN has 9 digits. A program account can add a 2-letter program identifier and 4-digit reference.",
      pattern: "^\\d{9}(?:[A-Z]{2}\\d{4})?$",
      ruleDescription: "Basic 9-digit BN shape, optionally followed by a program account suffix.",
      reviewerCue: "Program account types vary. Confirm the full number and suffix on the vendor's CRA document.",
      sources: [
        { title: "Canada Revenue Agency: Business Number program accounts", url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account.html" },
      ],
    },
    {
      country: "Singapore",
      identifier: "Unique Entity Number (UEN)",
      format: "UEN patterns vary by entity type. Use the official entity record rather than one universal pattern.",
      pattern: null,
      ruleDescription: "No single UEN pattern is enforced here; reviewer confirmation is required.",
      reviewerCue: "ACRA examples show different UEN patterns for companies, businesses, LLPs, and other entity types. Compare the identifier with the matching official entity record.",
      sources: [
        { title: "ACRA: UEN examples by business structure", url: "https://www.acra.gov.sg/resources/guides-forms/applying-for-special-uen/" },
      ],
    },
    {
      country: "Australia",
      identifier: "Australian Business Number (ABN)",
      format: "An ABN has 11 digits.",
      pattern: "^\\d{11}$",
      ruleDescription: "Basic 11-digit ABN shape only.",
      reviewerCue: "This shape check does not confirm the ABN is active or belongs to the vendor. Compare it with the source document and use the official ABN Lookup if your process requires verification.",
      sources: [
        { title: "Australian Business Register: Applying for an ABN", url: "https://www.abr.gov.au/business-super-funds-charities/applying-abn" },
        { title: "Australian Business Register: ABN Lookup", url: "https://abr.business.gov.au/" },
      ],
    },
    {
      country: "Other",
      identifier: "Country-specific tax or registration ID",
      format: "No country rule is configured. Record the value exactly as shown on the source document.",
      pattern: null,
      ruleDescription: "Manual confirmation required.",
      reviewerCue: "Have a reviewer check the ID against the issuing authority or the organization's approved reference process.",
      sources: [],
    },
  ],
});

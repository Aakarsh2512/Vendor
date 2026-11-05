/*
 * Curated, source-linked reference data for the free local ASA Copilot.
 * This is a static help library, not a live registry or an authoritative legal dataset.
 */
window.ASA_KNOWLEDGE_BASE = Object.freeze({
  version: "1.0",
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

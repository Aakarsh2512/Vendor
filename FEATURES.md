# PS-2 review workspace

## Run the complete process

Create a case from a vendor PDF or the intake form. Attach registration, tax, and bank proof. Open the case and choose **Run review**. The live runner reads actual files, checks completeness and identifiers, compares evidence, saves the rule-based decision, prepares follow-up, and finalizes Approved runs. Pending runs pause for vendor evidence or analyst review. Failed extraction stops the runner without creating a new approval. Illustrative portfolio cases need actual attachments before a new run.

## Case Copilot

Choose a vendor in Analyst Copilot or open a case from the queue. Ask why the case has its status, which documents disagree, what resolves the issue, or what changed after a response. Answers are assembled from that case's saved checks, decisions, and evidence. This is an explainable rule-based assistant, not a generative model or external identity verification service.

## Evidence comparison

Compare submitted names, tax IDs, country, and bank holder against extracted supporting documents. Sources show file names, page numbers where available, and quoted text. Open a source to inspect its extracted evidence and download the original; PDFs also have an embedded preview. Illustrative records are clearly labeled and have no original attached file.

## Vendor response loop

1. For a pending case, review the requested items and optionally add a question.
2. Download the self-contained request HTML page and send it through your usual channel.
3. The vendor opens it in a browser, supplies an explanation and replacement documents, and downloads a JSON response.
4. Import the returned JSON into the same case. Replacement files trigger a review rerun; explanation-only responses remain for analyst assessment.
5. The prior decision and extracted evidence are retained in response history; replaced original files are archived in local IndexedDB. Existing events remain in the audit timeline.

Each request has a random ID. Responses for another case, superseded requests, repeated responses, invalid attachments, and oversized packages are rejected. Exporting another request supersedes the previous one. A response is not proof of sender identity: the analyst should receive it through their established vendor channel. Nothing is emailed automatically. The request page does not require access to the private hosted workspace.

## Hosted and local processing

The hosted application uses a Cloudflare Worker endpoint at `/api/extract` for real PDF, DOCX, TXT, and CSV extraction. The downloadable Python app uses its existing FastAPI reader. Files are processed in memory on the reader and are not retained by that service. Case records stay in the analyst's browser, with attachments in IndexedDB; this build does not add shared multi-user case storage.

Limits: 10 MB per file, 30 MB combined, up to six attachments per extraction. Hosted PDFs are limited to 100 pages. Images and scanned PDFs require manual review; OCR is not included. Tax checks validate syntax, not live registry status. Bank relationships and duplicate resolution require explicit reviewer evidence and notes. Rejection remains a reasoned reviewer override.

## Start locally

`python -m pip install -r requirements.txt`

`python server.py`

Open `http://127.0.0.1:8000`. Use the included demo_packet files to demonstrate the process with fictional inputs.

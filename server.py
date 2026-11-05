"""Local-only API and static server for the ASA vendor onboarding prototype."""

from __future__ import annotations

import io
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree

import pymupdf as fitz
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parent
MAX_FILE_BYTES = 10 * 1024 * 1024

FIELD_RULES = [
    (
        "legalName",
        "Legal business name",
        r"legal\s+(?:business|company)\s+name|registered\s+(?:legal\s+)?name|company\s+name|business\s+name|vendor\s+name",
    ),
    (
        "country",
        "Country or region",
        r"country(?:\s+or\s+region)?|country\s+of\s+registration|incorporation\s+country",
    ),
    (
        "taxId",
        "Tax or registration ID",
        r"tax\s*(?:identification\s*)?(?:id|number|no\.?)|tax\s*registration\s*(?:id|number|no\.?)|vat(?:\s*(?:id|number|no\.?))?|gstin|gst(?:\s*(?:id|number|no\.?))?|e\.?i\.?n\.?|t\.?i\.?n\.?|pan|business\s+registration\s+(?:id|number|no\.?)|registration\s+(?:id|number|no\.?)",
    ),
    (
        "accountHolder",
        "Bank account holder",
        r"bank\s+account\s+holder|account\s+holder|account\s+name|beneficiary(?:\s+name)?",
    ),
    (
        "email",
        "Contact email",
        r"primary\s+contact\s+email|contact\s+email|email\s+address|e-mail|email",
    ),
]


app = FastAPI(title="ASA Vendor Onboarding Local Prototype")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["null", "http://127.0.0.1:8000", "http://localhost:8000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/styles.css", include_in_schema=False)
def styles() -> FileResponse:
    return FileResponse(BASE_DIR / "styles.css", media_type="text/css")


@app.get("/app.js", include_in_schema=False)
def javascript() -> FileResponse:
    return FileResponse(BASE_DIR / "app.js", media_type="text/javascript")


@app.get("/knowledge-base.js", include_in_schema=False)
def knowledge_base() -> FileResponse:
    return FileResponse(BASE_DIR / "knowledge-base.js", media_type="text/javascript")


@app.get("/demo-dataset.js", include_in_schema=False)
def demo_dataset() -> FileResponse:
    return FileResponse(BASE_DIR / "demo-dataset.js", media_type="text/javascript")


@app.get("/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}


def text_from_pdf(data: bytes) -> tuple[list[tuple[int, str]], int]:
    with fitz.open(stream=data, filetype="pdf") as pdf:
        pages = [(index + 1, page.get_text("text")) for index, page in enumerate(pdf)]
        return pages, len(pdf)


def text_from_docx(data: bytes) -> list[tuple[int, str]]:
    with zipfile.ZipFile(io.BytesIO(data)) as document:
        xml_content = document.read("word/document.xml")
    root = ElementTree.fromstring(xml_content)
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []
    for paragraph in root.findall(".//w:p", namespace):
        words = [node.text or "" for node in paragraph.findall(".//w:t", namespace)]
        line = "".join(words).strip()
        if line:
            paragraphs.append(line)
    return [(0, "\n".join(paragraphs))]


def text_from_plain(data: bytes) -> list[tuple[int, str]]:
    try:
        value = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        value = data.decode("cp1252", errors="replace")
    return [(0, value)]


def find_fields(pages: list[tuple[int, str]]) -> list[dict[str, str | int]]:
    found: dict[str, dict[str, str | int]] = {}
    separator = r"(?::|#|[-–]|,|\t|\s{2,})"

    for page_number, page_text in pages:
        for raw_line in page_text.splitlines():
            line = " ".join(raw_line.replace("\u00a0", " ").split())
            if not line:
                continue
            for key, label, label_pattern in FIELD_RULES:
                if key in found:
                    continue
                match = re.match(
                    rf"^\s*(?:{label_pattern})\s*{separator}\s*(?P<value>.+?)\s*$",
                    line,
                    re.IGNORECASE,
                )
                if not match:
                    continue
                value = match.group("value").strip(" \t:;|,")
                if value:
                    found[key] = {
                        "key": key,
                        "label": label,
                        "value": value[:180],
                        "page": page_number,
                        "evidence": line[:260],
                        "method": "Label match",
                    }

            if "email" not in found:
                email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", line, re.IGNORECASE)
                if email_match:
                    found["email"] = {
                        "key": "email",
                        "label": "Contact email",
                        "value": email_match.group(0)[:180],
                        "page": page_number,
                        "evidence": line[:260],
                        "method": "Email pattern",
                    }

    return list(found.values())


def extract_document(filename: str, content_type: str, data: bytes, kind: str) -> dict:
    suffix = Path(filename).suffix.lower()
    result = {
        "kind": kind,
        "filename": filename,
        "contentType": content_type or "application/octet-stream",
        "status": "read",
        "message": "",
        "pageCount": 0,
        "textCharacters": 0,
        "fields": [],
        "preview": "",
    }

    if suffix == ".pdf":
        try:
            pages, page_count = text_from_pdf(data)
        except Exception as error:
            result.update(status="unreadable", message=f"This PDF could not be opened: {error}")
            return result
        result["pageCount"] = page_count
    elif suffix == ".docx":
        try:
            pages = text_from_docx(data)
        except Exception:
            result.update(status="unreadable", message="This Word document could not be read.")
            return result
    elif suffix in {".txt", ".csv"}:
        pages = text_from_plain(data)
    elif suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff"}:
        result.update(
            status="needs_ocr",
            message="Image attached. OCR is not available in this prototype, so enter its details manually.",
        )
        return result
    else:
        result.update(
            status="unsupported",
            message="This file type is attached to the run but cannot be read yet. Use PDF, DOCX, TXT, or CSV.",
        )
        return result

    full_text = "\n".join(text for _, text in pages).strip()
    result["textCharacters"] = len(full_text)
    if not full_text:
        result.update(
            status="needs_ocr",
            message="No selectable text was found. This may be a scanned PDF; OCR is not available in this prototype.",
        )
        return result

    result["fields"] = find_fields(pages)
    result["preview"] = full_text[:700]
    if result["fields"]:
        result["message"] = f"Read {len(result['fields'])} labelled field(s) from the document text."
    else:
        result["message"] = "Text was read, but no recognised labelled fields were found. Review the preview or enter details manually."
    return result


@app.post("/api/extract")
async def extract_documents(
    run_id: str = Form(...),
    files: list[UploadFile] = File(...),
    kinds: list[str] = Form(...),
) -> dict:
    if len(files) != len(kinds):
        raise HTTPException(status_code=400, detail="Each attached document needs a document type.")

    documents = []
    for upload, kind in zip(files, kinds):
        data = await upload.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail=f"{upload.filename or 'A file'} exceeds the 10 MB limit.")
        documents.append(
            extract_document(
                upload.filename or "unnamed document",
                upload.content_type or "application/octet-stream",
                data,
                kind,
            )
        )
        await upload.close()

    return {
        "runId": run_id,
        "processedAt": datetime.now(timezone.utc).isoformat(),
        "documents": documents,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

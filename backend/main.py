import os
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader

load_dotenv()
client = genai.Client()

MODEL = "gemini-3.5-flash-lite"

app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    text: str


class Deadline(BaseModel):
    course: str     # e.g. "CMPUT 174"
    title: str      # e.g. "Midterm 1"
    date: str       # e.g. "2026-10-15"
    category: str   # assignment, lab, quiz, midterm, final, or other
    source: str     # the exact sentence from the syllabus


class DeadlineList(BaseModel):
    deadlines: list[Deadline]


def gemini_error(e: Exception):
    """Turn a Gemini crash into a clear message for the frontend."""
    message = str(e)
    if "429" in message:
        return HTTPException(status_code=429, detail="Out of Gemini requests for now. Try again later.")
    if "503" in message:
        return HTTPException(status_code=503, detail="Gemini is busy right now. Try again in a minute.")
    return HTTPException(status_code=500, detail="Something went wrong talking to Gemini.")


def extract_deadlines(text: str) -> DeadlineList:
    """The shared brain: syllabus text in, deadlines out."""
    prompt = (
        "Extract every graded deadline from this syllabus text. "
        "Write dates as YYYY-MM-DD. If no year is given, assume 2026. "
        "course is the course code, like CMPUT 174. "
        "source is the exact sentence from the syllabus this deadline came from, copied word for word, unchanged. "
        "category must be one of: assignment, lab, quiz, midterm, final, other.\n\n"
        + text
    )
    try:
        interaction = client.interactions.create(
            model=MODEL,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": DeadlineList.model_json_schema(),
            },
        )
        return DeadlineList.model_validate_json(interaction.output_text)
    except Exception as e:
        raise gemini_error(e)


@app.get("/")
def home():
    return {"message": "Backend is alive"}


@app.post("/parse")
def parse(msg: Message):
    return extract_deadlines(msg.text)


@app.post("/parse-pdf")
def parse_pdf(file: UploadFile):
    try:
        reader = PdfReader(file.file)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        raise HTTPException(status_code=400, detail="Couldn't read that PDF.")
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No text found in that PDF. It might be a scanned image. Try pasting the text instead.",
        )
    return extract_deadlines(text)
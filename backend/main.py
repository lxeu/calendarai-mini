from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client()

# One place to change the model for the whole app
MODEL = "gemini-3.5-flash-lite"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    text: str


class Deadline(BaseModel):
    title: str      # e.g. "Midterm 1"
    date: str       # e.g. "2026-10-15"
    category: str   # assignment, lab, quiz, midterm, final, or other


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


@app.get("/")
def home():
    return {"message": "Backend is alive"}


@app.post("/ask")
def ask(msg: Message):
    try:
        interaction = client.interactions.create(model=MODEL, input=msg.text)
    except Exception as e:
        raise gemini_error(e)
    return {"reply": interaction.output_text}


@app.post("/parse")
def parse(msg: Message):
    prompt = (
        "Extract every graded deadline from this syllabus text. "
        "Write dates as YYYY-MM-DD. If no year is given, assume 2026. "
        "category must be one of: assignment, lab, quiz, midterm, final, other.\n\n"
        + msg.text
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
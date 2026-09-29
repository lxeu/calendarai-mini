from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    text: str


@app.get("/")
def home():
    return {"message": "Backend is alive"}


@app.post("/echo")
def echo(msg: Message):
    return {"you_sent": msg.text, "length": len(msg.text)}


@app.post("/ask")
def ask(msg: Message):
    interaction = client.interactions.create(
        model="gemini-3.8-flash",
        input=msg.text,
    )
    return {"reply": interaction.output_text}

class Deadline(BaseModel):
    title: str      # e.g. "Midterm 1"
    date: str       # e.g. "2026-10-15"
    category: str   # assignment, lab, quiz, midterm, final, or other


class DeadlineList(BaseModel):
    deadlines: list[Deadline]


@app.post("/parse")
def parse(msg: Message):
    prompt = (
        "Extract every graded deadline from this syllabus text. "
        "Write dates as YYYY-MM-DD. If no year is given, assume 2026. "
        "category must be one of: assignment, lab, quiz, midterm, final, other.\n\n"
        + msg.text
    )
    interaction = client.interactions.create(
        model="gemini-3.8-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": DeadlineList.model_json_schema(),
        },
    )
    return DeadlineList.model_validate_json(interaction.output_text)
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
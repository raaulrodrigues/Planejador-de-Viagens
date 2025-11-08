import uvicorn
import google.generativeai as genai
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import asyncio

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel('gemini-2.0-flash')

class TravelRequest(BaseModel):
    destination: str
    days: int
    interests: str
    travel_type: str
    budget: str

@app.get("/")
def read_root():
    return {"message": "API do Planejador de Viagens está online"}

async def stream_response(prompt: str):
    try:
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.01)
    except Exception as e:
        yield f"Erro ao gerar resposta: {str(e)}"

@app.post("/planejar-viagem")
async def plan_trip(request: TravelRequest):
    prompt = f"""
    Crie um roteiro de viagem detalhado para {request.destination} com duração de {request.days} dias.
    Os interesses principais da viagem são: {request.interests}.

    Leve em consideração que esta é uma viagem do tipo "{request.travel_type}" e o orçamento é "{request.budget}".
    As sugestões de restaurantes, atividades e transporte devem respeitar esse perfil.

    Organize a resposta dia a dia. Para cada dia, sugira atividades para manhã, tarde e noite.
    Inclua também:
    1.  Sugestões de restaurantes locais (pelo menos 3) que se encaixem no orçamento.
    2.  Dicas culturais ou de etiqueta importantes sobre {request.destination}.
    3.  Uma sugestão de "mala inteligente" (5 itens essenciais para levar).

    Formate a resposta de forma clara e organizada usando Markdown.
    """
    
    return StreamingResponse(stream_response(prompt), media_type="text/plain")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
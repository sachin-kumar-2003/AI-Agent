from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain.messages import HumanMessage, AIMessage
from app.main import retrieve_all_thread, load_chat_history, delete_thread, graph

app = FastAPI()
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost:5173",
    "http://localhost:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/threads")
def get_threads():
    threads = retrieve_all_thread()    
    return {"threads": threads}

@app.get("/chat/{thread_id}")
def get_chat(thread_id: str):
    history = load_chat_history(thread_id)
    return {"history": history}

@app.delete("/thread/delete/{thread_id}")
def delete_thread_api(thread_id: str):
    all_threads = retrieve_all_thread()
    if thread_id not in all_threads:
        return {"message": "Thread not found"}
    message = delete_thread(thread_id)
    return {"message": message}



@app.post("/chat")
def chat(request: dict):
    user_input = request.get("message")
    thread_id = request.get("thread_id")

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    def stream_response():
        for msg, meta in graph.stream(
            {"messages": [HumanMessage(content=user_input)]},
            config=config,
            stream_mode="messages"
        ):
            if isinstance(msg, AIMessage) and msg.content:
                yield msg.content

    return StreamingResponse(stream_response(), media_type="text/plain")
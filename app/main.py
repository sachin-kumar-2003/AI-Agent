import os
from typing_extensions import Annotated, TypedDict
from langchain.messages import AIMessage, HumanMessage
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPEN_ROUTER_KEY")
class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages] 
    
llm = init_chat_model(
    model="openrouter/free",
    model_provider="openai",
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    
)

def chat_node(state:State):
    messages = state['messages']
    response = llm.invoke(messages)
    return {'messages':[response]}

checkpointer = MemorySaver()
graph_builder = StateGraph(State)
graph_builder.add_node('chat_node', chat_node)

graph_builder.add_edge(START, 'chat_node')
graph_builder.add_edge('chat_node', END)

graph = graph_builder.compile(checkpointer=checkpointer)



thread_id = '1'
config = {'configurable':{'thread_id':thread_id}}

# while True:
#     user_message = input("ask ->")
#     if user_message.strip().lower() in ["exit", "bye", "quite"]:
#         break
#     for message_chunk, metadata in graph.stream({ 'messages':[HumanMessage(content=user_message)]}, config=config, stream_mode='messages'):
#         if message_chunk.content:
#             print(message_chunk.content,end="", flush=True)

import os
from typing_extensions import Annotated, TypedDict
from langchain.messages import AIMessage, HumanMessage
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_community.tools import DuckDuckGoSearchRun 
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3
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

search_tool = DuckDuckGoSearchRun()

tools = [search_tool]

llm = llm.bind_tools(tools=tools)

tool_node = ToolNode(tools=tools)

def chat_node(state:State):
    """It may answer the question or it can tool call
    if you are getting response from tools you have to 
    structure the answer and make it more readable.
    """
    messages = state['messages']
    response = llm.invoke(messages)
    return {'messages':[response]}

conn = sqlite3.connect(database="chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

graph_builder = StateGraph(State)
graph_builder.add_node('chat_node', chat_node)
graph_builder.add_node('tools', tool_node)

graph_builder.add_edge(START, 'chat_node')
graph_builder.add_conditional_edges('chat_node', tools_condition)
graph_builder.add_edge('tools', 'chat_node')




graph = graph_builder.compile(checkpointer=checkpointer)

def retrieve_all_thread():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)


# while True:
#     user_message = input("ask ->")
#     if user_message.strip().lower() in ["exit", "bye", "quite"]:
#         break
#     for message_chunk, metadata in graph.stream({ 'messages':[HumanMessage(content=user_message)]}, config=config, stream_mode='messages'):
#         if message_chunk.content:
#             print(message_chunk.content,end="", flush=True)
def load_chat_history(thread_id):
    config = {"configurable": {"thread_id": thread_id}}
    state = graph.get_state(config)

    if not state or "messages" not in state.values:
        return []

    history = []
    for msg in state.values["messages"]:
        if msg.type == "human":
            history.append({"role": "user", "content": msg.content})
        elif msg.type == "ai":
            history.append({"role": "assistant", "content": msg.content})

    return history


def delete_thread(thread_id: str) -> None:
    """Delete a thread from LangGraph SQLite checkpoint storage."""
    with conn:
        conn.execute("DELETE FROM writes WHERE thread_id = ?", (thread_id,))
        conn.execute("DELETE FROM checkpoints WHERE thread_id = ?", (thread_id,))

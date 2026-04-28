import os
from typing_extensions import Annotated, TypedDict
from langchain.messages import AIMessage, HumanMessage, SystemMessage
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


from .qdrant_retreival import main

load_dotenv()

SYSTEM_PROMPT = """You are an intelligent assistant designed to answer user queries clearly and helpfully.

Core Behavior:
- Always provide clear, structured, and easy-to-read responses.
- If a query is general, answer it directly in a concise and informative way.
- If a query involves courses (e.g., MBA, MCA, or other academic programs), you may call the tool 'search_database' to retrieve relevant information.
- When you receive data from a tool:
  - Organize the response properly using headings, bullet points, or sections.
  - Simplify and format the information for readability.
  - Do not return raw tool output; always refine it.

Tool Usage Rule:
- Use 'search_database' only when the user explicitly asks about:
  - Courses (MBA, MCA, B.Tech, etc.)
  - Course details (fees, duration, eligibility, syllabus, etc.)
- Do not call tools unnecessarily.

Special Identity Rule:
- If the user asks 'Who created you?', 'Who made you?', or 'Who is your creator?', you must respond exactly with:
  'I am created by the student of Graphic Era Hill University and the name of the student is Sachin Kumar.'
- Do not modify, expand, or rephrase this answer.

Response Style Guidelines:
- Use proper formatting such as headings and bullet points where helpful.
- Keep the tone professional, friendly, and easy to understand.
- Avoid unnecessary repetition or overly long answers.

Example:
User: Who created you?
Assistant: I am created by the student of Graphic Era Hill University and the name of the student is Sachin Kumar."""

api_key = os.getenv("OPEN_ROUTER_KEY")
model_name = os.getenv("MODEL_NAME")
class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages] 
    
llm = init_chat_model(
    model=model_name,
    model_provider="openai",
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
)

# search_tool = DuckDuckGoSearchRun()
def search_database(state:State):
    """This tool is used to search the database for courses based on the user's query. It retrieves the latest user query from the state and passes it to the main function, which performs a search in the Qdrant vector database and returns relevant course information. if there is related url provide that too
    example user query - > what are the courses available ?
    output: 
    here are the list of courses available :
    list of courses
    if there is any url related to the courses provide that too.
    
    example user query - > what are the courses available in mba ?
    output:
    here are the list of courses available in mba :
    list of courses that are related to the mba field
    if there is any url related to the courses provide that too.    
    """
    user_query = state["messages"][-1].content
    print(str(user_query))
    return main(user_query)

# tools = [search_tool, search_database]
tools = [search_database]

llm = llm.bind_tools(tools=tools)

tool_node = ToolNode(tools=tools)

def chat_node(state:State):
    """This node is responsible for generating a response based on the conversation history. It takes the messages from the state, adds the system prompt as the first message, and then invokes the language model to generate a response. The response is returned as a list of messages, which will be added to the conversation history in the state."""
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),  
        *state["messages"]
    ]
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
    print(state)

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
        return "Thread deleted successfully"

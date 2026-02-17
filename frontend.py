import streamlit as st
import uuid
from langchain.messages import HumanMessage, AIMessage
from app.main import graph, retrieve_all_thread, load_chat_history, delete_thread


# -----------------------
# Helpers
# -----------------------
def generate_id():
    return str(uuid.uuid4())


def add_thread(thread_id):
    if thread_id not in st.session_state["chat_thread"]:
        st.session_state["chat_thread"].insert(0, thread_id)


def reset_chat():
    thread_id = generate_id()
    st.session_state["thread_id"] = thread_id
    add_thread(thread_id)


def delete_thread_local(thread_id):
    """Only removes from sidebar UI (DB deletion handled separately if needed)"""

    if thread_id in st.session_state["chat_thread"]:
        st.session_state["chat_thread"].remove(thread_id)

    if st.session_state["thread_id"] == thread_id:
        if len(st.session_state["chat_thread"]) > 0:
            st.session_state["thread_id"] = st.session_state["chat_thread"][0]
        else:
            new_id = generate_id()
            st.session_state["thread_id"] = new_id
            st.session_state["chat_thread"] = [new_id]


# -----------------------
# Page UI
# -----------------------
st.set_page_config(
    page_title="Course-Connect:Site-Bot",
    page_icon="🤖",
    layout="centered"
)

st.title("SITE-BOT ASSISTANT")
st.caption("Powered by Sachin")


# -----------------------
# Session State Init
# -----------------------
if "thread_id" not in st.session_state:
    st.session_state["thread_id"] = generate_id()

if "chat_thread" not in st.session_state:
    st.session_state["chat_thread"] = retrieve_all_thread()

add_thread(st.session_state["thread_id"])


# -----------------------
# Sidebar
# -----------------------
with st.sidebar:
    st.title("AI-Agent")

    if st.button("New chat"):
        reset_chat()
        st.rerun()

    st.header("Conversation")

    for tid in list(st.session_state["chat_thread"]):
        col1, col2 = st.columns([4, 1])

        # open chat
        if col1.button(tid[:22], key=f"open_{tid}"):
            st.session_state["thread_id"] = tid
            st.rerun()

        # delete chat (UI only)
        if col2.button("🗑", key=f"del_{tid}"):
            delete_thread(tid)
            delete_thread_local(tid)
            st.rerun()


# -----------------------
# Load Chat History FROM SQLITE
# -----------------------
current_history = load_chat_history(st.session_state["thread_id"])

for message in current_history:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


# -----------------------
# Chat Input
# -----------------------
user_input = st.chat_input("Type your message here...")

if user_input:

    # show user immediately
    with st.chat_message("user"):
        st.markdown(user_input)

    # move active chat to top
    if st.session_state["thread_id"] in st.session_state["chat_thread"]:
        st.session_state["chat_thread"].remove(st.session_state["thread_id"])
        st.session_state["chat_thread"].insert(0, st.session_state["thread_id"])

    config = {
        "configurable": {
            "thread_id": st.session_state["thread_id"]
        }
    }

    # assistant streaming response
    with st.chat_message("assistant"):
        ai_reply_parts = []

        def stream_response():
            for message_chunk, metadata in graph.stream(
                {"messages": [HumanMessage(content=user_input)]},
                config=config,
                stream_mode="messages"
            ):
                if isinstance(message_chunk, AIMessage):
                    token = message_chunk.content
                    ai_reply_parts.append(token)
                    yield token

        
        st.write_stream(stream_response)

    # No manual saving needed — LangGraph checkpoint handles persistence

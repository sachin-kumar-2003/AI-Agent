import streamlit as st
from app.main import graph
from langchain.messages import HumanMessage
import uuid


# -----------------------
# Helpers
# -----------------------
def genrate_id():
    return str(uuid.uuid4())


def add_thread(thread_id):
    if thread_id not in st.session_state["chat_thread"]:
        # newest chat on top
        st.session_state["chat_thread"].insert(0, thread_id)


def reset_chat():
    thread_id = genrate_id()
    st.session_state["thread_id"] = thread_id
    add_thread(thread_id)

    if thread_id not in st.session_state["chat_histories"]:
        st.session_state["chat_histories"][thread_id] = []


def delete_thread(thread_id):
    # remove history
    if thread_id in st.session_state["chat_histories"]:
        del st.session_state["chat_histories"][thread_id]

    # remove from sidebar
    if thread_id in st.session_state["chat_thread"]:
        st.session_state["chat_thread"].remove(thread_id)

    # if current chat deleted → switch
    if st.session_state["thread_id"] == thread_id:
        if len(st.session_state["chat_thread"]) > 0:
            st.session_state["thread_id"] = st.session_state["chat_thread"][0]
        else:
            new_id = genrate_id()
            st.session_state["thread_id"] = new_id
            st.session_state["chat_thread"] = [new_id]
            st.session_state["chat_histories"][new_id] = []


# -----------------------
# Page UI
# -----------------------
st.set_page_config(
    page_title="AI Chat Assistant",
    page_icon="🤖",
    layout="centered"
)

st.title("🤖 AI Chat Assistant")
st.caption("Powered by LangGraph + Streamlit")


# -----------------------
# Session State Init
# -----------------------
if "chat_histories" not in st.session_state:
    st.session_state["chat_histories"] = {}

if "thread_id" not in st.session_state:
    st.session_state["thread_id"] = genrate_id()

if "chat_thread" not in st.session_state:
    st.session_state["chat_thread"] = []

# ensure history exists
if st.session_state["thread_id"] not in st.session_state["chat_histories"]:
    st.session_state["chat_histories"][st.session_state["thread_id"]] = []

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
        col1, col2 = st.columns([4,1])

        # open chat
        if col1.button(tid[:8], key=f"open_{tid}"):
            st.session_state["thread_id"] = tid
            st.rerun()

        # delete chat
        if col2.button("🗑", key=f"del_{tid}"):
            delete_thread(tid)
            st.rerun()


# -----------------------
# Show chat history
# -----------------------
current_history = st.session_state["chat_histories"][st.session_state["thread_id"]]

for message in current_history:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


# -----------------------
# Chat Input
# -----------------------
user_input = st.chat_input("Type your message here...")

if user_input:
    # save user message
    current_history.append({"role": "user", "content": user_input})

    # move active chat to top (recent first)
    if st.session_state["thread_id"] in st.session_state["chat_thread"]:
        st.session_state["chat_thread"].remove(st.session_state["thread_id"])
        st.session_state["chat_thread"].insert(0, st.session_state["thread_id"])

    with st.chat_message("user"):
        st.markdown(user_input)

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
                token = message_chunk.content
                ai_reply_parts.append(token)
                yield token

        with st.spinner("Thinking... 🤔"):
            st.write_stream(stream_response)

    ai_reply = "".join(ai_reply_parts)

    # save assistant message
    current_history.append({"role": "assistant", "content": ai_reply})

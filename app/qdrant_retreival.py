from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from fastembed import TextEmbedding
from openai import OpenAI
from dotenv import load_dotenv
import os




def _load_config() -> tuple[str, str, str, str]:
    load_dotenv()

    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    qdrant_url = os.getenv("QDRANT_URL")
    openrouter_api_key = os.getenv("OPEN_ROUTER_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not qdrant_url:
        raise ValueError("QDRANT_URL is missing")
    if not qdrant_api_key:
        raise ValueError("QDRANT_API_KEY is missing")
    if not openrouter_api_key:
        raise ValueError("OPEN_ROUTER_KEY is missing")
    if not gemini_api_key:
        raise ValueError("Gemini api key is missing..")
    return qdrant_url, qdrant_api_key, openrouter_api_key, gemini_api_key





def main(query :str) -> None:
    model = TextEmbedding('BAAI/bge-small-en-v1.5')
    qdrant_url, qdrant_api_key, openrouter_api_key, gemini_api_key = _load_config()
    
    # query = input("ask something - > ")
    query_vector = next(iter(model.embed(query)))
    
    client = QdrantClient(
        url=qdrant_url,
        api_key=qdrant_api_key,
    )
    openai_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_api_key,
    )
    
    results = client.query_points(
        collection_name="items",
        query=query_vector,
        with_payload=True,
    )
    
    text = ""
    for point in results.points:
        text += str(point.payload)
    
    SYSTEM_PROMPT = """
        you are AI assistant you task is to give the user query answer if it is related to the any academic courses
    """
    response = openai_client.chat.completions.create(
        model="openrouter/free",
        messages=[
            {
                "role":"system", 
                "content": SYSTEM_PROMPT 
            },
            {
                "role":"user",
                "content":text + "write in structure manner"
            }
        ]
    )

    return response.choices[0].message.content

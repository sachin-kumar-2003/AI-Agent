# import os
# from qdrant_client import QdrantClient
# from qdrant_client.models import Distance, VectorParams
# from qdrant_client.models import PointStruct
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# # from fastembed import TextEmbedding
# from dotenv import load_dotenv
# from .uploading import data
# import json
# import uuid

# load_dotenv()

# qdrant_url = os.getenv("QDRANT_URL")
# qdrant_api_key = os.getenv("QDRANT_API_KEY")

# client = QdrantClient(
#     url=qdrant_url,
#     api_key=qdrant_api_key,
# )
# def client_qdrant():
#     return client

# client.create_collection(
#     collection_name="items",
#     vectors_config=VectorParams(size=384, distance=Distance.COSINE),
# )

# # model = TextEmbedding('BAAI/bge-small-en-v1.5')
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=0)
# parsed_data = json.loads(data)
# courses = parsed_data["MBA_Courses"]
# texts = [
#     f"University: {c['university']}. "
#     f"Course: {c['course_name']}. "
#     f"Category: {c['category']}. "
#     f"Duration: {c['duration']}. "
#     f"Average Salary: {c['avg_salary']}. "
#     f"Description: {c['description']}. "
#     f"Program URL: {c['program_url']}."
#     for c in courses
# ]
# # embeddings = model.embed(texts)

# points = []
# # for course, embedding in zip(courses, embeddings):
# #     point = PointStruct(
# #         id=str(uuid.uuid4()),
# #         vector=embedding.tolist(),
# #         payload={
# #             "university": course["university"],
# #             "course_name": course["course_name"],
# #             "category": course["category"],
# #             "duration": course["duration"],
# #             "avg_salary": course["avg_salary"],
# #             "description": course["description"],
# #             "program_url": course["program_url"],
# #             "text": f"{course['course_name']} at {course['university']} specializing in {course['category']}."
# #         }
# #     )
# #     points.append(point)
# # client.upsert(
# #   collection_name="items",
# #   points=points,
# # )
# print("inject succesfull..")
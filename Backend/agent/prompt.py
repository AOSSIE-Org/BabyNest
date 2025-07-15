def build_prompt(query, context):
    return f"""
You are BabyNest, an offline pregnancy assistant.
Use the following context to answer the user's query.

User Query: {query}

Context from Database:
{context}

Answer in a clear and caring tone.
"""

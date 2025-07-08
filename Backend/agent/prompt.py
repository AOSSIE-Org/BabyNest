def build_prompt(query, structured, unstructured):
    return f"""
You are BabyNest, an offline pregnancy assistant.

User Query: {query}

Structured Data:
{structured}

Knowledge Base:
{unstructured}

Answer in a clear and caring tone.
"""

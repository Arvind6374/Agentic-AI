
# Agentic AI – Day 8 (Part 2)  
Building RAG Pipelines Using LlamaIndex (LLM + Embeddings + Reranking)  
In Part 2 of Day 8, you learned how to create a complete Retrieval-Augmented Generation (RAG) pipeline using **LlamaIndex**, **Gemini**, **HuggingFace embeddings**, and **sentence-transformer reranking**.

---

## 🚀 Day 8 (Part 2) Overview

### ✔ What You Learned Today
- Configure **global LLM + embedding models** in LlamaIndex  
- Use Gemini as the LLM for query answering  
- Use HuggingFace embeddings for vector indexing (free + local)  
- Load web pages and convert HTML → clean text  
- Build a **VectorStoreIndex**  
- Query the index using semantic search  
- Improve retrieval accuracy using **Cross-Encoder reranking**  
- Build advanced RAG query engines with pre + post-processing steps  

---

## 📦 Installing Required Packages
```bash
!pip install -q \
  "llama-index>=0.11.0" \
  llama-index-llms-gemini \
  llama-index-embeddings-huggingface \
  llama-index-readers-web \
  sentence-transformers
````

---

## 🔧 1. Configure LlamaIndex Global Settings

### 🧠 LLM → Gemini (for answering)

```python
from llama_index.llms.gemini import Gemini

Settings.llm = Gemini(
    model="gemini-2.5-flash-lite",
    api_key=GEMINI_API_KEY,
)
Settings.llm.temperature = 0.1
```

### 🔡 Embeddings → HuggingFace BGE Small

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

Settings.embed_model = HuggingFaceEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)
```

### ✔ Why this setup?

* Gemini handles **reasoning + generation**
* HuggingFace handles **embeddings locally** → free, fast, great performance

---

## 🌐 2. Load Web Documents for RAG

```python
from llama_index.readers.web import SimpleWebPageReader

urls = ["https://developers.llamaindex.ai/python/framework/understanding/rag/"]

reader = SimpleWebPageReader(html_to_text=True)
documents = reader.load_data(urls)
```

This fetches a webpage and extracts clean text for indexing.

---

## 🗂️ 3. Build a Vector Index

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(documents)
```

* Chunks are generated automatically
* Embeddings computed using HuggingFace model
* Stored inside an in-memory vector index

---

## 🔍 4. Basic RAG Query Engine

```python
query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query("Explain the high-level RAG pipeline.")
print(response)
```

The engine performs:

1. Embedding the question
2. Retrieving top-k similar chunks
3. Sending retrieved context + query to Gemini
4. Generating a grounded response

---

## 🎯 5. Reranking with Cross-Encoder (To Improve Accuracy)

### Why reranking?

* Embedding similarity is fast but not always accurate
* Cross-Encoders use deeper semantic matching → better ranking

### Example:

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L2-v2")
scores = model.predict([...])
```

### LlamaIndex Reranker

```python
from llama_index.core.postprocessor import SentenceTransformerRerank

reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-2-v2",
    top_n=3,
)
```

---

## 🔎 6. Rerank-Enabled Query Engine

```python
rerank_query_engine = index.as_query_engine(
    similarity_top_k=10,            # get more candidates first
    node_postprocessors=[reranker]   # rerank & keep best 3
)

response = rerank_query_engine.query(
    "How does LlamaIndex split RAG into stages?"
)
print(response)
```

### ✔ Benefits:

* More accurate retrieval
* Cleaner and more relevant answers
* Production-level RAG pipeline

---

## 🧠 Concepts Learned in Part 2

### ✔ Global Model Configuration

Setting global defaults for the entire LlamaIndex pipeline.

### ✔ Hybrid Model Setup

Gemini (LLM) + HuggingFace (embeddings) = high performance + low cost.

### ✔ Web Data Ingestion

Loading online docs for real-world RAG systems.

### ✔ Vector Indexing

Building searchable embeddings-based indexes.

### ✔ Basic Query Engine

Simple similarity search answering pipeline.

### ✔ Reranking

Cross-Encoder–based reranking dramatically improves accuracy.

---

## 🧰 Tools Used Today

* LlamaIndex core
* LlamaIndex–Gemini LLM wrapper
* HuggingFace embedding models
* SimpleWebPageReader
* VectorStoreIndex
* SentenceTransformer Cross-Encoder reranker

---

## ⭐ Day 8 – Part 2 Summary

By the end of Part 2, you built a **full RAG pipeline** with:

* Web document ingestion
* Embedding generation
* Vector index creation
* Basic query engine
* Advanced reranked query engine

This completes the foundation for building **LlamaIndex-powered enterprise RAG systems**.

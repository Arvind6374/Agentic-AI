
## 📥 1. Document Ingestion (PDF → Chunks)

### Workflow:

1. Load PDFs using `PyPDFLoader`
2. Split documents using `RecursiveCharacterTextSplitter`
3. Configure chunk size + overlap for better semantic retention
4. Store chunks in a list ready for embedding

### Why?

Chunks allow the RAG system to retrieve **only the relevant part** of a large document.

---

## 🧠 2. Embeddings + Vector Store (ChromaDB)

### Steps:

* Use Gemini (`text-embedding-004`) to generate embeddings
* Store embeddings + text + metadata in a persistent ChromaDB directory
* Perform top-K semantic retrieval for any user query

### Outcome:

You now understand how to build a **persisted vector database** backing a RAG system.

---

## 🗄️ 3. SQL Database + SQL Agent

### SQL DB Created:

* Customers table
* Orders table
* Sample rows inserted manually

### SQL Agent Pipeline:

1. LangChain `SQLDatabaseToolkit` exposes DB tools
2. Gemini generates SQL queries from natural language
3. Agent executes SQL safely
4. Final result returned in natural English

### Example Query:

```
"Give me the names of customers from Canada."
```

---

## 🔁 4. RAG Agent (Document Retrieval)

A RAG pipeline was created that:

* Accepts a question
* Retrieves the most relevant chunks from ChromaDB
* Feeds the context + question to Gemini
* Returns an answer grounded in the retrieved PDF text

This is the foundation of real-world RAG applications (chatbots, assistants, enterprise search, etc.).

---

## 🧩 5. Hybrid Agent Architecture

By combining:

* SQL Agent → structured data
* RAG Agent → unstructured documents

You learned how to build agents capable of answering:

* Data queries (SQL)
* Document-based questions (RAG)
* Multi-source reasoning

This hybrid approach is used in enterprise copilots and business intelligence systems.

---

## 🧰 Key Components You Implemented

* `load_documents()` → PDF loader
* `split_documents()` → text splitter with overlap
* `GoogleGenerativeAIEmbeddings()` → Gemini embeddings
* `Chroma.from_documents()` → vector DB creation
* SQLite mock database construction
* `create_sql_agent()` to run NL → SQL pipelines
* RAG retriever + LLM answerer

---

## 🧠 Concepts Learned

* Importance of **chunk overlap** for better retrieval
* Storing embeddings persists semantic memory
* SQL agents need read-only access in production
* RAG is ideal for unstructured data (PDFs, text)
* SQL agents are ideal for structured data (tables, numbers)
* Hybrid architectures combine both strengths

---

## 🧰 Tools & Libraries Used

* LangChain Core
* LangChain Community (PDF loader, SQL toolkit)
* LangChain Google GenAI
* Gemini Embeddings + Gemini Flash
* ChromaDB Vector Store
* SQLite Database

---

## ⭐ Day 7 Summary

By the end of Day 7, you built:

* A working RAG system
* A working SQL agent
* A hybrid assistant that can retrieve documents AND query databases

This completes a major milestone in Agentic AI development — enabling agents to reason across multiple data sources just like production AI systems.

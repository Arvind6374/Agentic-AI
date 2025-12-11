

# Agentic AI – Day 8 (Part 1)  
Introduction to LlamaIndex: Documents, Nodes, and Data Loading  
Today’s session introduces the fundamentals of **LlamaIndex**, focusing on how documents are represented, how they are chunked into nodes, and how to load data from multiple sources (text files, directories, PDFs, and web pages).

---

## 🚀 Day 8 (Part 1) Overview

### ✔ What You Learned Today
- What a **Document** is in LlamaIndex  
- How LlamaIndex converts documents into **Nodes** (chunks)  
- Why chunking improves retrieval accuracy  
- How to load data from:
  - Raw text
  - Local directories
  - PDF files
  - Web pages  
- How LlamaIndex helps build RAG-ready data pipelines

---

## 📦 Installing Required Packages
```bash
!pip install llama-index
!pip install llama-index-readers-web
````

---

## 📄 1. Creating Documents

In LlamaIndex, a **Document** is raw unstructured data such as:

* Text
* PDFs
* HTML
* Web content

You created documents like this:

```python
from llama_index.core import Document

text1 = """
Python is a popular programming language used for AI, ML, and Data Science.
"""

text2 = """
JavaScript is mainly used for web development.
"""

doc1 = Document(text=text1)
doc2 = Document(text=text2)

docs = [doc1, doc2]
```

### ✔ Key Takeaway

A **Document** is the basic data unit — but too large to be directly used for retrieval.

---

## 🧱 2. Nodes — Chunked Versions of Documents

### 📌 What is a Node?

A **Node** is a smaller semantic chunk of a document.

### 📌 Why Nodes?

* Better retrieval accuracy
* Smaller embeddings
* Faster performance

You created nodes with:

```python
from llama_index.core.node_parser import SimpleNodeParser

parser = SimpleNodeParser()
nodes = parser.get_nodes_from_documents(docs)
```

### Example:

```python
nodes[1].text
```

---

## 📂 3. Loading Documents from a Directory

With `SimpleDirectoryReader`, you loaded all text files from a folder:

```python
from llama_index.core import SimpleDirectoryReader

loader = SimpleDirectoryReader("./Data")
documents = loader.load_data()
```

You also inspected file names and previewed content:

```python
for doc in documents:
    print(doc.metadata["file_name"])
    print(doc.text[:50])
```

---

## 📕 4. Loading PDF Files

LlamaIndex supports PDF ingestion using `PDFReader`:

```python
from llama_index.readers.file import PDFReader

pdf_docs = PDFReader().load_data("oci-faq.pdf")
```

This extracts text page-by-page and organizes it into documents.

---

## 🌐 5. Loading Web Pages

You installed web readers and loaded web content:

```bash
!pip install llama-index-readers-web
```

```python
from llama_index.readers.web import SimpleWebPageReader

web_docs = SimpleWebPageReader().load_data(
    ["https://www.llama.com/docs/model-cards-and-prompt-formats/llama4/"]
)
```

### ✔ Why this is useful

* Allows building RAG systems from live web sources
* Works with HTML-based content
* Useful for news extraction, documentation search, etc.

---

## 🧠 Concepts Learned Today

### ✔ LlamaIndex Core Concepts

* **Document** = raw input
* **Node** = chunk of document
* **Parsing** = splitting document into nodes
* **Readers** = load data from various sources

### ✔ Data Sources Covered

* Local text
* PDF files
* Directories
* Web pages

These are essential building blocks for building **RAG pipelines** in future sessions.

---

## 🧰 Tools Used Today

* LlamaIndex Core
* SimpleNodeParser
* SimpleDirectoryReader
* PDFReader
* SimpleWebPageReader

---

## ⭐ Day 8 – Part 1 Summary

By the end of Part 1, you learned:

* How LlamaIndex represents and processes data
* How to convert documents into structured chunks
* How to load data from multiple file types
* The foundational steps before building a full RAG system

Part 2 will cover embeddings, indexes, retrievers, query engines, and building an end-to-end RAG agent using LlamaIndex.


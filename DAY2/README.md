# Agentic AI – Day 2

A continuation into understanding the LLM ecosystem, choosing the right model, handling PII safely, and learning prompt engineering.
This module focuses on LLM types, privacy concerns, cost/latency, batch vs real-time processing, and hands-on work with tools like HuggingFace and Ollama.

---

## 🚀 Day 2 Overview

### ✔ Types of LLMs

#### 🔒 Closed-Source Models (API-Based)

Examples: GPT-4, Gemini

* Highly powerful
* Require API keys
* Per-token cost
* Data privacy concerns

#### 🟩 Open-Source Models (Local)

Examples: Llama 3, Mistral, Gamma

* Free to run locally
* Full data control
* Ideal for sensitive data
* Need sufficient CPU/GPU hardware

---

## 🔐 Understanding PII (Personal Identifiable Information)

PII includes any information that identifies a person.
Examples:

* Aadhaar number
* Biometrics
* Phone number
* Email / address
* Medical data

➡ When PII is present → **use local models** or **redact PII before sending to APIs**.

---

## 🕒 Batch vs Real-Time Processing

### 📦 Batch Processing

* Works on historical data
* Not time-critical
* Example: Summarizing yesterday’s 10,000 news articles

### ⚡ Real-Time Processing

* Instant responses required
* Example: Travel chatbot
* Best handled using fast API models (Gemini / GPT)

---

## 💸 Cost & Latency

* Closed-source models → token-based pricing
* Open-source models → free, hardware dependent
* Larger models → slower + require more memory

---

## ✍️ Prompt Engineering (ROLES Method)

A structured method for creating effective prompts:

* **R – Role:** Define AI’s behavior
* **O – Objective:** Task to be performed
* **L – Limitations:** Rules, constraints, word limits
* **E – Examples:** Few-shot examples to guide behavior
* **S – Style:** Output format (Markdown, JSON, table, etc.)

---

## 🧠 Advanced Prompt Techniques

### 🧩 Chain of Thought

Ask the model to **think step-by-step** for better reasoning.

### 🔁 Self-Consistency

Model generates multiple reasoning paths → best one selected.

---

## 🛠 Hands-On Setup

### 🤖 Running Local Models with Ollama

1. Install Ollama: [https://ollama.com](https://ollama.com)
2. Run a model:

   ```bash
   ollama run llama3 "hi"
   ```

Recommended lightweight models:

* Gamma 3 (1B)
* Llama 3 small variants

---

### 📘 Exploring HuggingFace

Reviewed:

* Model configs
* Tokenizer information
* Sample usage code
* Model sizes and capabilities

---

## 🎯 Use-Case Scenarios Discussed

* **Legal Contracts (Sensitive Data)** → Use local open-source models
* **Travel Chatbot (Public Use)** → Use Gemini / GPT APIs
* **Batch News Summaries (Large Volume)** → Use lightweight open-source models

---

## 🧰 Tools Used Today

* PyCharm
* Google Colab
* HuggingFace
* Ollama

---

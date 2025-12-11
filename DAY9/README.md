
# Agentic AI – Day 9 (Part 1)  
Building Multi-Agent Email Writing Systems with CrewAI  
Today’s session focused on using **CrewAI** to create multi-agent workflows, where multiple AI agents collaborate to write, improve, and polish professional emails and documents.

---

## 🚀 Day 9 (Part 1) Overview

### ✔ What You Learned Today
- What **CrewAI** is and how it enables multi-agent collaboration  
- How to configure Gemini as the LLM backend for CrewAI  
- How to create different agents with unique roles, goals, and backstories  
- Running tasks sequentially across multiple agents  
- Building email workflows:
  - 2-agent email writer + reviewer  
  - Sequential writer → reviewer pipeline  
  - 3-agent draft improver → editor → proofreader pipeline  

---

## 📦 Installing Required Packages
```bash
!pip install crewai google-generativeai
````

---

## 🔑 1. Gemini API Configuration

CrewAI uses your Gemini model as the LLM:

```python
llm = LLM(
    model="gemini-2.5-flash",
    temperature=0.1,
    api_key=GEMINI_API_KEY
)
```

This LLM powers every agent you create.

---

## 👥 2. Project 1 — Multi-Agent Email Writer

### Agents Created

#### 📝 Agent 1 — Professional Email Writer

* Writes polished emails
* Corporate communication specialist
* Outputs clear, structured messages

#### 🧐 Agent 2 — Email Reviewer

* Reviews for tone, clarity, and corrections
* Acts like a senior editor

### Task

```python
"Write a formal email requesting 2 days of sick leave."
```

### Execution

Crew runs the task **sequentially**:

1. Writer drafts the email
2. Reviewer improves it

The final output is the polished email.

---

## 🔁 3. Two-Task Sequential Workflow

### Task 1 → Writer

Produce a complete formal sick-leave email.

### Task 2 → Reviewer

Refine the email:

* Fix grammar
* Improve tone
* Make it concise and professional

CrewAI automatically passes the output of Task 1 into Task 2.

---

## 🧩 4. Three-Agent Email and Document Review Pipeline

This workflow simulates a real editorial process:

### 👤 Agent 1 — Draft Improver

* Takes a rough, messy text
* Converts it into a clear draft
* Adds structure and missing context

### 📝 Agent 2 — Editor

* Improves readability
* Enhances tone and clarity
* Makes it professionally formatted

### 🔍 Agent 3 — Proofreader

* Fixes grammar
* Removes spelling/punctuation errors
* Produces final polished version

### Example Raw Input

```
hi boss, i wont be able to come office tomorrow i have some personal issue.
pls approve my leave. thanks
```

The 3-agent pipeline transforms it into a fully polished business email.

---

## 🚦 CrewAI Execution Flow

### Process: `Process.sequential`

Meaning:

1. Agents run in a fixed order
2. Output automatically flows from one agent to the next
3. Final result is the polished version from the last agent

### Crew Setup:

```python
email_crew = Crew(
    agents=[draft_improver, editor, proofreader],
    tasks=[task_improve_draft, task_edit, task_proofread],
    process=Process.sequential
)
```

---

## 🧠 Concepts Learned Today

* **Agent roles** improve specialization
* **Backstories** shape agent behavior and tone
* **Tasks** define work units passed between agents
* **Sequential processes** create deterministic pipelines
* **CrewAI** enables complex automation with multiple LLMs acting together

---

## 🧰 Tools Used Today

* CrewAI
* Gemini 2.5 Flash (LLM)
* Multi-agent orchestration
* Email writing, editing, and proofreading agents

---

## ⭐ Day 9 – Part 1 Summary

By the end of Part 1, you built:

* A 2-agent email writer system
* A 2-task sequential review workflow
* A 3-agent editorial pipeline producing professional-grade output

This session introduced multi-agent collaboration — the foundation for building complex automated AI workflows in the next parts.


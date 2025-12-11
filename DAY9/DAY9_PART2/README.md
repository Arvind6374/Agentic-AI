
# Agentic AI – Day 9 (Part 2)  
Building a Multi-Agent Content Strategy & Calendar Generator using CrewAI  

Today you created a **3-agent CrewAI system** that automatically generates a complete **content strategy**, including pillars, SEO-optimized titles, hooks, and a full publishing calendar across multiple platforms.

This builds on the concepts from Part 1—now applying agent collaboration to real content operations.

---

## 🚀 Day 9 (Part 2) Overview

### ✔ What You Learned Today
- How to build multi-agent workflows for **content creation and marketing**
- How to use **CrewAI tools extension**
- Designing **topic researcher**, **SEO strategist**, and **content calendar planner** agents
- Generating:
  - Content pillars  
  - Subtopics  
  - SEO-friendly titles, hooks, keywords  
  - Day-wise publishing schedule  
- Building a fully automated **Content Planning System**

---

## 📦 Installing Required Packages

```bash
!pip install crewai google-generativeai "crewai[tools]"
````

---

## 🔑 Gemini API Setup

```python
llm = LLM(
    model="gemini-2.5-flash",
    temperature=0.1,
    api_key=GEMINI_API_KEY
)
```

Gemini is used for all 3 agents.

---

## 🧱 System Architecture

### 🧠 Inputs:

* **Main Topic** (e.g., "GenAI in education")
* **Duration** (e.g., 30 days)
* **Platforms** (e.g., Blog, YouTube, LinkedIn)

### 📤 Outputs:

* Content pillars
* Subtopics
* SEO titles + hooks + keyword ideas
* Full content calendar

---

## 👥 Agents You Built

### 1️⃣ **Topic Researcher Agent**

Role: Breaks the main topic into clear content pillars.

Goal:

* Identify 4–8 pillars
* Add 3–5 subtopics per pillar

---

### 2️⃣ **SEO & Hook Strategist Agent**

Role: Adds SEO power to every subtopic.

Outputs per subtopic:

* 1–2 SEO-friendly titles
* 1 catchy hook
* 2–3 keyword suggestions

---

### 3️⃣ **Content Planner Agent**

Role: Converts everything into a publishing plan.

Responsibilities:

* Assign content to days
* Choose platforms
* Suggest format (video, carousel, blog, short, etc.)
* Produce the final **content calendar**

---

## 🧩 Task Pipeline (Sequential)

### 🔹 Task 1 → Research Pillars

Uses Topic Researcher
Produces subtopics for all pillars

---

### 🔹 Task 2 → SEO Improvements

Uses SEO Strategist
Adds titles, hooks, keywords

---

### 🔹 Task 3 → Build Calendar

Uses Content Planner
Creates the day-by-day publishing schedule

---

## 🏗️ Crew Setup

```python
crew = Crew(
    agents=[topic_researcher, seo_strategist, content_planner],
    tasks=tasks,
    process=Process.sequential,
    verbose=True,
)
```

**Sequential mode** ensures the output of one task becomes input to the next.

---

## ▶️ Example Execution

```python
plan = generate_content_plan(
    main_topic="Generative AI for software developers",
    days=14,
    platforms=["YouTube", Blog", "X (Twitter)"]
)
```

### ✔ Output Includes:

* Content pillars
* Subtopics
* SEO titles & hooks
* 14-day content calendar
* Platform mapping
* Short descriptions

The final result is a fully automated content strategy, ready for publishing.

---

## 🧠 Concepts Strengthened Today

* CrewAI sequential workflows
* Multi-agent collaboration
* Content strategy automation
* SEO-aware text generation
* Calendar planning with AI
* How to design role-based agents

---

## ⭐ Day 9 – Part 2 Summary

By the end of today's session, you built a **Content Strategy AI Crew** that:

### ✔ Understands a topic

### ✔ Generates content pillars

### ✔ Creates SEO-optimized titles

### ✔ Designs hooks + keywords

### ✔ Builds a complete publishing calendar

This is a practical real-world AI system used by:

* Creators
* Marketing teams
* Agencies
* Influencers

Day 9 part 2 showcases how **Agentic AI + CrewAI** can automate large workflows end-to-end.


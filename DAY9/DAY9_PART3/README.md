
# Agentic AI – Day 9 (Part 3)  
Resume–Job Description Matching System using CrewAI + Gemini

Today’s session extends multi-agent workflows into **career automation**, where AI agents collaborate to analyze resumes, read job descriptions, compute match scores, generate resume improvements, and create tailored cover letters.

This is a full **ATS-style screening + resume optimization pipeline**, completely automated using CrewAI.

---

## 🚀 What We Built Today

A 5-agent pipeline that processes:

### **Inputs**
- Candidate resume  
- Job description  
- Job title  
- Company name  

### **Outputs**
- Structured resume summary  
- Structured JD summary  
- Candidate–job match score  
- Skill overlaps + skill gaps  
- Resume improvements aligned to JD  
- Customized cover letter  

This system can be used by:
- Job seekers  
- HR teams  
- ATS systems  
- Career platforms  
- Hiring workflows  

---

## 📦 Installing Dependencies

```bash
!pip install "crewai[tools]" google-generativeai
````

---

## 🔑 Gemini LLM Setup

```python
gemini_llm = LLM(
    model="gemini-2.5-flash",
    temperature=0.1,
    api_key=GEMINI_API_KEY
)
```

All 5 agents use a shared Gemini model.

---

# 👥 The Five Agents You Built

---

## 1️⃣ Resume Extraction Agent

**Goal:** Convert an unstructured resume into a clean structured profile.

Extracts:

* Candidate summary
* Technical skills
* Soft skills
* Tools & technologies
* Experience summary
* Domains worked in

Produces ATS-friendly structured markdown.

---

## 2️⃣ Job Description (JD) Extraction Agent

**Goal:** Convert JD into structured hiring criteria.

Extracts:

* Role summary
* Required skills
* Nice-to-have skills
* Experience requirements
* Responsibilities

Enables downstream comparison.

---

## 3️⃣ Matching Agent

**Goal:** Perform resume–JD comparison and provide:

* Match percentage (0–100)
* Strong matches
* Partial matches
* Missing skills / gaps
* Recommendations for improving match

This is essentially a basic **AI-powered ATS scoring engine**.

---

## 4️⃣ Resume Improvement Agent

**Goal:** Rewrite the resume specifically for the chosen job.

Produces:

* Tailored professional summary
* 5–10 improved bullet points aligned to JD
* Highlights strengths with role-specific focus

A fully optimized resume draft for the given job.

---

## 5️⃣ Cover Letter Agent

**Goal:** Write a tailored cover letter using:

* Resume summary
* JD requirements
* Matching analysis
* Improved resume bullets

Outputs a professional 3–6 paragraph cover letter.

---

# 🧩 Task Flow (Sequential Crew)

Your pipeline runs in this exact order:

1. Resume extraction
2. JD extraction
3. Resume–JD matching
4. JD-aligned resume improvement
5. Final tailored cover letter

Each step feeds its output into the next using CrewAI's **sequential process**.

---

## 🏗️ Building Tasks

### Example extract task formats:

* Resume → structured markdown
* JD → structured markdown
* Matching → structured ATS-style report
* Resume improvements → summary + bullets
* Cover letter → full polished letter

Each task enforces a strictly defined output format.

---

## 🛠️ Creating the Crew

```python
crew = Crew(
    agents=[
        resume_extractor,
        jd_extractor,
        matcher_agent,
        resume_improver,
        cover_letter_writer,
    ],
    tasks=tasks,
    process=Process.sequential,
    verbose=True,
)
```

Sequential ensures outputs flow step-by-step from one agent to the next.

---

## ▶️ Running the Full Pipeline

```python
final_cover_letter = run_resume_jd_matching(
    resume_text=sample_resume,
    jd_text=sample_jd,
    job_title="Backend Software Engineer",
    company_name="Acme Tech"
)
```

### ✔ Output Includes:

* Candidate structured summary
* JD structured summary
* Compatibility analysis
* Matched + missing skills
* Tailored resume bullets
* Professionally written cover letter

---

# ⭐ Day 9 – Part 3 Summary

By the end of today's session, you created a full **AI-driven hiring pipeline**:

### ✔ Structured resume extraction

### ✔ JD extraction

### ✔ Resume–JD match scoring

### ✔ Resume rewriting + optimization

### ✔ Tailored cover letter generation

This is a **real-world AI product** used in:

* Recruitment platforms
* ATS systems
* Career tools
* HR automation workflows

You now have a complete multi-agent system automating one of the most valuable workflows in job applications.

---

## 💡 Next Steps (Optional)

* Export resume bullets into a ready-to-download PDF
* Add salary prediction agent
* Add LinkedIn profile optimization agent
* Add skill gap learning recommendations


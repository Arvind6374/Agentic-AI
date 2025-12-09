
# Agentic AI – Day 6
Building Tool-Enabled Agents using LangChain and Gemini.  
This module covers how to create weather agents, currency-exchange agents, multi-tool agents, LCEL chains, and chat memory systems using LangChain + Gemini 2.5 Flash Lite.

---

## 🚀 Day 6 Overview

### ✔ What You Learned Today
Day 6 focused on **LangChain Agents**, **Tool Integration**, and **LCEL (LangChain Expression Language)**.  
You built:

- Weather tool  
- Currency exchange tool  
- Single-tool agent  
- Multi-tool agent  
- Master agent (automatic tool routing)  
- LCEL pipeline with prompt → model → parser  
- Memory-enabled conversational chain  

---

## ⚙️ Installing Required Packages
```python
!pip install -U "langchain>=0.3.12" "langchain-core>=0.3.30" "langchain-google-genai>=2.0.0"
````

Installed:

* `langchain`
* `langchain-core`
* `langchain-google-genai`
* Gemini APIs
* Tooling support

---

## 🌦️ 1. Weather Tool (with @tool decorator)

You built a fully functional API-powered tool:

* Takes a city name
* Calls Open-Meteo geocoding API
* Fetches current weather
* Returns a formatted result

### Example Output

```
City: Tokyo, Lat: 35.6, Lon: 139.6, Current Weather: {...}
```

---

## 💱 2. Currency Exchange Tool

A second tool that:

* Accepts queries like: `"USD to INR"`
* Calls exchange-rate API
* Returns formatted output

### Example Output

```
1 USD = 83.2 INR
```

---

## 🤖 3. Single-Tool Agent (Weather ONLY)

You used:

```python
agent = create_agent(model=model, tools=[get_weather])
```

The agent:

* Detects if the user is asking for weather
* Automatically calls the weather tool
* Returns Gemini-generated natural language answer

### Example

```
"What is the weather in Tokyo?"
```

---

## 💱🤖 4. Single-Tool Agent (Currency ONLY)

You created a second agent:

```python
agent = create_agent(model=model, tools=[currency_exchange])
```

It handles any currency conversion request automatically.

---

## 🛠️ 5. Multi-Tool Agent

You combined both tools:

```python
agent = create_agent(model=model, tools=[get_weather, currency_exchange])
```

Now the agent can:

* Answer weather queries
* Answer currency conversion
* Make decisions on which tool to call

### Example

```
If 100 USD is converted to INR, how much will I get?
```

---

## 🧠 6. LCEL (LangChain Expression Language)

You learned how to build chains using:

* `ChatPromptTemplate`
* `ChatGoogleGenerativeAI`
* `StrOutputParser`

### Example LCEL Pipeline

```python
chain = prompt | model | parser
result = chain.invoke({"input": "What is LCEL?"})
```

This returns a clean string (no system metadata).

---

## 🗂️ 7. Adding Memory (RunnableWithMessageHistory)

You created a memory-enabled chain that:

* Stores past messages
* Remembers previous conversation context
* Works with multiple sessions using `session_id`

### Example:

```
Explain how photosynthesis works.
Summarize your previous explanation.
```

Memory ensures the second answer references the first.

---

## 🧭 8. Master Agent (Intent Router)

This agent decides *which tool* to call by analyzing the user query.

### Tool Routing Logic

* Weather questions → `weather.lookup`
* Currency questions → `fx.convert`
* Otherwise → no tool

It uses:

1. Intent detection
2. JSON-based tool routing
3. Tool execution
4. Final response generation

### Example

```
"What is the weather like in New Delhi?"
```

---

## 🔥 Concepts Learned Today

* `@tool` decorator to convert Python functions into LangChain tools
* Tool-enabled agents with `create_agent()`
* Building **single-tool** vs **multi-tool agents**
* Building an **intent-routing master agent**
* LCEL pipes (`prompt | model | parser`)
* Adding **chat memory** using RunnableWithMessageHistory
* How Gemini automatically calls external tools
* Making clean prompt-driven agents

---

## 🧰 Tools Used Today

* LangChain Core
* LangChain Agents
* Gemini 2.0 / 2.5 Flash Lite
* Tool decorators
* RunnableWithMessageHistory
* Open-Meteo API
* Currency Exchange API

```


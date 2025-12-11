!pip install -U "langchain>=0.3.12" \
               "langchain-core>=0.3.30" \
               "langchain-community>=0.3.12" \
               "langchain-google-genai>=2.0.0" \
               "pypdf" \
               "langchain-text-splitters" \
               "chromadb"

# Get API keys from environment variables
from google.colab import userdata
import google.generativeai as genai
GEMINI_API_KEY = userdata.get("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found. Gemini model will not run.")


## Loading PDF
from langchain_community.document_loaders import PyPDFLoader

def load_documents(pdf_paths: list):
    """Loads PDFs and returns LangChain Document objects."""
    docs = []
    for path in pdf_paths:
        loader = PyPDFLoader(path)
        docs.extend(loader.load())
    return docs

# Example usage:
#pdf_files = ["/content/Data_Analysis_FAQ_20_QA.pdf"]  # upload PDF in Colab first
pdf_files = ["/content/oci-faq.pdf"]
documents = load_documents(pdf_files)
print(f"Loaded documents: {len(documents)} pages")
print(documents)

# Split into chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_documents(documents, chunk_size=1000, chunk_overlap=150):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_documents(documents)

# Example:
splits = split_documents(documents)
print(f"Created chunks: {len(splits)}")

# Load Embedding model
from langchain_google_genai import GoogleGenerativeAIEmbeddings
def get_gemini_embeddings(model="models/text-embedding-004"):
    return GoogleGenerativeAIEmbeddings(model=model,api_key=GEMINI_API_KEY)

embeddings = get_gemini_embeddings()

## Vector Storage using Chroma DB
from langchain_community.vectorstores import Chroma

def create_vector_db(chunks, embeddings, db_path="./chroma_db"):
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=db_path
    )
    vectordb.persist()
    return vectordb

vectordb = create_vector_db(splits, embeddings)
print("ChromaDB Created & Persisted.")

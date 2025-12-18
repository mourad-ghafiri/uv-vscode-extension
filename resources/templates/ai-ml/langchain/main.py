"""
{{PROJECT_NAME}} - LangChain Application
"""
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


def create_chain():
    """Create a simple LangChain chain."""
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("user", "{input}"),
    ])
    
    chain = prompt | llm | StrOutputParser()
    return chain


def main():
    """Main entry point."""
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Please set OPENAI_API_KEY environment variable")
        print("export OPENAI_API_KEY='your-api-key'")
        return
    
    chain = create_chain()
    
    print("LangChain Chat (type 'quit' to exit)")
    print("-" * 40)
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ("quit", "exit", "q"):
            break
        
        if user_input:
            response = chain.invoke({"input": user_input})
            print(f"\nAssistant: {response}")


if __name__ == "__main__":
    main()

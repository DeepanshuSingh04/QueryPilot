import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { ChatGroq } from "@langchain/groq"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";
import { getWeather } from "./weather.service.js";
import { getNews } from "./news.service.js";
import { getStockPrice } from "./stocks.service.js";

const groqModel = new ChatGroq({
    model: "openai/gpt-oss-120b", // free tier: 30 req/min, 1,000 req/day, tool-calling supported
    apiKey: process.env.GROQ_API_KEY,
});

const mistralModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY
});

const searchInternetTool = tool(
    searchInternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest general information from the internet for anything not covered by the weather, news, or stock tools.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet.")
        })
    }
)

const getWeatherTool = tool(
    getWeather,
    {
        name: "getWeather",
        description: "Use this tool to get the current weather and today's forecast for a specific city.",
        schema: z.object({
            city: z.string().describe("The city name to get weather for, e.g. 'Delhi' or 'New York'.")
        })
    }
)

const getNewsTool = tool(
    getNews,
    {
        name: "getNews",
        description: "Use this tool to get the latest news headlines about a topic, company, or event.",
        schema: z.object({
            query: z.string().describe("The topic or keyword to search news for, e.g. 'India elections' or 'Tesla'.")
        })
    }
)

const getStockPriceTool = tool(
    getStockPrice,
    {
        name: "getStockPrice",
        description: "Use this tool to get the latest stock price and daily change for a given ticker symbol.",
        schema: z.object({
            symbol: z.string().describe("The stock ticker symbol, e.g. 'AAPL', 'TSLA', 'RELIANCE.BSE'.")
        })
    }
)

const allTools = [ searchInternetTool, getWeatherTool, getNewsTool, getStockPriceTool ]

// Three identical agents, one per provider. Groq goes first (most free
// headroom), Mistral and Gemini are fallbacks for whenever the one before
// it gets rate-limited.
const groqAgent = createAgent({
    model: groqModel,
    tools: allTools,
})

const mistralAgent = createAgent({
    model: mistralModel,
    tools: allTools,
})

const geminiAgent = createAgent({
    model: geminiModel,
    tools: allTools,
})

// Provider client errors carry the HTTP status in different places
// depending on the SDK version — check all the common spots.
function isRateLimitError(err) {
    const status = err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.error?.status
    return status === 429
}

const SYSTEM_PROMPT = `
    You are a helpful and precise assistant for answering questions.
    If you don't know the answer, say you don't know.
    You have access to these tools for real-time data, beyond your own search knowledge:
    - "searchInternet": general up-to-date information from the web.
    - "getWeather": current weather and today's forecast for a city.
    - "getNews": latest news headlines about a topic.
    - "getStockPrice": latest stock price and change for a ticker symbol.
    Pick the most specific tool for the question (e.g. use getWeather for weather questions instead of searchInternet), and answer based on what the tool returns.
`

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ])

// Tries each provider in order. Only moves to the next one on a 429
// (rate limit) — any other error (bad request, network issue, etc.) is
// thrown immediately instead of silently masking a real bug.
async function invokeWithFallback(providers, invoke) {
    let lastErr
    for (let i = 0; i < providers.length; i++) {
        const provider = providers[ i ]
        try {
            return await invoke(provider)
        } catch (err) {
            if (!isRateLimitError(err)) throw err
            lastErr = err
            const next = providers[ i + 1 ]
            console.warn(`${provider.name} rate-limited this request${next ? `, falling back to ${next.name}` : " — no more providers left"}`)
        }
    }
    throw lastErr
}

export async function generateResponse(messages) {
    console.log(messages)

    const formattedMessages = [
        new SystemMessage(SYSTEM_PROMPT),
        ...(messages.map(msg => {
            if (msg.role == "user") {
                return new HumanMessage(msg.content)
            } else if (msg.role == "ai") {
                return new AIMessage(msg.content)
            }
        }))
    ]

    const response = await invokeWithFallback(
        [
            { name: "Groq", agent: groqAgent },
            { name: "Mistral", agent: mistralAgent },
            { name: "Gemini", agent: geminiAgent },
        ],
        (provider) => withTimeout(
            provider.agent.invoke({ messages: formattedMessages }),
            45000,
            `${provider.name} agent`
        )
    )

    return response.messages[ response.messages.length - 1 ].text
}

export async function generateChatTitle(message) {

    const titleMessages = [
        new SystemMessage(`
            You are a helpful assistant that generates concise and descriptive titles for chat conversations.
            
            User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.    
        `),
        new HumanMessage(`
            Generate a title for a chat conversation based on the following first message:
            "${message}"
            `)
    ]

    // Title generation intentionally does NOT use the Groq → Mistral → Gemini
    // fallback chain. It's a low-value, throwaway call, so it only ever hits
    // Groq (the provider with the most free-tier headroom: 30 req/min, 1000/day).
    // Mistral (1 req/sec free tier) and Gemini are reserved for the actual
    // answer in generateResponse — burning them on a title was doubling our
    // provider calls per new chat and tripping rate limits fast.
    // If Groq itself fails for any reason, we fall back to a cheap, local
    // heuristic title instead of spending another provider's quota.
    try {
        const response = await withTimeout(
            groqModel.invoke(titleMessages),
            15000,
            "Groq title"
        )
        return response.text
    } catch (err) {
        console.warn("Groq title generation failed, falling back to a heuristic title:", err?.message)
        return message.trim().split(/\s+/).slice(0, 6).join(" ")
    }
}
import { tavily as Tavily } from "@tavily/core"

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ])

export const searchInternet = async ({ query }) => {
    const results = await withTimeout(
        tavily.search(query, { maxResults: 5 }),
        20000,
        "Internet search"
    )

    console.log(JSON.stringify(results))

    return JSON.stringify(results)
}
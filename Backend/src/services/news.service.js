
const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ])

export const getNews = async ({ query }) => {
    if (!process.env.NEWS_API_KEY) {
        return JSON.stringify({ error: "NEWS_API_KEY is not set in the environment." })
    }

    const url =
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}` +
        `&language=en&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`

    const res = await withTimeout(fetch(url), 15000, "News request")
    const data = await res.json()

    if (data.status !== "ok") {
        return JSON.stringify({ error: data.message ?? "News request failed" })
    }

    const articles = (data.articles ?? []).map(a => ({
        title: a.title,
        source: a.source?.name,
        publishedAt: a.publishedAt,
        description: a.description,
        url: a.url,
    }))

    const result = { query, articles }
    console.log(JSON.stringify(result))
    return JSON.stringify(result)
}
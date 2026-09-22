const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ])

export const getStockPrice = async ({ symbol }) => {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
        return JSON.stringify({ error: "ALPHA_VANTAGE_API_KEY is not set in the environment." })
    }

    const url =
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE` +
        `&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`

    const res = await withTimeout(fetch(url), 15000, "Stock request")
    const data = await res.json()

    const quote = data[ "Global Quote" ]

    if (!quote || Object.keys(quote).length === 0) {
        // Common free-tier failure mode: rate limit message instead of data
        return JSON.stringify({
            error: data.Note || data.Information || `No data found for symbol "${symbol}"`,
        })
    }

    const result = {
        symbol: quote[ "01. symbol" ],
        price: quote[ "05. price" ],
        change: quote[ "09. change" ],
        change_percent: quote[ "10. change percent" ],
        latest_trading_day: quote[ "07. latest trading day" ],
    }

    console.log(JSON.stringify(result))
    return JSON.stringify(result)
}
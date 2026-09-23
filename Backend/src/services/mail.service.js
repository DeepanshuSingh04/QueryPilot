// Render's free tier blocks outbound SMTP ports (25, 465, 587) entirely, so
// raw SMTP (Nodemailer + Gmail) can never work here. Brevo sends over plain
// HTTPS instead, which is never blocked — and its free tier only needs a
// single verified sender EMAIL (no domain purchase) to send to any recipient.

export async function sendEmail({ to, subject, html, text }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: { name: "QueryPilot", email: process.env.BREVO_SENDER_EMAIL }, // isi email ko Brevo dashboard me "Senders" ke andar verify karna hai
            to: [ { email: to } ],
            subject,
            htmlContent: html,
            textContent: text,
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("Brevo email error:", data)
        throw new Error(data.message || "Failed to send email")
    }

    console.log("Email sent:", data)
    return data
}
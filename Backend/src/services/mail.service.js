import { Resend } from "resend";

// Render's free tier blocks outbound SMTP ports (25, 465, 587) entirely —
// so raw SMTP (Nodemailer + Gmail OAuth2) can never work here, no matter
// how it's configured. Resend sends over plain HTTPS instead, which is
// never blocked.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
    const { data, error } = await resend.emails.send({
        // Until a custom domain is verified on resend.com/domains, this
        // sender can only deliver to the email address the Resend account
        // itself is registered with. Once a domain is verified, replace
        // "onboarding@resend.dev" with an address on that domain to send
        // to any recipient.
        from: "QueryPilot <onboarding@resend.dev>",
        to,
        subject,
        html,
        text,
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error(error.message || "Failed to send email");
    }

    console.log("Email sent:", data);
    return data;
}
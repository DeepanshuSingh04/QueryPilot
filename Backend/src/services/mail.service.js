import nodemailer from "nodemailer";
import dns from "node:dns/promises";

// Nodemailer resolves BOTH IPv4 and IPv6 addresses of the SMTP host internally
// and picks ONE AT RANDOM to connect to. On Render (and many cloud hosts)
// outbound IPv6 has no real route, so it randomly fails with ENETUNREACH
// roughly half the time. Passing a literal IP as "host" makes Nodemailer skip
// that random picking entirely (see resolveHostname in its shared/index.js).
async function resolveSmtpHost() {
    try {
        const [ ip ] = await dns.resolve4("smtp.gmail.com");
        return ip;
    } catch (err) {
        console.warn("Could not pre-resolve smtp.gmail.com to IPv4, falling back to hostname:", err.message);
        return "smtp.gmail.com";
    }
}

const smtpHost = await resolveSmtpHost();

const transporter = nodemailer.createTransport({
    host: smtpHost,
    servername: "smtp.gmail.com", // keeps TLS certificate check matching the real hostname, even though we connect via raw IP
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.GOOGLE_USER,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        clientId: process.env.GOOGLE_CLIENT_ID
    }
})

transporter.verify()
.then(()=> { console.log("Email transporter is ready to send emails"); })
.catch((err) => { console.error("Email transporter verification failed", err); });


export async function sendEmail({ to, subject, html, text }) {

    const mailOptions = {
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text
    }

    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent:", details)
}
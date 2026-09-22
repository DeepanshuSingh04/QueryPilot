import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import http from 'http';
import { initSocket } from "./src/sockets/server.socket.js";


const PORT = process.env.PORT || 3000;


const httpServer = http.createServer(app);

initSocket(httpServer);


connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
        process.exit(1);
    });
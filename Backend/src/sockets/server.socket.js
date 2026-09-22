import { Server } from "socket.io";


let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "https://querypilot-y0p7.onrender.com/",
            credentials: true,
        }
    })

    console.log("Socket Io is Running")
    
    io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id)
    })
}

export function getIO() {
    if(!io){
        throw new Error("Socket.io not initialized")
    }

    return io
}
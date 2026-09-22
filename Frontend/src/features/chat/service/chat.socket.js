import { io } from "socket.io-client";


export const initializeSocketConnection = () => {

    const socket = io("https://querypilot-y0p7.onrender.com/", {
        withCredentials: true,
    })

    socket.on("connect", ()=> {
        console.log("Connected to Socket.IO server")
    })
}
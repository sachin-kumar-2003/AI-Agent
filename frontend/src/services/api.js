import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL;

// Create a reusable axios instance
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const get_thread = () => api.get("/threads");

export const get_chat = (chatId) => {
  if (!chatId) throw new Error("chatId is required");
  return api.get(`/chat/${chatId}`);
};

export const delete_thread = (threadId) => {
  if (!threadId) throw new Error("threadId is required");
  return api.delete(`/thread/delete/${threadId}`);
};
import axios from 'axios';
const base_url = import.meta.env.VITE_BACKEND_URL;

export const get_thread =()=> axios.get(`${base_url}/threads`);
export const get_chat =(chat_id)=> axios.get(`${base_url}/chat/${chat_id}`);
export const delete_thread =(thread_id)=> axios.delete(`${base_url}/thread/delete/${thread_id}`);
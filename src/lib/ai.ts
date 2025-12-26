import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDlvfTR38CyT2dTDLfU_0IHv3M9M2ACiIU";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" }) : null;

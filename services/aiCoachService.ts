// aiCoachService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// --- API Key should be managed securely ---
const API_KEY = "AIzaSyD0RMBH-dKtgBBEj0VBj7UWmUmhyJp6of4"; 

// --- TypeScript Type Definitions ---
type CoachSummaryItem = {
    title: string;
    desc: string;
    icon: string; // 'trophy', 'sparkle', 'rocket', or 'error'
    gradientColors: string[];
};

type UserData = {
    userRank: string;
    userStats: {
        currentStreak: number;
    };
    weeklyChartData: {
        data: number[][];
    };
    effortBubbleData: {
        name: string;
        hours: number;
    }[];
};

// --- Initialize Gemini AI ---
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

// This function safely finds and extracts a JSON string from any text.
function extractJsonFromString(text: string): string | null {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/m;
    const match = text.match(jsonRegex);
    if (match) {
        return match[1] || match[2];
    }
    return null;
}

/**
 * Generates weekly highlights and now silently handles all API and parsing errors.
 * @param {UserData} userData - An object containing user stats and weekly data.
 * @returns {Promise<CoachSummaryItem[]>} - The highlights, or a formatted error message on failure.
 */
export const generateWeeklyHighlights = async (userData: UserData): Promise<CoachSummaryItem[]> => {
    if (!genAI) {
        return [{
            title: "Service Not Available",
            desc: "The AI service could not be initialized. Please check the configuration.",
            icon: 'error',
            gradientColors: ["#4A5568", "#2D3748"]
        }];
    }

    const totalHoursThisWeek = userData.weeklyChartData?.data?.flat()?.reduce((a, b) => a + b, 0) || 0;
    const mostFocusedTask = userData.effortBubbleData?.sort((a,b) => b.hours - a.hours)[0];

    const dataSummary = JSON.stringify({
        rank: userData.userRank,
        streak: userData.userStats.currentStreak,
        totalHoursThisWeek: totalHoursThisWeek.toFixed(1),
        mostFocusedTask: mostFocusedTask ? `${mostFocusedTask.name} (${mostFocusedTask.hours.toFixed(1)} hrs)`: "N/A",
    }, null, 2);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Your sole task is to analyze user data for a productivity app and return a structured JSON response.
        Do not provide any conversational text, introductions, explanations, or any text outside of the JSON structure.
        The content of the JSON should be encouraging and insightful, as if from an AI Coach.

        Here is the user's data for analysis:
        ${dataSummary}

        The output MUST be a raw, valid JSON array of objects with this exact structure:
        [
            {
                "title": "Highlight Title",
                "desc": "Brief, encouraging description.",
                "icon": "icon_name",
                "gradientColors": ["#HEX1", "#HEX2"]
            }
        ]

        For the "icon" field, choose one of these three string values:
        1. "trophy": for celebrating a specific achievement or streak.
        2. "sparkle": for a general positive insight or observation about a focused task.
        3. "rocket": for a suggestion on how to improve or level up.

        For "gradientColors", provide an array of two pleasant, modern hex color codes.
        Example for 'trophy': ["#10B981", "#059669"].
        Example for 'sparkle': ["#3B82F6", "#2563EB"].
        Example for 'rocket': ["#F97316", "#EA580C"].

        Do not wrap the JSON in markdown backticks.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const jsonString = extractJsonFromString(responseText);

        if (!jsonString) {
            // Silently return an error card without logging to console
            return [{
                title: "Invalid AI Response",
                desc: "The AI returned a response that could not be read. This might be due to content restrictions or a temporary issue.",
                icon: 'error',
                gradientColors: ["#71717A", "#52525B"]
            }];
        }
        
        const highlights: CoachSummaryItem[] = JSON.parse(jsonString);
        return highlights;

    } catch (error: any) {
        // Errors are caught, but not logged to the console.
        
        if (error.message && error.message.includes('503')) {
            return [{
                title: "AI Coach is Overloaded",
                desc: "The AI model is currently too busy. This is a temporary issue. Please try again in a few minutes.",
                icon: 'error',
                gradientColors: ["#71717A", "#52525B"]
            }];
        }
        
        // Return a generic error card for all other issues.
        return [{
            title: "An Error Occurred",
            desc: "We couldn't generate your AI suggestions. Please check your connection or try again later.",
            icon: 'error',
            gradientColors: ["#B91C1C", "#991B1B"]
        }];
    }
};

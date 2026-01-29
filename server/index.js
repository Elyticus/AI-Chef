/* eslint-env node */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Get frontend URL from environment or use localhost
const FRONTEND_URL = process.env.FRONTEND_URL || "https://kitzchef.netlify.app"; // eslint-disable-line no-undef
const isProduction = process.env.NODE_ENV === "production"; // eslint-disable-line no-undef

console.log(`Frontend URL configured: ${FRONTEND_URL}`);
console.log(`Environment: ${isProduction ? "production" : "development"}`);

// Configure CORS - REMOVED the problematic app.options("*") line

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Development logging
if (!isProduction) {
  try {
    const morgan = await import("morgan");
    app.use(morgan.default("dev"));
    console.log("Morgan logging enabled for development");
  } catch (error) {
    console.log("Morgan not available for logging");
  }
}

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // eslint-disable-line no-undef
});

app.post("/api/recipe", async (req, res) => {
  console.log("Recipe request received");

  const { ingredients } = req.body;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "Invalid ingredients" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef. Write clear, practical recipes.",
        },
        {
          role: "user",
          content: `Create a recipe using these ingredients: ${ingredients.join(", ")}`,
        },
      ],
      temperature: 0.7,
    });

    console.log("Recipe generated successfully");
    res.json({
      recipe: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("OpenAI API error:", err.message);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

const PORT = process.env.PORT || 3001; // eslint-disable-line no-undef
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

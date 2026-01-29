/* eslint-env node */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Determine the environment
const isProduction = process.env.NODE_ENV === "production"; // eslint-disable-line no-undef

// Configure logging differently based on environment
if (!isProduction) {
  // Dynamically import morgan only in development
  const morganModule = await import("morgan");
  app.use(morganModule.default("dev"));
  console.log("Running in development mode");
} else {
  console.log("Running in production mode");
}

// Configure CORS based on environment
if (isProduction) {
  // In production, only allow your specific frontend URL
  // CRITICAL: No trailing slash at the end
  app.use(
    cors({
      origin: "https://monumental-meerkat-fc58ef.netlify.app",
    }),
  );
} else {
  // In development, use your original localhost config
  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["POST"],
      allowedHeaders: ["Content-Type"],
    }),
  );
}

/**
 * Parse JSON bodies
 */
app.use(express.json());

/**
 * OpenAI client
 */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // eslint-disable-line no-undef
});

/**
 * Generate recipe
 */
app.post("/api/recipe", async (req, res) => {
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

    res.json({
      recipe: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3001; // eslint-disable-line no-undef
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

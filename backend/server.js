const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const AI_BASE_URL = "http://192.168.29.198:1234";

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Proxy endpoint for AI model status
app.get("/v1/models", async (req, res) => {
  try {
    const response = await axios.get(`${AI_BASE_URL}/v1/models`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching models:", error.message);
    res.status(500).json({
      error: "Failed to fetch models from AI service",
      details: error.message,
    });
  }
});

// Chat completions endpoint - main endpoint for influencer search
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const {
      messages,
      model = "phi-3",
      temperature = 0.7,
      max_tokens = 512,
    } = req.body;

    // Extract the user's message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Create a prompt that instructs the AI to return influencers in the specified format
    const systemPrompt = `You are an AI assistant for Campnai, an influencer marketing platform. When users ask for influencers, respond ONLY in this exact format:

"based on your requirements these are some Influencers that can handle your tasks
1. [Influencer Name 1]
2. [Influencer Name 2]
3. [Influencer Name 3]
.
.
... and so on"

Generate 3-8 realistic influencer names based on the user's requirements. The names should be varied and relevant to their query. Do not include any other text or explanations.`;

    const aiRequest = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model,
      temperature,
      max_tokens,
      stream: false,
    };

    console.log(
      "Sending request to AI model:",
      JSON.stringify(aiRequest, null, 2)
    );

    const response = await axios.post(
      `${AI_BASE_URL}/v1/chat/completions`,
      aiRequest,
      {
        timeout: 60000, // 60 second timeout for AI processing
      }
    );

    console.log("AI Response:", JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    console.error("Error in chat completions:", error.message);
    res.status(500).json({
      error: "Failed to get AI response",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Proxy endpoint for completions
app.post("/v1/completions", async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/v1/completions`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error in completions:", error.message);
    res.status(500).json({
      error: "Failed to get completion from AI service",
      details: error.message,
    });
  }
});

// Proxy endpoint for responses
app.post("/v1/responses", async (req, res) => {
  try {
    const response = await axios.post(`${AI_BASE_URL}/v1/responses`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Error in responses:", error.message);
    res.status(500).json({
      error: "Failed to get response from AI service",
      details: error.message,
    });
  }
});

// Proxy endpoint for embeddings
app.post("/v1/embeddings", async (req, res) => {
  try {
    const response = await axios.post(`${AI_BASE_URL}/v1/embeddings`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Error in embeddings:", error.message);
    res.status(500).json({
      error: "Failed to get embeddings from AI service",
      details: error.message,
    });
  }
});

// Custom endpoint for influencer search with loading indication
app.post("/api/influencer-search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Send request to AI model
    const aiResponse = await axios.post(
      `${AI_BASE_URL}/v1/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for Campnai, an influencer marketing platform. When users ask for influencers, respond ONLY in this exact format:

"based on your requirements these are some Influencers that can handle your tasks
1. [Influencer Name 1]
2. [Influencer Name 2]
3. [Influencer Name 3]
.
.
... and so on"

Generate 3-8 realistic influencer names based on the user's requirements. The names should be varied and relevant to their query. Do not include any other text or explanations.`,
          },
          { role: "user", content: query },
        ],
        model: "phi-3",
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      },
      {
        timeout: 60000,
      }
    );

    const aiContent = aiResponse.data.choices[0]?.message?.content || "";

    res.json({
      success: true,
      response: aiContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in influencer search:", error.message);
    res.status(500).json({
      error: "Failed to process influencer search",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Campnai Backend API running on port ${PORT}`);
  console.log(`🔗 AI Model endpoint: ${AI_BASE_URL}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

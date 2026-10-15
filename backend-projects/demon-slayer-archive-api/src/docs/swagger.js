
import swaggerJsdoc from "swagger-jsdoc";

// ==========================================
// OPENAPI CONFIGURATION
// ==========================================

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Demon Slayer Archive API",
      version: "1.0.0",

      description:
        "REST API for managing Demon Slayers, Demons, " +
        "Breathing Styles, Blood Demon Arts, and Techniques.",
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Slayers",
        description: "Manage Demon Slayers",
      },
      {
        name: "Demons",
        description: "Manage Demons",
      },
      {
        name: "Breathing Styles",
        description: "Manage Breathing Styles",
      },
      {
        name: "Blood Demon Arts",
        description: "Manage Blood Demon Arts",
      },
      {
        name: "Techniques",
        description: "Manage Techniques",
      },
    ],
  },

  // Endpoint documentation will be added here later.
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

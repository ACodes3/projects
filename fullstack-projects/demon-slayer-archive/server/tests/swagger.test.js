
import { describe, it, expect } from "vitest";
import swaggerSpec from "../src/docs/swagger.js";

const collections = [
  "slayers",
  "demons",
  "breathing-styles",
  "blood-demon-arts",
  "techniques",
];

describe("Swagger / OpenAPI Documentation", () => {
  it("should use OpenAPI 3.0.3", () => {
    expect(swaggerSpec.openapi).toBe("3.0.3");
  });

  it("should have the correct API title", () => {
    expect(swaggerSpec.info.title).toBe(
      "Demon Slayer Archive API"
    );
  });

  it("should document all five collections", () => {
    for (const collection of collections) {
      expect(
        swaggerSpec.paths[`/api/${collection}`]
      ).toBeDefined();

      expect(
        swaggerSpec.paths[`/api/${collection}/{id}`]
      ).toBeDefined();
    }
  });

  it("should document all 25 API operations", () => {
    const expectedMethods = {
      collection: ["get", "post"],
      record: ["get", "patch", "delete"],
    };

    let total = 0;

    for (const collection of collections) {
      const collectionPath =
        swaggerSpec.paths[`/api/${collection}`];

      const recordPath =
        swaggerSpec.paths[`/api/${collection}/{id}`];

      for (const method of expectedMethods.collection) {
        expect(collectionPath[method]).toBeDefined();
        total++;
      }

      for (const method of expectedMethods.record) {
        expect(recordPath[method]).toBeDefined();
        total++;
      }
    }

    expect(total).toBe(25);
  });

  it("should define all five resource schemas", () => {
    const schemas = swaggerSpec.components.schemas;

    for (const name of [
      "Slayer",
      "Demon",
      "BreathingStyle",
      "BloodDemonArt",
      "Technique",
    ]) {
      expect(schemas[name]).toBeDefined();
      expect(schemas[`${name}Create`]).toBeDefined();
      expect(schemas[`${name}Update`]).toBeDefined();
    }
  });

  it("should include pagination metadata", () => {
    const schema =
      swaggerSpec.components.schemas.Pagination;

    expect(schema.properties).toHaveProperty("page");
    expect(schema.properties).toHaveProperty("limit");
    expect(schema.properties).toHaveProperty("total");
    expect(schema.properties).toHaveProperty("totalPages");
    expect(schema.properties).toHaveProperty("hasNextPage");
    expect(schema.properties).toHaveProperty("hasPreviousPage");
  });

  it("should document rate-limit responses", () => {
    for (const collection of collections) {
      expect(
        swaggerSpec.paths[`/api/${collection}`]
          .get.responses[429]
      ).toBeDefined();
    }
  });
});

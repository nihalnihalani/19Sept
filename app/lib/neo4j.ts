import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNeo4jDriver(): Driver {
  if (driver) return driver;

  const uri = getRequiredEnv("NEO4J_URI");
  const username = getRequiredEnv("NEO4J_USERNAME");
  const password = getRequiredEnv("NEO4J_PASSWORD");

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    // Aura best practices: encrypted by default with neo4j+s
    // Optional: tune connection pool if needed
    // maxConnectionPoolSize: 50,
  });

  return driver;
}

export function getSession(database?: string): Session {
  const db = database || process.env.NEO4J_DATABASE || "neo4j";
  return getNeo4jDriver().session({ database: db });
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

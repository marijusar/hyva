import "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    TEST_PG_HOST: string;
    TEST_PG_PORT: string;
    TEST_PG_USER: string;
    TEST_PG_PASSWORD: string;
    TEST_PG_TEMPLATE_DB: string;
    TEST_RABBITMQ_URI: string;
  }
}

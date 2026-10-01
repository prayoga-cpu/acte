import "reflect-metadata";
import { applyRouteTestEnv } from "./env";

// Runs before each test file is evaluated, so the app's modules (which read
// the environment at import time) see the test configuration.
applyRouteTestEnv();

import { authenticate } from "./server/src/middleware/auth.middleware.js";

if (typeof authenticate === 'function') {
    console.log("SUCCESS: authenticate is a function and was imported correctly.");
} else {
    console.error("FAILURE: authenticate is not a function:", authenticate);
    process.exit(1);
}

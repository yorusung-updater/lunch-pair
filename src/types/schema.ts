// Schema type placeholder for frontend use.
// When `npx ampx sandbox` runs, it generates amplify_outputs.json and typed client.
// For now, we define the client type from the generated output.
// In production, use: import type { Schema } from '../../amplify/data/resource';

import type { generateClient } from "aws-amplify/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = any;
export type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

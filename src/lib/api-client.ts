import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/types/schema";

export const client = generateClient<Schema>();

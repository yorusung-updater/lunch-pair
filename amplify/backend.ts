import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import {
  data,
  recordSwipeHandler,
  getCandidatesHandler,
  getProfileHandler,
  getWhoLikedMeHandler,
} from "./data/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  recordSwipeHandler,
  getCandidatesHandler,
  getProfileHandler,
  getWhoLikedMeHandler,
});

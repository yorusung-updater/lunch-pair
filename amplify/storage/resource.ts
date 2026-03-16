import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "matchAppPhotos",
  access: (allow) => ({
    "photos/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      allow.authenticated.to(["read"]),
    ],
  }),
});

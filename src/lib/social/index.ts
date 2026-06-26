// Public entry point for the social layer. Components and hooks import from
// here so the concrete implementation stays swappable. To connect a real
// backend, implement SocialService and export it as `socialService` below.

import { mockSocialService } from "./mockService";
import type { SocialService } from "./SocialService";

export const socialService: SocialService = mockSocialService;

export type { SocialService } from "./SocialService";
export * from "./types";
export * from "./selectors";

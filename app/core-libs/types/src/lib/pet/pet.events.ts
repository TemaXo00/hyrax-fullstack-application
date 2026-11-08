export const PET_WS_NAMESPACE = 'game';

export const PET_WS_EVENTS = {
  STATE: 'pet:state',
  CLICK: 'pet:click',
  WALK: 'pet:walk',
  FEED: 'pet:feed',
  ERROR: 'pet:error',
} as const;

export interface PetWsFeedPayload {
  foodId: string;
}

export interface PetWsErrorPayload {
  statusCode: number;
  message: string;
}

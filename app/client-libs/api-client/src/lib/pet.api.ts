import { PET_ROUTES } from '@org/types';

import { request } from './http';

import type { Serialized } from './types';
import type {
  PetActionResultEntity,
  PetEntity,
  PetStateEntity,
} from '@org/types';

export type PetState = Serialized<PetStateEntity>;
export type Pet = Serialized<PetEntity>;
export type PetActionResult = Serialized<PetActionResultEntity>;

export async function getPetState(): Promise<PetState> {
  return await request<PetState>(`/${PET_ROUTES.BASE}/${PET_ROUTES.STATE}`);
}

export async function renamePet(name: string): Promise<Pet> {
  return await request<Pet>(`/${PET_ROUTES.BASE}/${PET_ROUTES.RENAME}`, {
    method: 'PATCH',
    body: { name },
  });
}

export async function clickPet(): Promise<PetActionResult> {
  return await request<PetActionResult>(
    `/${PET_ROUTES.BASE}/${PET_ROUTES.CLICK}`,
    {
      method: 'POST',
    },
  );
}

export async function walkPet(clicks: number): Promise<PetActionResult> {
  return await request<PetActionResult>(
    `/${PET_ROUTES.BASE}/${PET_ROUTES.WALK}`,
    {
      method: 'POST',
      body: { clicks },
    },
  );
}

export async function feedPet(foodId: string): Promise<PetActionResult> {
  return await request<PetActionResult>(
    `/${PET_ROUTES.BASE}/${PET_ROUTES.FEED}`,
    {
      method: 'POST',
      body: { foodId },
    },
  );
}

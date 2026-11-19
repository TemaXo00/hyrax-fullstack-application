import { usePetStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRef } from 'vue';

import { usePetGame } from './usePetGame';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('usePetGame', () => {
  it('exposes store refs and delegates actions', async () => {
    const store = usePetStore();

    const loadState = vi.spyOn(store, 'loadState').mockResolvedValue();
    const click = vi.spyOn(store, 'click').mockResolvedValue();
    const walk = vi.spyOn(store, 'walk').mockResolvedValue();
    const feed = vi.spyOn(store, 'feed').mockResolvedValue();
    const rename = vi.spyOn(store, 'rename').mockResolvedValue(true);
    const setSpecies = vi.spyOn(store, 'setSpecies');
    const reset = vi.spyOn(store, 'reset');

    const game = usePetGame();

    expect(isRef(game.pet)).toBe(true);
    expect(isRef(game.species)).toBe(true);

    await game.loadState();
    await game.click();
    await game.walk();
    await game.feed('food-1');
    await game.rename('Авава');
    game.setSpecies('guinea-pig');
    game.reset();

    expect(loadState).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(walk).toHaveBeenCalledTimes(1);
    expect(feed).toHaveBeenCalledWith('food-1');
    expect(rename).toHaveBeenCalledWith('Авава');
    expect(setSpecies).toHaveBeenCalledWith('guinea-pig');
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('delegates cooldown helpers', () => {
    const store = usePetStore();
    const cooldown = vi
      .spyOn(store, 'remainingWalkCooldown')
      .mockReturnValue(12);
    const ready = vi.spyOn(store, 'isWalkReady').mockReturnValue(false);
    const clicks = vi.spyOn(store, 'clickLimitLeft').mockReturnValue(7);

    const game = usePetGame();

    expect(game.remainingWalkCooldown()).toBe(12);
    expect(game.isWalkReady()).toBe(false);
    expect(game.clickLimitLeft()).toBe(7);
    expect(cooldown).toHaveBeenCalled();
    expect(ready).toHaveBeenCalled();
    expect(clicks).toHaveBeenCalled();
  });
});

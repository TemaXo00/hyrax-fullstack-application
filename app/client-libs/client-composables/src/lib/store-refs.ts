import { storeToRefs, type StoreGeneric } from 'pinia';

export type StoreRefs<T extends StoreGeneric> = ReturnType<
  typeof storeToRefs<T>
>;

import type { UpgradeEffectType, UpgradeEntity } from './upgrade.types.js';
import type {
  PaginationInput,
  PaginationMeta,
} from '../shared/pagination.types.js';

export interface PaginatedUpgradesAdminOutput {
  pagination: PaginationMeta;
  upgrades: UpgradeEntity[];
}

export interface CreateUpgradeAdminInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  effectType: UpgradeEffectType;
  effectValue: number;
  basePrice: number;
  priceMultiplier: number;
  maxLevel: number;
}

export interface UpdateUpgradeAdminInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  effectType?: UpgradeEffectType;
  effectValue?: number;
  basePrice?: number;
  priceMultiplier?: number;
  maxLevel?: number;
}

export interface UpgradeAdminServiceContract {
  getUpgrades(
    pagination: PaginationInput,
  ): Promise<PaginatedUpgradesAdminOutput>;
  getUpgradeById(upgradeId: string): Promise<UpgradeEntity>;
  createUpgrade(input: CreateUpgradeAdminInput): Promise<UpgradeEntity>;
  updateUpgrade(
    upgradeId: string,
    input: UpdateUpgradeAdminInput,
  ): Promise<UpgradeEntity>;
  deleteUpgrade(upgradeId: string): Promise<void>;
}

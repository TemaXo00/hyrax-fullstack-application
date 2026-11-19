<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppCard from '../components/ui/AppCard.vue';
import PetActions from '../components/pet/PetActions.vue';
import PetStage from '../components/pet/PetStage.vue';
import PetStatus from '../components/pet/PetStatus.vue';
import FeedDialog from '../components/pet/FeedDialog.vue';
import RenameDialog from '../components/pet/RenameDialog.vue';
import SpeciesSwitch from '../components/pet/SpeciesSwitch.vue';
import DailyRewardCard from '../components/rewards/DailyRewardCard.vue';
import AppIcon from '../components/ui/AppIcon.vue';
import { usePetGame } from '../composables/usePetGame';
import { useDailyReward } from '../composables/useDailyReward';
import { useNow } from '../composables/useNow';

const {
  pet,
  loading,
  busyAction,
  pendingClicks,
  foodInventory,
  species,
  speciesMeta,
  clickReward,
  autoIncome,
  level,
  xp,
  xpToNextLevel,
  xpPercent,
  mood,
  hunger,
  loadState,
  click,
  walk,
  feed,
  rename,
  setSpecies,
  remainingWalkCooldown,
} = usePetGame();

const {
  state: dailyState,
  claiming,
  load: loadDaily,
  claim: claimDaily,
} = useDailyReward();

const now = useNow(1000);
const feedOpen = ref(false);
const renameOpen = ref(false);

const cooldownSeconds = computed(() => remainingWalkCooldown(now.value));

onMounted(() => {
  if (!pet.value) {
    void loadState();
  }

  void loadDaily();
});

function submitFeed(foodId: string): void {
  feedOpen.value = false;
  void feed(foodId);
}

async function submitRename(name: string): Promise<void> {
  const success = await rename(name);

  if (success) {
    renameOpen.value = false;
  }
}
</script>

<template>
  <div>
    <div
      v-if="loading && !pet"
      class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
    >
      <div class="h-[430px] animate-pulse rounded-[32px] border border-ink/10 bg-paper/60" />
      <div class="space-y-4">
        <div class="h-44 animate-pulse rounded-[26px] border border-ink/10 bg-paper/60" />
        <div class="h-40 animate-pulse rounded-[26px] border border-ink/10 bg-paper/60" />
      </div>
    </div>

    <div
      v-else
      class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start"
    >
      <div class="space-y-3">
        <PetStage @edit-name="renameOpen = true" />

        <PetActions
          :pending-clicks="pendingClicks"
          :cooldown-seconds="cooldownSeconds"
          :busy="busyAction === 'walk'"
          :click-reward="clickReward"
          @walk="walk"
          @feed="feedOpen = true"
          @pet="click"
        />

        <AppCard tone="cream">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {{ speciesMeta.label }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-ink/65">
                {{ speciesMeta.note }}
              </p>
            </div>
            <div class="w-full shrink-0 sm:w-[230px]">
              <SpeciesSwitch
                :species="species"
                @change="setSpecies"
              />
            </div>
          </div>
        </AppCard>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppCard tone="cream">
            <div class="flex items-center gap-2 text-xs font-bold text-ink">
              <span class="grid size-8 place-items-center rounded-full bg-butter/60">
                <AppIcon
                  name="coin"
                  :size="15"
                />
              </span>
              Как заработать
            </div>
            <p class="mt-2 text-[11px] leading-relaxed text-muted">
              Клик приносит монеты и опыт. Накопленные клики превращаются в
              большую награду на прогулке.
            </p>
          </AppCard>
          <AppCard tone="cream">
            <div class="flex items-center gap-2 text-xs font-bold text-ink">
              <span class="grid size-8 place-items-center rounded-full bg-[#e9efe0]">
                <AppIcon
                  name="heart"
                  :size="15"
                />
              </span>
              Забота
            </div>
            <p class="mt-2 text-[11px] leading-relaxed text-muted">
              Кормление и прогулки повышают настроение. Чем выше настроение,
              тем больше монет за клик.
            </p>
          </AppCard>
        </div>
      </div>

      <aside class="space-y-3">
        <PetStatus
          :level="level"
          :xp="xp"
          :xp-to-next-level="xpToNextLevel"
          :xp-percent="xpPercent"
          :mood="mood"
          :hunger="hunger"
          :click-reward="clickReward"
          :auto-income="autoIncome"
        />

        <DailyRewardCard
          :state="dailyState"
          :claiming="claiming"
          @claim="claimDaily"
        />

        <AppCard tone="paper">
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            На прогулке
          </p>
          <div class="mt-2 flex items-end justify-between gap-3">
            <div>
              <p class="text-3xl font-extrabold tracking-tight text-ink">
                {{ pendingClicks }}
              </p>
              <p class="text-[11px] text-muted">накопленных кликов</p>
            </div>
            <span class="rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-ink/60">
              до 1000
            </span>
          </div>
        </AppCard>
      </aside>
    </div>

    <FeedDialog
      v-if="feedOpen"
      :open="feedOpen"
      :inventory="foodInventory"
      :busy="busyAction === 'feed'"
      @feed="submitFeed"
      @close="feedOpen = false"
    />

    <RenameDialog
      v-if="renameOpen"
      :initial-name="pet?.name ?? ''"
      :busy="busyAction === 'rename'"
      @save="submitRename"
      @close="renameOpen = false"
    />
  </div>
</template>

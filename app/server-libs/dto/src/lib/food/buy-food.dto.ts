import { FoodQuantity } from '../decorators/shop/food-quantity.decorator';

import type { BuyFoodInput } from '@org/types';

export class BuyFoodDto implements Pick<BuyFoodInput, 'quantity'> {
  @FoodQuantity()
  quantity: number;
}

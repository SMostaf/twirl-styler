
export type AppView = 'ONBOARDING_STYLE' | 'ONBOARDING_BUDGET' | 'ONBOARDING_PROFILE' | 'DISCOVERY' | 'ITEM_DETAIL';

export interface UserProfile {
  name: string;
  icon: string;
  location: string;
  bio: string;
  budgetRange: string;
  selectedStyles: string[];
  pinterestBoard?: string;
}

export interface FashionItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
  tags: string[];
  description: string;
}

export interface StyleOption {
  id: string;
  name: string;
  image: string;
}

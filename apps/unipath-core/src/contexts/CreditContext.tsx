import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus: number;
  badge?: string;
  features: string[];
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    credits: 15,
    bonus: 0,
    features: ['15 UniCoin', '3 ta standart ariza', 'Email yordam'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 69,
    credits: 40,
    bonus: 5,
    badge: 'ENG QULAY',
    popular: true,
    features: ['35 + 5 Bonus UniCoin', '8 ta ariza imkoni', 'AI hujjat tekshiruv', 'Tezkor ko\'rib chiqish'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 149,
    credits: 100,
    bonus: 15,
    badge: 'VIP',
    features: ['85 + 15 Bonus UniCoin', '20 ta ariza imkoni', 'Shaxsiy maslahatchi', 'Birinchi navbatda ko\'rib chiqish', 'Turar joy va ish erkin ochiladi'],
  },
];

export const UNLOCK_COST = 20; // UniCoin to manually unlock features

interface CreditState {
  balance: number;
  isLoading: boolean;
  purchaseCredits: (packId: string) => Promise<boolean>;
  spendCredits: (amount: number, description: string, referenceId?: string) => Promise<boolean>;
  refillModalOpen: boolean;
  setRefillModalOpen: (open: boolean) => void;
  refreshBalance: () => Promise<void>;
}

const CreditContext = createContext<CreditState | undefined>(undefined);

export function CreditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refillModalOpen, setRefillModalOpen] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setBalance(data.balance);
    } else {
      // Create initial record
      await supabase.from('user_credits').insert({ user_id: user.id, balance: 0 });
      setBalance(0);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const purchaseCredits = async (packId: string): Promise<boolean> => {
    if (!user) return false;
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) return false;

    // Mock payment — in real app this would go through Stripe
    const newBalance = balance + pack.credits;

    const { error } = await supabase
      .from('user_credits')
      .upsert({ user_id: user.id, balance: newBalance, total_purchased: newBalance }, { onConflict: 'user_id' });

    if (error) return false;

    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: pack.credits,
      transaction_type: 'purchase',
      description: `Purchased ${pack.name} ($${pack.price})`,
    });

    setBalance(newBalance);
    setRefillModalOpen(false);
    return true;
  };

  const spendCredits = async (amount: number, description: string, referenceId?: string): Promise<boolean> => {
    if (!user || balance < amount) {
      setRefillModalOpen(true);
      return false;
    }

    const newBalance = balance - amount;

    const { error } = await supabase
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (error) return false;

    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -amount,
      transaction_type: 'spend',
      description,
      reference_id: referenceId || null,
    });

    setBalance(newBalance);
    return true;
  };

  return (
    <CreditContext.Provider value={{ balance, isLoading, purchaseCredits, spendCredits, refillModalOpen, setRefillModalOpen, refreshBalance }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (!context) throw new Error('useCredits must be used within CreditProvider');
  return context;
}

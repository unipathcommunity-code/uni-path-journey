import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type JourneyStage =
  | 'documents_ready'
  | 'application_submitted'
  | 'acceptance_received'
  | 'visa_approved'
  | 'housing_search'
  | 'job_search'
  | 'arrival_preparation';

export interface JourneyState {
  currentStage: JourneyStage;
  stageIndex: number;
  stages: { key: JourneyStage; label: string; completed: boolean; active: boolean }[];
  hasAcceptance: boolean;
  hasVisaApproval: boolean;
  isJobsUnlocked: boolean;
  isHousingUnlocked: boolean;
  isArrivalUnlocked: boolean;
  isLoading: boolean;
  acceptedUniversity: { name: string; country: string; city: string | null } | null;
}

const STAGE_ORDER: JourneyStage[] = [
  'documents_ready',
  'application_submitted',
  'acceptance_received',
  'visa_approved',
  'housing_search',
  'job_search',
  'arrival_preparation',
];

const STAGE_LABELS: Record<string, Record<JourneyStage, string>> = {
  en: {
    documents_ready: 'Documents Ready',
    application_submitted: 'Application Submitted',
    acceptance_received: 'Acceptance Received',
    visa_approved: 'Visa Approved',
    housing_search: 'Housing Search',
    job_search: 'Job Search',
    arrival_preparation: 'Arrival Preparation',
  },
  uz: {
    documents_ready: 'Hujjatlar tayyor',
    application_submitted: 'Ariza yuborildi',
    acceptance_received: 'Qabul xati olindi',
    visa_approved: 'Viza tasdiqlandi',
    housing_search: 'Turar joy qidirish',
    job_search: 'Ish qidirish',
    arrival_preparation: 'Kelishga tayyorgarlik',
  },
  ru: {
    documents_ready: 'Документы готовы',
    application_submitted: 'Заявка подана',
    acceptance_received: 'Принятие получено',
    visa_approved: 'Виза одобрена',
    housing_search: 'Поиск жилья',
    job_search: 'Поиск работы',
    arrival_preparation: 'Подготовка к прибытию',
  },
};

export function useStudentJourney(language: string = 'en') {
  const { user } = useAuth();
  const [state, setState] = useState<JourneyState>({
    currentStage: 'documents_ready',
    stageIndex: 0,
    stages: [],
    hasAcceptance: false,
    hasVisaApproval: false,
    isJobsUnlocked: false,
    isHousingUnlocked: false,
    isArrivalUnlocked: false,
    isLoading: true,
    acceptedUniversity: null,
  });

  const computeJourney = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch all data in parallel
      const [docsRes, appsRes, visasRes, overridesRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, status')
          .eq('user_id', user.id),
        supabase
          .from('applications')
          .select('id, status, university:universities(name, country, city)')
          .eq('user_id', user.id),
        supabase
          .from('visa_applications')
          .select('id, status, visa_received')
          .eq('user_id', user.id),
        supabase
          .from('student_feature_overrides')
          .select('feature_key, is_unlocked')
          .eq('user_id', user.id),
      ]);

      const docs = docsRes.data || [];
      const apps = appsRes.data || [];
      const visas = visasRes.data || [];
      const overrides = overridesRes.data || [];

      // Build overrides map
      const overrideMap: Record<string, boolean> = {};
      overrides.forEach((o: any) => {
        overrideMap[o.feature_key] = o.is_unlocked;
      });

      const hasApprovedDocs = docs.some((d: any) => d.status === 'approved');
      const hasSubmitted = apps.some((a: any) => a.status === 'submitted' || a.status === 'in_review' || a.status === 'accepted');
      const acceptedApp = apps.find((a: any) => a.status === 'accepted');
      const hasAcceptance = !!acceptedApp;
      const hasVisaApproval = visas.some((v: any) => v.visa_received === true || v.status === 'approved');

      // Determine current stage
      let stageIndex = 0;
      if (hasApprovedDocs || docs.length > 0) stageIndex = 0;
      if (hasSubmitted) stageIndex = 1;
      if (hasAcceptance) stageIndex = 2;
      if (hasVisaApproval) stageIndex = 3;

      const labels = STAGE_LABELS[language] || STAGE_LABELS.en;
      const stages = STAGE_ORDER.map((key, i) => ({
        key,
        label: labels[key],
        completed: i < stageIndex + 1,
        active: i === stageIndex,
      }));

      const uni = acceptedApp?.university as unknown as { name: string; country: string; city: string | null } | null;

      // Unlock Jobs, Housing, and Arrival by default as requested by the user
      const jobsAutoUnlocked = true;
      const housingAutoUnlocked = true;
      const arrivalAutoUnlocked = true;

      const isJobsUnlocked = overrideMap['jobs'] !== undefined ? overrideMap['jobs'] : jobsAutoUnlocked;
      const isHousingUnlocked = overrideMap['housing'] !== undefined ? overrideMap['housing'] : housingAutoUnlocked;
      const isArrivalUnlocked = overrideMap['arrival_preparation'] !== undefined
        ? overrideMap['arrival_preparation']
        : arrivalAutoUnlocked;

      setState({
        currentStage: STAGE_ORDER[stageIndex],
        stageIndex,
        stages,
        hasAcceptance,
        hasVisaApproval,
        isJobsUnlocked,
        isHousingUnlocked,
        isArrivalUnlocked,
        isLoading: false,
        acceptedUniversity: uni || null,
      });
    } catch (err) {
      console.error('Error computing journey:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, language]);

  useEffect(() => {
    computeJourney();
  }, [computeJourney]);

  return state;
}

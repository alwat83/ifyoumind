import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface UniversalAskSignal {
  datasetId: string;
  datasetName: string;
  source: string;
  correlation: number;
  magnitude: 'strong' | 'moderate' | 'weak' | 'little';
  direction: 'same_direction' | 'opposite_direction';
  matchedObservations: number;
}
export interface UniversalAskResponse {
  id?: string;
  status: 'answered' | 'needs_target' | 'no_data' | 'not_enough_data';
  answer: string;
  target?: { id: string; name: string; metric: string; unit: string; source: string };
  confidence?: 'low' | 'medium' | 'high';
  supportingEvidence?: UniversalAskSignal[];
  counterEvidence?: UniversalAskSignal[];
  datasetsConsidered?: number;
  datasetIds?: string[];
  limitations?: string[];
  targetChoices?: Array<{ id: string; name: string; metric: string; unit: string }>;
  suggestions: string[];
}
export interface RecentQuestion { id:string; question:string; answer:string; intent:string; createdAt:string|null; }
export interface SavedQuestion { id:string; question:string; updatedAt:string|null; }

@Injectable({ providedIn: 'root' })
export class AskService {
  private readonly functions = inject(Functions);
  async ask(organizationId:string, question:string): Promise<UniversalAskResponse> {
    const call = httpsCallable<{organizationId:string;question:string},UniversalAskResponse>(this.functions,'askUniversalIntelligence');
    return (await call({organizationId,question})).data;
  }
  async recent(organizationId:string): Promise<RecentQuestion[]> {
    const call=httpsCallable<{organizationId:string},{questions:RecentQuestion[]}>(this.functions,'getRecentIntelligenceQuestions');
    return (await call({organizationId})).data.questions;
  }
  async saved(organizationId:string): Promise<SavedQuestion[]> {
    const call=httpsCallable<{organizationId:string},{questions:SavedQuestion[]}>(this.functions,'getSavedIntelligenceQuestions');
    return (await call({organizationId})).data.questions;
  }
  async save(organizationId:string,question:string): Promise<void> {
    const call=httpsCallable<{organizationId:string;question:string},{id:string;question:string}>(this.functions,'saveIntelligenceQuestion');
    await call({organizationId,question});
  }
  async removeSaved(organizationId:string,id:string): Promise<void> {
    const call=httpsCallable<{organizationId:string;id:string},{ok:boolean}>(this.functions,'deleteSavedIntelligenceQuestion');
    await call({organizationId,id});
  }
}

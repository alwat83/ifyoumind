import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface AskResponse {
  id?: string;
  intent: string;
  answer: string;
  evidence: any;
  suggestedQuestions: string[];
}

export interface RecentQuestion {
  id: string;
  question: string;
  answer: string;
  intent: string;
  createdAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AskService {
  private readonly functions = inject(Functions);

  async ask(organizationId: string, question: string): Promise<AskResponse> {
    const call = httpsCallable<
      { organizationId: string; question: string },
      AskResponse
    >(this.functions, 'askIntelligence');

    return (await call({ organizationId, question })).data;
  }

  async recent(organizationId: string): Promise<RecentQuestion[]> {
    const call = httpsCallable<
      { organizationId: string },
      { questions: RecentQuestion[] }
    >(this.functions, 'getRecentIntelligenceQuestions');

    return (await call({ organizationId })).data.questions;
  }
}

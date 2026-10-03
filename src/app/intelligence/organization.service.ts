import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface IntelligenceOrganization {
  organizationId: string;
  name: string;
  role: 'owner' | 'admin' | 'viewer';
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly functions = inject(Functions);

  async createWorkspace(name: string): Promise<string> {
    const create = httpsCallable<{ name: string }, { organizationId: string }>(
      this.functions, 'createIntelligenceOrganization',
    );
    return (await create({ name })).data.organizationId;
  }

  async getMyWorkspace(): Promise<IntelligenceOrganization | null> {
    const getMine = httpsCallable<Record<string, never>, { organization: IntelligenceOrganization | null }>(
      this.functions, 'getMyIntelligenceOrganization',
    );
    return (await getMine({})).data.organization;
  }

  async getWorkspace(organizationId: string): Promise<IntelligenceOrganization> {
    const get = httpsCallable<{ organizationId: string }, IntelligenceOrganization>(
      this.functions, 'getIntelligenceOrganization',
    );
    return (await get({ organizationId })).data;
  }
}

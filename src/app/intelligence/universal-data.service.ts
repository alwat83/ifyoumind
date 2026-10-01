import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface UniversalDataset {
  id: string;
  name: string;
  metric: string;
  unit: string;
  sourceLabel: string;
  description?: string | null;
  observationCount: number;
  updatedAt?: string | null;
}

export interface UniversalReasoningSignal {
  datasetId: string;
  datasetName: string;
  source: string;
  correlation: number;
  magnitude: 'strong' | 'moderate' | 'weak' | 'little';
  direction: 'same_direction' | 'opposite_direction';
  matchedObservations: number;
  evidence: Array<{ period: string; geography: string | null; entity: string | null; a: number; b: number }>;
}

export interface UniversalReasoning {
  target: { id: string; name: string; metric: string; unit: string; source: string };
  conclusion: string;
  interpretation: string;
  confidence: 'low' | 'medium' | 'high';
  supportingEvidence: UniversalReasoningSignal[];
  counterEvidence: UniversalReasoningSignal[];
  allSignals: UniversalReasoningSignal[];
  reasoningPolicy: {
    causalClaimAllowed: boolean;
    alignmentRule: string;
    minimumPairsForCorrelation: number;
    meaningfulCorrelationThreshold: number;
  };
  limitations: string[];
}

export interface UniversalAnalysis {
  datasetCount: number;
  summary: string;
  confidence: 'low' | 'medium';
  limitations: string[];
  relationships: Array<{
    datasetA: { id: string; name: string; metric: string; unit: string };
    datasetB: { id: string; name: string; metric: string; unit: string };
    matchedObservations: number;
    alignmentRule: string;
    correlation: number | null;
    strength: string;
    direction: string;
    conclusion: string;
    caveat: string;
    evidence: Array<{ period: string; a: number; b: number }>;
  }>;
}

@Injectable({ providedIn: 'root' })
export class UniversalDataService {
  private readonly functions = inject(Functions);

  async list(organizationId: string): Promise<UniversalDataset[]> {
    const call = httpsCallable<{ organizationId: string }, { datasets: UniversalDataset[] }>(
      this.functions, 'listUniversalDatasets',
    );
    return (await call({ organizationId })).data.datasets;
  }

  async create(
    organizationId: string,
    data: { name: string; metric: string; unit: string; sourceLabel?: string; description?: string },
  ): Promise<string> {
    const call = httpsCallable<
      { organizationId: string } & typeof data,
      { id: string }
    >(this.functions, 'createUniversalDataset');
    return (await call({ organizationId, ...data })).data.id;
  }

  async addObservation(
    organizationId: string,
    data: { datasetId: string; value: number; period: string; geography?: string; entity?: string; note?: string },
  ): Promise<void> {
    const call = httpsCallable<
      { organizationId: string } & typeof data,
      { id: string }
    >(this.functions, 'addUniversalObservation');
    await call({ organizationId, ...data });
  }

  async importObservations(
    organizationId: string,
    datasetId: string,
    observations: Array<{
      value: number;
      period: string;
      geography?: string | null;
      entity?: string | null;
      note?: string | null;
      dimensions?: Record<string, string>;
    }>,
  ): Promise<number> {
    const call = httpsCallable<
      { organizationId: string; datasetId: string; observations: typeof observations },
      { imported: number }
    >(this.functions, 'importUniversalObservations');
    return (await call({ organizationId, datasetId, observations })).data.imported;
  }

  async reason(
    organizationId: string,
    datasetIds: string[],
    targetDatasetId: string,
  ): Promise<UniversalReasoning> {
    const call = httpsCallable<
      { organizationId: string; datasetIds: string[]; targetDatasetId: string },
      UniversalReasoning
    >(this.functions, 'reasonAcrossUniversalDatasets');
    return (await call({ organizationId, datasetIds, targetDatasetId })).data;
  }

  async analyze(organizationId: string, datasetIds: string[]): Promise<UniversalAnalysis> {
    const call = httpsCallable<
      { organizationId: string; datasetIds: string[] },
      UniversalAnalysis
    >(this.functions, 'analyzeUniversalDatasets');
    return (await call({ organizationId, datasetIds })).data;
  }
}

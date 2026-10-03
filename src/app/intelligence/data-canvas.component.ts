import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { UniversalAnalysis, UniversalAnalysisRun, UniversalDataService, UniversalDataset, UniversalReasoning, UniversalSynthesis } from './universal-data.service';

@Component({
  selector: 'app-data-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './data-canvas.component.html',
  styleUrls: ['./data-canvas.component.scss'],
})
export class DataCanvasComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly data = inject(UniversalDataService);

  workspace: IntelligenceOrganization | null = null;
  datasets: UniversalDataset[] = [];
  selected = new Set<string>();
  analysis: UniversalAnalysis | null = null;
  reasoning: UniversalReasoning | null = null;
  recentRuns: UniversalAnalysisRun[] = [];
  synthesis: UniversalSynthesis | null = null;
  synthesisModel = '';
  synthesizing = false;
  targetDatasetId = '';
  loading = true;
  creatingWorkspace = false;
  workspaceName = 'My ifYouMind Workspace';
  saving = false;
  seedingDemo = false;
  analyzing = false;
  error = '';

  datasetForm = {
    name: '',
    metric: '',
    unit: 'count',
    sourceLabel: 'Manual',
    description: '',
  };

  observationForm = {
    datasetId: '',
    value: '',
    period: '',
    geography: '',
    entity: '',
    note: '',
  };

  readonly units = ['count', 'percent', 'currency', 'rate', 'index', 'temperature', 'distance', 'duration', 'score', 'other'];

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) {
        await this.refresh();
        this.recentRuns = await this.data.recentRuns(this.workspace.organizationId);
      }
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  async createWorkspace(): Promise<void> {
    if (this.creatingWorkspace || !this.workspaceName.trim()) return;
    this.creatingWorkspace = true;
    this.error = '';
    try {
      await this.organizations.createWorkspace(this.workspaceName.trim());
      this.workspace = await this.organizations.getMyWorkspace();
      if (!this.workspace) {
        throw new Error('Workspace was created but could not be loaded.');
      }
      await this.refresh();
      this.recentRuns = await this.data.recentRuns(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.creatingWorkspace = false;
    }
  }

  toggleDataset(id: string): void {
    if (this.selected.has(id)) {
      this.selected.delete(id);
      if (this.targetDatasetId === id) this.targetDatasetId = '';
    } else if (this.selected.size < 8) {
      this.selected.add(id);
      if (!this.targetDatasetId) this.targetDatasetId = id;
    }
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  async loadDemoData(): Promise<void> {
    if (!this.workspace || this.seedingDemo) return;
    this.seedingDemo = true;
    this.error = '';
    try {
      const seeded = await this.data.seedDemo(this.workspace.organizationId);
      await this.refresh();
      this.selected = new Set(seeded.datasetIds);
      this.targetDatasetId = seeded.targetDatasetId;
      this.analysis = null;
      this.reasoning = null;
      this.synthesis = null;
      this.synthesisModel = '';
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.seedingDemo = false;
    }
  }

  async createDataset(): Promise<void> {
    if (!this.workspace || !this.datasetForm.name.trim() || !this.datasetForm.metric.trim() || this.saving) return;
    this.saving = true;
    this.error = '';
    try {
      const id = await this.data.create(this.workspace.organizationId, {
        name: this.datasetForm.name,
        metric: this.datasetForm.metric,
        unit: this.datasetForm.unit,
        sourceLabel: this.datasetForm.sourceLabel,
        description: this.datasetForm.description,
      });
      this.observationForm.datasetId = id;
      this.datasetForm = { name: '', metric: '', unit: 'count', sourceLabel: 'Manual', description: '' };
      await this.refresh();
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.saving = false;
    }
  }

  async addObservation(): Promise<void> {
    if (!this.workspace || !this.observationForm.datasetId || !this.observationForm.period || this.observationForm.value === '' || this.saving) return;
    const value = Number(this.observationForm.value);
    if (!Number.isFinite(value)) {
      this.error = 'Observation value must be numeric.';
      return;
    }

    this.saving = true;
    this.error = '';
    try {
      await this.data.addObservation(this.workspace.organizationId, {
        datasetId: this.observationForm.datasetId,
        value,
        period: this.observationForm.period,
        geography: this.observationForm.geography,
        entity: this.observationForm.entity,
        note: this.observationForm.note,
      });
      this.observationForm = {
        datasetId: this.observationForm.datasetId,
        value: '',
        period: '',
        geography: '',
        entity: '',
        note: '',
      };
      await this.refresh();
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.saving = false;
    }
  }

  async analyze(): Promise<void> {
    if (!this.workspace || this.selected.size < 2 || !this.targetDatasetId || this.analyzing) return;
    this.analyzing = true;
    this.error = '';
    try {
      const ids = [...this.selected];
      this.synthesis = null;
      this.synthesisModel = '';
      [this.analysis, this.reasoning] = await Promise.all([
        this.data.analyze(this.workspace.organizationId, ids),
        this.data.reason(this.workspace.organizationId, ids, this.targetDatasetId),
      ]);
      this.recentRuns = await this.data.recentRuns(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.analyzing = false;
    }
  }

  async explainWithAi(): Promise<void> {
    if (!this.workspace || !this.reasoning?.analysisRunId || this.synthesizing) return;
    this.synthesizing = true;
    this.error = '';
    try {
      const result = await this.data.synthesize(
        this.workspace.organizationId,
        this.reasoning.analysisRunId,
      );
      this.synthesis = result.synthesis;
      this.synthesisModel = result.model;
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.synthesizing = false;
    }
  }

  private async refresh(): Promise<void> {
    if (!this.workspace) return;
    this.datasets = await this.data.list(this.workspace.organizationId);
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}

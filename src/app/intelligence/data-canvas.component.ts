import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { UniversalAnalysis, UniversalDataService, UniversalDataset } from './universal-data.service';

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
  loading = true;
  saving = false;
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
      if (this.workspace) await this.refresh();
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  toggleDataset(id: string): void {
    if (this.selected.has(id)) this.selected.delete(id);
    else if (this.selected.size < 8) this.selected.add(id);
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
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
    if (!this.workspace || this.selected.size < 2 || this.analyzing) return;
    this.analyzing = true;
    this.error = '';
    try {
      this.analysis = await this.data.analyze(this.workspace.organizationId, [...this.selected]);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.analyzing = false;
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

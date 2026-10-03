import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { parseCsv, CsvTable, suggestColumn } from './csv-parser';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { UniversalDataService, UniversalDataset } from './universal-data.service';

@Component({
  selector: 'app-data-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './data-import.component.html',
  styleUrls: ['./data-import.component.scss'],
})
export class DataImportComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly data = inject(UniversalDataService);

  workspace: IntelligenceOrganization | null = null;
  datasets: UniversalDataset[] = [];
  table: CsvTable | null = null;
  fileName = '';
  datasetId = '';
  valueColumn = '';
  periodColumn = '';
  geographyColumn = '';
  entityColumn = '';
  noteColumn = '';
  importing = false;
  importedCount: number | null = null;
  error = '';

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) this.datasets = await this.data.list(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    }
  }

  async chooseFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.error = '';
    this.importedCount = null;
    this.fileName = file.name;

    try {
      if (file.size > 2_000_000) throw new Error('CSV must be 2 MB or smaller for this first importer.');
      const text = await file.text();
      this.table = parseCsv(text);
      if (this.table.rows.length > 400) {
        throw new Error('This first importer supports up to 400 data rows at a time.');
      }

      const headers = this.table.headers;
      this.valueColumn = suggestColumn(headers, ['value','amount','price','rate','count','score','metric']);
      this.periodColumn = suggestColumn(headers, ['period','date','month','year','time','timestamp']);
      this.geographyColumn = suggestColumn(headers, ['geography','zip','zipcode','postalcode','city','county','state','location']);
      this.entityColumn = suggestColumn(headers, ['entity','name','property','category','area','neighborhood']);
      this.noteColumn = suggestColumn(headers, ['note','notes','description','comment']);
    } catch (error) {
      this.table = null;
      this.error = this.message(error);
    } finally {
      input.value = '';
    }
  }

  previewRows(): string[][] {
    return this.table?.rows.slice(0, 5) || [];
  }

  dimensionColumns(): string[] {
    if (!this.table) return [];
    const reserved = new Set([
      this.valueColumn,
      this.periodColumn,
      this.geographyColumn,
      this.entityColumn,
      this.noteColumn,
    ].filter(Boolean));
    return this.table.headers.filter((header) => !reserved.has(header));
  }

  canImport(): boolean {
    return !!(
      this.workspace &&
      this.datasetId &&
      this.table &&
      this.valueColumn &&
      this.periodColumn &&
      !this.importing
    );
  }

  async import(): Promise<void> {
    if (!this.canImport() || !this.workspace || !this.table) return;
    this.importing = true;
    this.error = '';
    this.importedCount = null;

    try {
      const index = new Map(this.table.headers.map((header, i) => [header, i]));
      const valueIndex = index.get(this.valueColumn)!;
      const periodIndex = index.get(this.periodColumn)!;
      const geographyIndex = this.geographyColumn ? index.get(this.geographyColumn) : undefined;
      const entityIndex = this.entityColumn ? index.get(this.entityColumn) : undefined;
      const noteIndex = this.noteColumn ? index.get(this.noteColumn) : undefined;
      const dimensionColumns = this.dimensionColumns();

      const observations = this.table.rows.map((row, rowIndex) => {
        const value = Number(row[valueIndex].replace(/[$,%]/g, '').trim());
        if (!Number.isFinite(value)) {
          throw new Error(`Row ${rowIndex + 2}: "${row[valueIndex]}" is not a numeric value.`);
        }

        const period = row[periodIndex].trim();
        if (!period) throw new Error(`Row ${rowIndex + 2}: period is empty.`);

        const dimensions: Record<string, string> = {};
        for (const column of dimensionColumns) {
          const i = index.get(column)!;
          const cell = row[i].trim();
          if (cell) dimensions[column] = cell;
        }

        return {
          value,
          period,
          geography: geographyIndex === undefined ? null : row[geographyIndex].trim() || null,
          entity: entityIndex === undefined ? null : row[entityIndex].trim() || null,
          note: noteIndex === undefined ? null : row[noteIndex].trim() || null,
          dimensions,
        };
      });

      this.importedCount = await this.data.importObservations(
        this.workspace.organizationId,
        this.datasetId,
        observations,
      );
      this.datasets = await this.data.list(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.importing = false;
    }
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}

import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { SnackbarService } from '../../Core/services/snackbar.service';
import { JsonEditorComponent, JsonEditorOptions } from '../../Features/json-editor';
import { IRadConfig, RadConfigService } from '../../Services/api/rad-config.service';

@Component({
  selector: 'config-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatIconModule,
    JsonEditorComponent,
    TranslocoModule,
    TextFieldModule
  ],
  templateUrl: './config-management.component.html',
  styleUrls: ['./config-management.component.scss']
})
export class ConfigManagementComponent implements OnInit {
  configs: IRadConfig[] = [];
  configForm!: FormGroup;
  isNew = false;
  private lastLoadedConfig: IRadConfig | null = null;

  // Json editors
  @ViewChild('jsonEditor', { static: false })
  public editor = new JsonEditorComponent();
  public editorOptions = new JsonEditorOptions();


  constructor(
    private fb: FormBuilder,
    private configService: RadConfigService,
    private snackbar: SnackbarService
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.initJsonEditor();
    this.loadConfigs();
  }

  private initJsonEditor() {
    this.editorOptions = new JsonEditorOptions({
      modes: ['form', 'tree', 'text', 'code'],
      mode: 'form',
      search: false,
      statusBar: false,
      expandAll: true,
      onChange: () => this.configForm.get('value')?.markAsDirty(),
      onModeChange: () => this.editor.expandAll()
    });
  }

  private initForm() {
    this.configForm = this.fb.group({
      key: ['', [Validators.required]],
      description: [''],
      isEnvValue: [false],
      value: [{}]
    });
  }

  loadConfigs(restoreKey?: string): void {
    this.configService.findAll().subscribe((configs: any) => {
      this.configs = configs;
      // Se c'è una chiave da ripristinare, o se non c'è una configurazione selezionata (prima load), seleziona
      if (restoreKey) {
        this.onConfigChange(restoreKey);
      } else if (this.configs.length > 0 && !this.configForm.value.key) {
        this.onConfigChange(this.configs[0].key);
      }
    });
  }

  onConfigChange(key: string): void {
    const selected = this.configs.find(c => c.key === key);
    if (selected) {
      this.isNew = false;
      this.configForm.patchValue(selected);
      this.configForm.get('key')?.disable(); // Disabilita in modifica
      
      // Update editor data explicitly
      if (this.editor) {
        this.editor.set(selected.value);
        this.editor.expandAll(); // Option: Always expand all on load for better visibility
      }
      
      this.configForm.markAsPristine();
      this.lastLoadedConfig = { ...selected };
    }
  }

  prepareCreate(): void {
    this.isNew = true;
    this.lastLoadedConfig = null;
    this.configForm.reset({ value: {}, isEnvValue: false });
    this.configForm.get('key')?.enable(); // Abilita per nuovo inserimento
    
    if (this.editor) {
      this.editor.set({});
    }
  }

  onSave(): void {
    if (this.configForm.valid) {
      const data = this.configForm.getRawValue(); // Usa getRawValue per leggere anche i campi disabilitati
      
      // Get data from editor
      if (this.editor) {
        data.value = this.editor.get();
      }

      const obs = this.isNew
        ? this.configService.create(data)
        : this.configService.update(data.key, data);

      obs.subscribe(() => {
        this.snackbar.success('common.save_success');
        
        // Save expansion state before reloading
        // Note: jsoneditor doesn't provide a direct API to get expansion state easily,
        // but we can at least try to keep the key selected.
        const currentKey = data.key;
        
        this.loadConfigs(currentKey); // Pass currentKey to restore selection
        
        if (this.isNew) {
          this.isNew = false;
          this.configForm.get('key')?.disable(); // Disabilita dopo il salvataggio
        }
      });
    }
  }

  onCancel(): void {
    if (this.isNew) {
      this.isNew = false;
      this.configForm.reset({ value: {}, isEnvValue: false });
      if (this.configs.length > 0) {
        this.onConfigChange(this.configs[0].key);
      }
      this.snackbar.info('common.creation_cancelled');
    } else if (this.lastLoadedConfig) {
      this.configForm.patchValue(this.lastLoadedConfig);
      
      // Reset editor to last loaded value
      if (this.editor) {
        this.editor.set(this.lastLoadedConfig.value);
      }
      
      this.configForm.markAsPristine(); // Resetta lo stato dirty
      this.editor.expandAll(); // Option: Always expand all on load for better visibility
    }
  }

  onDelete(): void {
    const key = this.configForm.getRawValue().key;
    if (key && confirm(`Delete ${key}?`)) {
      this.configService.delete(key).subscribe(() => {
        this.snackbar.success('common.delete_success');
        this.configForm.reset();
        this.loadConfigs();
      });
    }
  }

  reloadConfigs(): void {
    this.configService.reloadConfigs().subscribe({
      next: (res) => {
        this.snackbar.success('common.reload_success');
        this.loadConfigs();
      },
      error: (err) => {
        this.snackbar.error('common.reload_error');
      }
    });
  }

}
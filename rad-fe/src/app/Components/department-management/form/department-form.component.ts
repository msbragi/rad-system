import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { IDepartment } from '../../../Models/models.interface';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    TranslocoDirective,
  ],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  department?: IDepartment;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DepartmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { department?: IDepartment }
  ) {
    this.department = data.department ?? undefined;
  }

  ngOnInit() {
    this.isEditMode = !!this.department;
    this.buildForm();
  }

  private buildForm() {
    this.form = this.fb.group({
      code: [this.department?.code || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.department?.description || '', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.dialogRef.close(formValue);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
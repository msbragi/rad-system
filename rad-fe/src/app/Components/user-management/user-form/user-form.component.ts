import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDialogModule } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { TranslocoDirective } from "@jsverse/transloco";
import { MatChipsModule } from "@angular/material/chips";
import { IUser } from "../../../Models/models.interface";

@Component({
  selector: "app-user-form",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatChipsModule,
    TranslocoDirective,
  ],
  templateUrl: "./user-form.component.html",
  styleUrls: ["./user-form.component.scss"],
})
export class UserFormComponent implements OnInit {
  @Input() user?: IUser;
  @Output() save = new EventEmitter<Partial<IUser>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form!: FormGroup;
  isEditMode = false;

  roleOptions = [
    { value: null, label: "users.regular_user" },
    { value: "admin", label: "users.admin" },
    { value: "super_user", label: "users.super_user" },
  ];

  ngOnInit() {
      this.buildForm();
  }

  private buildForm() {
    this.form = this.fb.group({
      email: [this.user?.email || "", [Validators.required, Validators.email]],
      username: [this.user?.email?.split("@")[0] || "", Validators.required],
      password: [
        "",
        this.isEditMode ? [] : [Validators.required, Validators.minLength(6)],
      ],
      fullName: [this.user?.fullName || "", Validators.required],
      role: [this.user?.role || null],
      departments: this.user?.departments ?? '',
      disabled: [this.user?.disabled || false],
    });

    // In edit mode, password is optional
    if (this.isEditMode) {
      this.form.get("username")?.disable();
    }
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const departments = this.form.get("departments")?.getRawValue() || [];
      formValue.departments = departments.join(",");

      // Remove password if empty in edit mode
      if (this.isEditMode && !formValue.password) {
        delete formValue.password;
      }

      this.save.emit(formValue);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  getTitle(): string {
    return this.isEditMode ? "users.edit_user" : "users.create_user";
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '../../Core/services/snackbar.service';
import { IDepartment } from '../../Models/models.interface';
import { DepartmentFormComponent } from './form/department-form.component';
import { DepartmentsService } from '../../Services/api/departments.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    TranslocoDirective,
  ],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss']
})
export class DepartmentManagementComponent implements OnInit, OnDestroy {
  departments: IDepartment[] = [];
  displayedColumns: string[] = ['id', 'code', 'description', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(
    private departmentsService: DepartmentsService,
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartments(): void {
    this.departmentsService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departments = departments;
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DepartmentFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result) {
            this.createDepartment(result);
          }
        }
      });
  }

  openEditDialog(department: IDepartment): void {
    const dialogRef = this.dialog.open(DepartmentFormComponent, {
      width: '600px',
      data: { department }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result) {
            this.updateDepartment(department.id!, result);
          }
        }
      });
  }

  createDepartment(department: IDepartment): void {
    this.departmentsService.create(department)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbar.success('departments.createSuccess');
          this.loadDepartments();
        }
      });
  }

  updateDepartment(id: number, department: Partial<IDepartment>): void {
    this.departmentsService.update(id, department)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbar.success('departments.updateSuccess');
          this.loadDepartments();
        }
      });
  }

  deleteDepartment(department: IDepartment): void {
    if (confirm(`Are you sure you want to delete "${department.description}"?`)) {
      this.departmentsService.delete(department.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbar.success('departments.deleteSuccess');
            this.loadDepartments();
          }
        });
    }
  }
}
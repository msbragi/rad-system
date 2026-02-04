import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { TranslocoDirective } from "@jsverse/transloco";
import { Subject, takeUntil } from "rxjs";
import { SnackbarService } from "../../Core/services/snackbar.service";
import {
  ActionButtons,
  ActionButtonsComponent,
} from "../../Features/action-buttons/action-buttons.component";
import { ConfirmDialogService } from "../../Features/confirm/confirm-dialog.service";
import { IUser } from "../../Models/models.interface";
import { AdminService } from "../../Services/api/admin.service";
import { UserFormComponent } from "./user-form/user-form.component";

@Component({
  selector: "app-user-management",
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule,
    TranslocoDirective,
    ActionButtonsComponent,
  ],
  templateUrl: "./user-management.component.html",
  styleUrls: ["./user-management.component.scss"],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: IUser[] = [];
  filteredUsers: IUser[] = [];
  isLoading = false;
  searchText = "";
  filterRole: string | null = null;
  filterStatus: string | null = null;

  displayedColumns: string[] = [
    "email",
    "fullName",
    "role",
    "departments",
    "disabled",
    "actions",
  ];

  roleOptions = [
    { value: null, label: "users.all_roles" },
    { value: "super_user", label: "users.super_user" },
    { value: "admin", label: "users.admin" },
    { value: "user", label: "users.regular_user" },
  ];

  statusOptions = [
    { value: null, label: "users.all_statuses" },
    { value: "active", label: "users.active" },
    { value: "disabled", label: "users.disabled" },
  ];

  constructor(
    private adminService: AdminService,
    private snackbar: SnackbarService,
    private confirmDialog: ConfirmDialogService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    this.filterUsers();
  }

  onRoleFilterChange() {
    this.filterUsers();
  }

  onStatusFilterChange() {
    this.filterUsers();
  }

  onActionClick(action: string, user: IUser) {
    switch (action) {
      case "edit":
        this.onEdit(user);
        break;
      case "delete":
        this.onDelete(user);
        break;
    }
  }

  onEdit(user: IUser) {
    const dialogRef = this.dialog.open<UserFormComponent>(UserFormComponent, {
      data: { user },
      width: "80vw",
      maxWidth: "1400px",
      disableClose: true,
    });

    if (dialogRef.componentInstance) {
      dialogRef.componentInstance.user = user;

      dialogRef.componentInstance.save.subscribe((formData: Partial<IUser>) => {
        this.adminService
          .updateUser(user.id as number, formData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbar.success("users.update_success");
              this.loadUsers();
              dialogRef.close();
            },
          });
      });

      dialogRef.componentInstance.cancel.subscribe(() => {
        dialogRef.close();
      });
    }
  }

  onDelete(user: IUser) {
    const data = {
      title: "users.delete_title",
      message: "users.delete_confirm",
      params: { email: user.email },
    };
    this.confirmDialog.open(data).subscribe((confirmed) => {
      if (confirmed) {
        this.adminService
          .deleteUser(user.id as number)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbar.success("users.delete_success");
              this.loadUsers();
            },
          });
      }
    });
  }

  onCreate() {
    const dialogRef = this.dialog.open<UserFormComponent>(UserFormComponent, {
      width: "80vw",
      maxWidth: "1400px",
      disableClose: true,
    });

    if (dialogRef.componentInstance) {
      dialogRef.componentInstance.save.subscribe((formData: Partial<IUser>) => {
        this.adminService
          .createUser(formData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbar.success("users.create_success");
              this.loadUsers();
              dialogRef.close();
            },
          });
      });

      dialogRef.componentInstance.cancel.subscribe(() => {
        dialogRef.close();
      });
    }
  }

  showActionButtons(user: IUser): ActionButtons[] {
    return ["edit", "delete"];
  }

  getRoleLabel(role: string | null): string {
    if (!role || role === "user") return "users.regular_user";
    if (role === "admin") return "users.admin";
    if (role === "super_user") return "users.super_user";
    return "users.regular_user";
  }

  private loadUsers() {
    this.isLoading = true;
    this.adminService
      .getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users || [];
          this.filterUsers();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private filterUsers() {
    this.filteredUsers = this.users.filter((user) => {
      // Search filter
      const matchesSearch =
        !this.searchText ||
        user.email?.toLowerCase().includes(this.searchText) ||
        user.fullName?.toLowerCase().includes(this.searchText);

      // Role filter
      const matchesRole =
        !this.filterRole ||
        (this.filterRole === "user" && (!user.role || user.role === "user")) ||
        user.role === this.filterRole;

      // Status filter
      const matchesStatus =
        !this.filterStatus ||
        (this.filterStatus === "active" && !user.disabled) ||
        (this.filterStatus === "disabled" && user.disabled);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }
}

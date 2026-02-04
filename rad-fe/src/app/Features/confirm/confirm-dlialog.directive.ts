import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "./confirm-dialog.component";

@Directive({
  selector: "[gpiConfirmDialog]",
})
export class ConfirmDialogDirective {
  @Output() confirm = new EventEmitter();
  @Input() title: string | undefined;
  @Input() type: string | undefined;
  @Input() message: string | undefined;

  constructor(private dialog: MatDialog) {}

  @HostListener("click", ["$event"])
  doConfirm(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      this.getConfig(),
    );
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.confirm.emit();
      }
    });
  }

  private getConfig() {
    if (this.type && this.type == "delete") {
      this.title = "Conferma cancellazione?";
      if (!this.message) {
        this.message =
          "Attenzione. La conferma comporterà l'eliminazione del record, e di tutti quelli collegati. Conferma?";
      }
    }
    const config = <any>{
      width: "400px",
      data: {
        title: this.title || "",
        message: this.message || "",
      },
    };
    return config;
  }
}

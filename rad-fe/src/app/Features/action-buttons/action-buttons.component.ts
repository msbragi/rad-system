import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslocoModule } from "@jsverse/transloco";

export type ActionButtons = "view" | "edit" | "duplicate" | "delete" | "embed";

const ButtonActionIcon = {
  view: "visibility",
  edit: "edit",
  duplicate: "content_copy",
  delete: "delete",
  embed: "hub",
};

@Component({
  selector: "tc-action-buttons",
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, TranslocoModule],
  template: `
    <div class="action-buttons" *transloco="let t">
      @for (btn of buttons; track btn) {
        <button
          mat-icon-button
          class="{{ btn }}-button"
          (click)="onAction(btn)"
          [matTooltip]="t('common.tooltips.' + btn)"
          type="button"
        >
          <mat-icon>{{ buttonIcon[btn] }}</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .action-buttons {
        display: flex;
        align-items: center;
        gap: 0px !important;
        button {
          padding: 0px !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonsComponent {
  @Input() buttons: ActionButtons[] = [];
  @Output() action = new EventEmitter<ActionButtons>();
  buttonIcon = ButtonActionIcon;
  /**
   * Handles button click and emits the action type
   */
  onAction(button: ActionButtons) {
    this.action.emit(button);
  }
}

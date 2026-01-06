import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { ImageUtils } from "../../Utils/image-utils";

@Component({
  selector: "tc-image",
  standalone: true,
  imports: [],
  template: `
    <img
      [src]="displaySrc"
      [alt]="alt"
      [class]="cssClass"
      [style.width]="size"
      [style.height]="size"
      (error)="onError($event)"
      [attr.loading]="loading ? 'lazy' : null"
    />
  `,
  styles: [
    `
      img {
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
    `,
  ],
})
export class ImageComponent implements OnInit, OnDestroy {
  @Input() src!: string;
  @Input() alt: string = "Avatar";
  @Input() size: string = "32px";
  @Input() cssClass: string = "";
  @Input() fallback?: string | "assets/img/avatars/default-avatar.png";
  @Input() loading: boolean = true;

  displaySrc: string = "assets/img/avatars/default-avatar.png";
  private destroy$ = new Subject<void>();

  constructor(private imageUtils: ImageUtils) {}

  ngOnInit(): void {
    if (this.src) {
      this.loadImage();
    }
  }

  private loadImage(): void {
    this.imageUtils
      .loadImage(this.src, this.fallback)
      .pipe(takeUntil(this.destroy$))
      .subscribe((imageSrc) => {
        this.displaySrc = imageSrc;
      });
  }

  onError(event: Event): void {
    // Final fallback if everything fails
    const img = event.target as HTMLImageElement;
    if (img.src !== this.imageUtils["getDefaultImage"]()) {
      img.src = this.imageUtils["getDefaultImage"]();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ActivatedRoute } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { PdfViewerComponent, PdfViewerModule } from "ng2-pdf-viewer";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "tc-pdf-show",
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoDirective,
    PdfViewerModule,
    MatTooltip,
  ],
  templateUrl: "./pdf-show.component.html",
  styleUrls: ["./pdf-show.component.scss"],
})
export class PdfShowComponent implements OnInit {
  @Input() url!: string;
  @Input() page = 1;
  @Input() search = "";
  @Input() name = "";

  zoom = 1.0;
  totalPages = 0;
  currentPage = 1;
  searchText = "";
  showToolbar = true;
  initialSearchExecuted: boolean = false;

  @ViewChild(PdfViewerComponent) pdfComponent?: PdfViewerComponent;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.url = params.get("url") || "";
      this.page = +(params.get("page") || 1);
      this.search = params.get("search") || "";
      this.name = params.get("name") || "";
      this.currentPage = this.page;
      this.searchText = this.search;
    });
  }

  onPdfLoaded(pdf: any) {
    this.totalPages = pdf.numPages;
    // Reset the flag when a new PDF is loaded
    this.initialSearchExecuted = false;
  }

  onTextLayerRendered(event: any) {
    // This event fires for every page. Check if the initial search is done.
    if (this.searchText && !this.initialSearchExecuted) {
      this.doSearch(this.searchText);
      this.initialSearchExecuted = true; // Mark as executed
    }
  }

  doSearch(text: string) {
    const pdfComponent = this.pdfComponent;
    if (pdfComponent && pdfComponent.eventBus) {
      pdfComponent.eventBus.dispatch("find", {
        query: this.searchText,
        type: "again", // 'again' for subsequent searches, 'find' for the first search
        caseSensitive: false,
        findPrevious: undefined,
        highlightAll: true,
        phraseSearch: true,
      });
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
    this.doSearch(this.searchText);
  }

  zoomIn() {
    if (this.zoom < 3) this.zoom += 0.1;
  }

  zoomOut() {
    if (this.zoom > 0.3) this.zoom -= 0.1;
  }

  clearSearch() {
    this.searchText = "";
    this.doSearch("");
  }

  get pdfFilename(): string {
    if (this.name) return this.name;
    if (!this.url) return "";
    try {
      const urlObj = new URL(this.url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || "";
      //            return decodeURIComponent(filename.replace('.pdf', ''));
      return decodeURIComponent(filename);
    } catch {
      return this.url.split("/").pop()?.replace(".pdf", "") || "";
    }
  }
}

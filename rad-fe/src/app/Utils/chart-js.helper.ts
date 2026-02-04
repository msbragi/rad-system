import { ChartData } from "chart.js";

export type ThemeType = "dark" | "light";

export interface ChartColors {
  gridColor: string;
  borderColor: string;
  tickColor: string;
  legendColor: string;
  tooltipBackground: string;
  tooltipTitle: string;
  tooltipBody: string;
  tooltipBorder: string;
  datasetColors: string[];
}

export interface TimeSeriesData {
  period: string; // YYYY-MM-DD format
  count: number;
  label: string; // Human readable format
}

export interface ChartStatistics {
  users: TimeSeriesData[];
  capsules: TimeSeriesData[];
  items: TimeSeriesData[];
  recipients: TimeSeriesData[];
  libraryItems: TimeSeriesData[];
  summary: {
    totalUsers: number;
    totalCapsules: number;
    totalItems: number;
    totalRecipients: number;
    totalLibraryItems: number;
  };
}

export class ChartJsHelper {
  static dataSetConfig = [
    { key: "capsules", labelKey: "dashboard.charts.capsules" },
    { key: "users", labelKey: "dashboard.charts.users" },
    { key: "items", labelKey: "dashboard.charts.items" },
    { key: "recipients", labelKey: "dashboard.charts.recipients" },
    { key: "libraryItems", labelKey: "dashboard.charts.libraryItems" },
  ];

  /**
   * Build Chart.js data structure with configurable cumulative mode
   * @param stats - Backend statistics data
   * @param cumulative - Whether to calculate cumulative totals
   */
  public static buildChartData(
    stats: ChartStatistics,
    cumulative: boolean = false,
  ): ChartData<"line"> {
    // Extract and translate labels
    const labels = stats.users?.map((item) => item.label) || [];
    // Define chart datasets configuration
    const datasetConfigs = this.dataSetConfig;
    // Build datasets using a for loop
    const datasets = [];
    for (const config of datasetConfigs) {
      const rawData =
        (stats[config.key as keyof ChartStatistics] as TimeSeriesData[]) || [];
      const data = cumulative
        ? this.calculateCumulative(rawData)
        : rawData.map((item) => item.count);
      datasets.push({
        label: config.labelKey,
        data,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    return { labels, datasets };
  }

  /**
   * Calculate cumulative sums for time series data
   */
  private static calculateCumulative(data: TimeSeriesData[]): number[] {
    if (!data || data.length === 0) return [];

    let cumulative = 0;
    return data.map((item) => {
      cumulative += item.count;
      return cumulative;
    });
  }

  /**
   * Get theme-specific colors for charts
   * @param theme - Current theme ('dark' | 'light')
   */
  public static getColors(theme: ThemeType): ChartColors {
    const isDark = theme === "dark";

    return {
      gridColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
      borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
      tickColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.87)",
      legendColor: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.87)",
      tooltipBackground: isDark
        ? "rgba(33, 37, 41, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      tooltipTitle: isDark ? "#ffffff" : "#000000",
      tooltipBody: isDark ? "#ffffff" : "#000000",
      tooltipBorder: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)",
      datasetColors: [
        "#4bc0c0", // Primary
        "#ff6384", // Secondary
        "#ff9f40", // Warning
        "#36a2eb", // Info
        "#9966ff", // Purple
        "#ffcd56", // Yellow
        "#4bc0c0", // Cyan (repeat for more datasets)
        "#c9cbcf", // Gray
      ],
    };
  }

  /**
   * Deep merge utility for combining nested configurations
   * @param target - Base object
   * @param source - Override object
   */
  public static deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key]) &&
          typeof source[key] !== "function"
        ) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Get layout and appearance options (responsive, scales, legend, tooltip)
   * This is what ChartJsHelper is responsible for
   */
  public static getLayoutAndAppearanceOptions(theme: ThemeType): any {
    const colors = this.getColors(theme);

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          grid: {
            color: colors.gridColor,
            borderColor: colors.borderColor,
          },
          ticks: {
            color: colors.tickColor,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            borderColor: colors.borderColor,
          },
          ticks: {
            color: colors.tickColor,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: colors.legendColor,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    };
  }
}

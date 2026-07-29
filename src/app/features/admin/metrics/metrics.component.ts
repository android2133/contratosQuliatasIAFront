import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData as ChartJsData } from 'chart.js';
import { catchError, forkJoin, map, of } from 'rxjs';
import {
  LucideRefreshCw, LucideMessagesSquare, LucideHash, LucideTimer,
  LucideTrendingUp, LucideCircleAlert, LucideArrowDownToLine, LucideArrowUpFromLine,
  LucideClock, LucideX, LucidePlus,
} from '@lucide/angular';
import { MetricsService } from '../../../core/services/metrics.service';
import { MetricasGlobales, MetricasOperador } from '../../../core/models/metrics.model';

const DEFAULT_OPERADORES = ['Web', 'Web 2', 'Operador 1'];

interface OperadorMetricas {
  operador: string;
  data: MetricasOperador | null;
}

@Component({
  selector: 'app-metrics',
  imports: [
    DecimalPipe,
    FormsModule,
    BaseChartDirective,
    LucideRefreshCw, LucideMessagesSquare, LucideHash, LucideTimer,
    LucideTrendingUp, LucideCircleAlert, LucideArrowDownToLine, LucideArrowUpFromLine,
    LucideClock, LucideX, LucidePlus,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Métricas</h1>
            <p class="inbox-page__subtitle">Actividad del servicio conversacional (GET /metricas-globales/)</p>
          </div>
          <button (click)="cargar()" [disabled]="loading()" class="btn-clear">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="loading()"></svg>
            Refrescar
          </button>
        </div>

        @if (error()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3"
            style="background: var(--color-danger-light); border: 1px solid rgba(239,68,68,.35)">
            <svg lucideCircleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
            <p class="text-sm" style="color: var(--color-danger)">
              No fue posible cargar las métricas globales. Intenta de nuevo más tarde.
            </p>
          </div>
        }

        <!-- ── Tarjetas KPI ── -->
        <div class="stat-grid">
          @if (loading()) {
            @for (i of [1, 2, 3, 4, 5, 6, 7]; track i) {
              <div class="stat-tile skeleton" style="height: 6.5rem"></div>
            }
          } @else if (globales()) {
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideMessagesSquare class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.total_conversaciones }}</span>
              <span class="stat-tile__label">Conversaciones</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideTrendingUp class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.consultas_realizadas }}</span>
              <span class="stat-tile__label">Consultas realizadas</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideArrowDownToLine class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.tokens_input | number }}</span>
              <span class="stat-tile__label">Tokens de entrada</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideArrowUpFromLine class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.tokens_output | number }}</span>
              <span class="stat-tile__label">Tokens de salida</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideHash class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.tokens_total | number }}</span>
              <span class="stat-tile__label">Tokens totales</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideClock class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.tiempo_total | number: '1.0-0' }}s</span>
              <span class="stat-tile__label">Tiempo total</span>
            </div>
            <div class="stat-tile">
              <span class="stat-tile__icon"><svg lucideTimer class="w-4 h-4"></svg></span>
              <span class="stat-tile__value">{{ globales()!.tiempo_promedio | number: '1.1-1' }}s</span>
              <span class="stat-tile__label">Tiempo promedio</span>
            </div>
          }
        </div>

        <!-- ── Volumen de conversaciones ── -->
        <div class="card">
          <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary); margin-bottom: 1rem">
            Volumen de conversaciones
          </h3>
          @if (loading()) {
            <div class="skeleton" style="height: 11rem"></div>
          } @else if (!globales() || globales()!.volumen_conversaciones.length === 0) {
            <p class="text-sm" style="color: var(--color-text-muted)">Sin datos de volumen disponibles.</p>
          } @else {
            <div style="height: 12rem; position: relative; width: 100%">
              <canvas baseChart [data]="volumenChartData" [options]="volumenChartOptions" [type]="volumenChartType"></canvas>
            </div>
          }
        </div>

        <!-- ── Operadores ── -->
        <div class="card">
          <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary); margin-bottom: 1rem">
            Operadores
          </h3>

          <div class="flex flex-wrap gap-2" style="margin-bottom: 1rem">
            @for (op of operadores(); track op) {
              <span class="folio-chip">
                {{ op }}
                <button type="button" (click)="quitarOperador(op)" title="Quitar operador"
                  style="display: inline-flex; align-items: center; background: transparent; border: none; cursor: pointer; color: inherit; padding: 0">
                  <svg lucideX class="w-3 h-3"></svg>
                </button>
              </span>
            }
          </div>

          <div class="flex gap-2">
            <input
              [ngModel]="nuevoOperador()"
              (ngModelChange)="nuevoOperador.set($event)"
              (keydown.enter)="agregarOperador()"
              placeholder="Nombre del operador a consultar"
              class="input-base"
              style="max-width: 20rem"
            />
            <button type="button" (click)="agregarOperador()"
              [disabled]="agregandoOperador() || !nuevoOperador().trim()"
              class="btn-primary-action" style="min-height: 40px">
              @if (agregandoOperador()) {
                <svg lucideRefreshCw class="w-4 h-4 animate-spin"></svg>
              } @else {
                <svg lucidePlus class="w-4 h-4"></svg>
              }
              Agregar
            </button>
          </div>
        </div>

        <!-- ── Comparativa por operador ── -->
        <div class="card">
          <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary); margin-bottom: .25rem">
            Comparativa por operador
          </h3>
          <p class="text-xs" style="color: var(--color-text-muted); margin-bottom: 1rem">
            Conversaciones, consultas, tokens y tiempo total, normalizados por eje (100% = el operador con mayor valor en esa métrica).
          </p>
          @if (loadingOperador()) {
            <div class="skeleton" style="height: 18rem"></div>
          } @else if (metricasPorOperador().length === 0) {
            <p class="text-sm" style="color: var(--color-text-muted)">Sin datos de operadores disponibles.</p>
          } @else {
            <div style="height: 19rem; position: relative; width: 100%">
              <canvas baseChart [data]="comparativaChartData" [options]="comparativaChartOptions" [type]="comparativaChartType"></canvas>
            </div>
          }
        </div>

        <!-- ── Métricas por operador ── -->
        @if (loadingOperador()) {
          <div class="card">
            <div class="stat-grid">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="stat-tile skeleton" style="height: 6.5rem"></div>
              }
            </div>
          </div>
        } @else {
          @for (item of metricasPorOperador(); track item.operador) {
            <div class="card">
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary); margin-bottom: 1rem">
                Tus métricas ({{ item.operador }})
              </h3>
              @if (item.data) {
                <div class="stat-grid">
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.conversaciones }}</span>
                    <span class="stat-tile__label">Conversaciones</span>
                  </div>
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.consultas }}</span>
                    <span class="stat-tile__label">Consultas</span>
                  </div>
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.tokens_input | number }}</span>
                    <span class="stat-tile__label">Tokens de entrada</span>
                  </div>
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.tokens_output | number }}</span>
                    <span class="stat-tile__label">Tokens de salida</span>
                  </div>
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.tokens_total | number }}</span>
                    <span class="stat-tile__label">Tokens totales</span>
                  </div>
                  <div class="stat-tile">
                    <span class="stat-tile__value">{{ item.data.tiempo_total | number: '1.0-0' }}s</span>
                    <span class="stat-tile__label">Tiempo total</span>
                  </div>
                </div>
              } @else {
                <p class="text-sm" style="color: var(--color-text-muted)">Sin métricas registradas para este operador.</p>
              }
            </div>
          }
        }

      </div>
    </div>
  `,
})
export class MetricsComponent implements OnInit {
  private readonly metricsService = inject(MetricsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly globales = signal<MetricasGlobales | null>(null);

  readonly operadores = signal<string[]>([...DEFAULT_OPERADORES]);
  readonly loadingOperador = signal(true);
  readonly metricasPorOperador = signal<OperadorMetricas[]>([]);

  readonly nuevoOperador = signal('');
  readonly agregandoOperador = signal(false);

  readonly volumenChartType = 'bar' as const;
  volumenChartData: ChartJsData<'bar'> = { labels: [], datasets: [] };
  volumenChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { border: { dash: [4, 4] }, grid: { color: '#e2e8f0' }, ticks: { precision: 0 } },
    },
  };

  private comparativaRawValues: number[][] = [];

  readonly comparativaChartType = 'radar' as const;
  comparativaChartData: ChartJsData<'radar'> = { labels: [], datasets: [] };
  comparativaChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = this.comparativaRawValues[ctx.datasetIndex]?.[ctx.dataIndex] ?? 0;
            const valor = Number.isInteger(raw) ? raw : raw.toFixed(1);
            return `${ctx.dataset.label}: ${valor}`;
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: '#e2e8f0' },
        pointLabels: { font: { size: 11 } },
      },
    },
  };

  ngOnInit(): void {
    this.cargar();
    this.cargarOperador();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);

    this.metricsService.obtenerGlobales().subscribe({
      next: (res) => {
        this.globales.set(res);
        const volumen = [...res.volumen_conversaciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
        this.volumenChartData = {
          labels: volumen.map((v) => v.fecha),
          datasets: [{
            data: volumen.map((v) => v.conversaciones),
            label: 'Conversaciones',
            backgroundColor: '#941B80',
            hoverBackgroundColor: '#6f145f',
            borderRadius: 6,
            barThickness: 24,
          }],
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private cargarOperador(): void {
    this.loadingOperador.set(true);
    const requests = this.operadores().map((operador) =>
      this.metricsService.obtenerPorOperador(operador).pipe(
        map((data): OperadorMetricas => ({ operador, data })),
        catchError(() => of<OperadorMetricas>({ operador, data: null })),
      ),
    );

    forkJoin(requests).subscribe((resultados) => {
      this.metricasPorOperador.set(resultados);
      this.buildComparativaChart(resultados);
      this.loadingOperador.set(false);
    });
  }

  agregarOperador(): void {
    const nombre = this.nuevoOperador().trim();
    if (!nombre || this.operadores().includes(nombre)) return;

    this.agregandoOperador.set(true);
    this.metricsService.obtenerPorOperador(nombre).pipe(
      map((data): OperadorMetricas => ({ operador: nombre, data })),
      catchError(() => of<OperadorMetricas>({ operador: nombre, data: null })),
    ).subscribe((resultado) => {
      this.operadores.update((ops) => [...ops, nombre]);
      const resultados = [...this.metricasPorOperador(), resultado];
      this.metricasPorOperador.set(resultados);
      this.buildComparativaChart(resultados);
      this.nuevoOperador.set('');
      this.agregandoOperador.set(false);
    });
  }

  quitarOperador(operador: string): void {
    this.operadores.update((ops) => ops.filter((o) => o !== operador));
    const resultados = this.metricasPorOperador().filter((r) => r.operador !== operador);
    this.metricasPorOperador.set(resultados);
    this.buildComparativaChart(resultados);
  }

  private buildComparativaChart(resultados: OperadorMetricas[]): void {
    const ejes: { label: string; valor: (d: MetricasOperador) => number }[] = [
      { label: 'Conversaciones', valor: (d) => d.conversaciones },
      { label: 'Consultas', valor: (d) => d.consultas },
      { label: 'Tokens de entrada', valor: (d) => d.tokens_input },
      { label: 'Tokens de salida', valor: (d) => d.tokens_output },
      { label: 'Tiempo total (s)', valor: (d) => d.tiempo_total },
    ];

    const valoresPorOperador = resultados.map((r) =>
      ejes.map((eje) => (r.data ? eje.valor(r.data) : 0)),
    );
    const maximoPorEje = ejes.map((_, i) =>
      Math.max(...valoresPorOperador.map((valores) => valores[i]), 1),
    );

    const colores = ['#941B80', '#0096AE', '#f59e0b', '#10b981'];

    this.comparativaRawValues = valoresPorOperador;
    this.comparativaChartData = {
      labels: ejes.map((eje) => eje.label),
      datasets: resultados.map((r, idx) => {
        const color = colores[idx % colores.length];
        return {
          label: r.operador,
          data: valoresPorOperador[idx].map((valor, i) => (valor / maximoPorEje[i]) * 100),
          backgroundColor: `${color}33`,
          borderColor: color,
          pointBackgroundColor: color,
          borderWidth: 2,
        };
      }),
    };
  }
}

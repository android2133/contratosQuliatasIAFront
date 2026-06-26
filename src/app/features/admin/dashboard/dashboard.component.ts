import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  LucideFileText, LucideMessageSquare, LucideUsers, LucideArrowUpRight,
  LucideArrowDownRight, LucideClock, LucideZap, LucideRefreshCw, LucideScrollText
} from '@lucide/angular';
import { CollectionsService } from '../../../core/services/collections.service';
import { SignedUrlItem } from '../../../core/models/collection.model';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  colorClass: string;
  bgClass: string;
  icon: 'file' | 'chat' | 'users' | 'zap' | 'scroll';
}

interface Activity {
  action: string;
  detail: string;
  time: string;
  type: 'upload' | 'chat' | 'system';
}

@Component({
  selector: 'app-dashboard',
  standalone: true, // Habilitado para soportar los imports directamente
  imports: [
    CommonModule, DecimalPipe,
    BaseChartDirective,
    LucideFileText, LucideMessageSquare, LucideUsers, LucideArrowUpRight,
    LucideArrowDownRight, LucideClock, LucideZap, LucideRefreshCw, LucideScrollText,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="max-w-6xl mx-auto px-6 py-8 space-y-6">

        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p class="text-slate-500 text-sm">
              @if (loading()) { Cargando datos... }
              @if (!loading() && !loadError()) { {{ docCount() }} documentos indexados en QUALITAS }
              @if (!loading() && loadError()) { <span class="text-red-500">{{ loadError() }}</span> }
            </p>
          </div>
          <button (click)="loadDocs()" [disabled]="loading()" class="btn-clear disabled:opacity-40 disabled:cursor-not-allowed">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="loading()"></svg>
            Refrescar
          </button>
        </div>

        <!-- Metric cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <div class="p-5 space-y-4 bg-white border border-slate-100 rounded-2xl">
                <div class="animate-pulse h-4 w-24 bg-slate-200 rounded"></div>
                <div class="animate-pulse h-8 w-16 bg-slate-200 rounded"></div>
                <div class="animate-pulse h-3 w-20 bg-slate-200 rounded"></div>
              </div>
            }
          } @else {
            @for (card of metrics(); track card.label) {
              <div class="p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <div class="flex items-start justify-between mb-4">
                  <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center ' + card.bgClass">
                    @if (card.icon === 'file')   { <svg lucideFileText   [class]="'w-5 h-5 ' + card.colorClass"></svg> }
                    @if (card.icon === 'chat')   { <svg lucideMessageSquare [class]="'w-5 h-5 ' + card.colorClass"></svg> }
                    @if (card.icon === 'users')  { <svg lucideUsers   [class]="'w-5 h-5 ' + card.colorClass"></svg> }
                    @if (card.icon === 'zap')    { <svg lucideZap     [class]="'w-5 h-5 ' + card.colorClass"></svg> }
                    @if (card.icon === 'scroll') { <svg lucideScrollText [class]="'w-5 h-5 ' + card.colorClass"></svg> }
                  </div>
                  <span class="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
                    [class.text-emerald-700]="card.changeType === 'up'"
                    [class.bg-emerald-50]="card.changeType === 'up'"
                    [class.text-red-700]="card.changeType === 'down'"
                    [class.bg-red-50]="card.changeType === 'down'"
                    [class.text-slate-600]="card.changeType === 'neutral'"
                    [class.bg-slate-100]="card.changeType === 'neutral'">
                    @if (card.changeType === 'up') { <svg lucideArrowUpRight class="w-3 h-3"></svg> }
                    @if (card.changeType === 'down') { <svg lucideArrowDownRight class="w-3 h-3"></svg> }
                    {{ card.change }}
                  </span>
                </div>
                <p class="text-2xl font-bold text-slate-900">{{ card.value }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ card.label }}</p>
              </div>
            }
          }
        </div>

        <!-- Charts row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Bar chart Dinámico -->
          <div class="p-5 bg-white border border-slate-100 rounded-2xl lg:col-span-2">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">Métricas de la plataforma</h3>
                <p class="text-xs text-slate-400 mt-0.5">Últimos 7 días</p>
              </div>
              <div class="flex gap-2">
                @for (tab of chartTabs; track tab) {
                  <button (click)="activeChart.set(tab)"
                    class="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    [class.bg-accent-500]="activeChart() === tab"
                    [class.text-white]="activeChart() === tab"
                    [class.text-slate-500]="activeChart() !== tab"
                    [class.hover:bg-slate-100]="activeChart() !== tab">
                    {{ tab }}
                  </button>
                }
              </div>
            </div>
            
            <!-- Canvas contenedor de la gráfica espectacular -->
            <div class="h-44 relative w-full">
              <canvas baseChart
                [data]="chartData"
                [options]="chartOptions"
                [type]="chartType">
              </canvas>
            </div>
          </div>

          <!-- System stats -->
          <div class="p-5 bg-white border border-slate-100 rounded-2xl">
            <h3 class="text-sm font-semibold text-slate-900 mb-4">Estado del Sistema</h3>
            <div class="space-y-4">
              @for (stat of systemStats; track stat.label) {
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-slate-600">{{ stat.label }}</span>
                    <span class="text-xs font-semibold text-slate-900">{{ stat.value }}%</span>
                  </div>
                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700" [class]="stat.color" [style.width.%]="stat.value"></div>
                  </div>
                </div>
              }
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div class="flex items-center gap-2 text-xs">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-slate-600">Todos los servicios operativos</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-400">
                <svg lucideClock class="w-3.5 h-3.5"></svg>
                <span>Última revisión: hace 2 min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Contratos charts row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Tendencia semanal de contratos -->
          <div class="p-5 bg-white border border-slate-100 rounded-2xl lg:col-span-2">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">Contratos generados</h3>
                <p class="text-xs text-slate-400 mt-0.5">Tendencia semanal</p>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full" style="background: var(--color-primary-light); color: var(--color-primary)">
                {{ contractCount() }} total
              </span>
            </div>
            <div class="h-44 relative w-full">
              <canvas baseChart
                [data]="contractsTrendData"
                [options]="contractsTrendOptions"
                [type]="contractsTrendType">
              </canvas>
            </div>
          </div>

          <!-- Distribución documentos (dona) -->
          <div class="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col">
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Distribución</h3>
            <p class="text-xs text-slate-400 mb-4">Contratos vs otros documentos</p>

            <div class="relative h-36 w-full">
              <canvas baseChart
                [data]="donutData"
                [options]="donutOptions"
                [type]="donutType">
              </canvas>
              <!-- Etiqueta central -->
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p class="text-xl font-bold text-slate-900">
                  @if (docCount() > 0) { {{ ((contractCount() / docCount()) * 100) | number:'1.0-0' }}% }
                  @if (docCount() === 0) { — }
                </p>
                <p class="text-xs text-slate-400">contratos</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: var(--color-primary)"></span>
                  <span class="text-slate-600">Contratos</span>
                </div>
                <span class="font-semibold text-slate-900">{{ contractCount() }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: var(--color-secondary)"></span>
                  <span class="text-slate-600">Otros documentos</span>
                </div>
                <span class="font-semibold text-slate-900">{{ docCount() - contractCount() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="p-5 bg-white border border-slate-100 rounded-2xl">
          <h3 class="text-sm font-semibold text-slate-900 mb-4">Documentos Indexados</h3>
          <div class="space-y-1">
            @if (loading()) {
              @for (i of [1,2,3,4,5]; track i) {
                <div class="flex items-center gap-3 px-3 py-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 bg-slate-100 rounded animate-pulse w-3/5"></div>
                    <div class="h-2.5 bg-slate-100 rounded animate-pulse w-2/5"></div>
                  </div>
                </div>
              }
            }
            @if (!loading() && recentActivity().length === 0) {
              <p class="text-sm text-slate-400 text-center py-8">No hay documentos indexados aún.</p>
            }
            @for (act of recentActivity(); track act.detail) {
              <div class="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  [class.bg-blue-50]="act.type === 'upload'"
                  [class.bg-indigo-50]="act.type === 'chat'"
                  [class.bg-slate-100]="act.type === 'system'">
                  @if (act.type === 'upload') { <svg lucideFileText class="w-4 h-4 text-blue-600"></svg> }
                  @if (act.type === 'chat') { <svg lucideMessageSquare class="w-4 h-4 text-indigo-600"></svg> }
                  @if (act.type === 'system') { <svg lucideZap class="w-4 h-4 text-slate-500"></svg> }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900">{{ act.action }}</p>
                  <p class="text-xs text-slate-500 mt-0.5 truncate">{{ act.detail }}</p>
                </div>
                <span class="text-xs text-slate-400 shrink-0">{{ act.time }}</span>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly svc = inject(CollectionsService);

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly docCount = signal(0);
  readonly activeChart = signal('Chat');
  readonly chartTabs = ['Chat', 'Uploads'];

  // ── Gráfica principal (actividad semanal) ─────────────────────────────────
  public chartType: ChartType = 'bar';
  public chartData!: ChartData<'bar'>;
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        border: { dash: [4, 4] },
        grid: { color: '#e2e8f0' },
        ticks: { stepSize: 20 },
      },
    },
  };

  private readonly dataSets: Record<string, number[]> = {
    Chat:    [60, 85, 45, 92, 70, 30, 20],
    Uploads: [30, 40, 75, 50, 95, 40, 60],
  };

  // ── Gráfica tendencia contratos (barras, 6 semanas mock) ──────────────────
  public contractsTrendType: ChartType = 'bar';
  public contractsTrendData: ChartData<'bar'> = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    datasets: [{
      label: 'Contratos',
      data: [3, 7, 5, 12, 9, 14],
      backgroundColor:      '#941B80',
      hoverBackgroundColor: '#6f145f',
      borderRadius: 6,
      barThickness: 28,
    }],
  };
  public contractsTrendOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        border: { dash: [4, 4] },
        grid: { color: '#e2e8f0' },
        ticks: { stepSize: 5, precision: 0 },
      },
    },
  };

  // ── Gráfica distribución documentos (dona, datos reales) ─────────────────
  public readonly donutType = 'doughnut' as const;
  public donutData: ChartData<'doughnut'> = {
    labels: ['Contratos', 'Otros'],
    datasets: [{ data: [0, 1], backgroundColor: ['#941B80', '#e5e7eb'], borderWidth: 0 }],
  };
  public donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false } },
  };

  readonly contractCount = signal(0);

  readonly metrics = signal<MetricCard[]>([
    { label: 'Documentos indexados', value: '—', change: 'API', changeType: 'neutral', icon: 'file', colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
    { label: 'Contratos generados', value: '—', change: 'API', changeType: 'neutral', icon: 'scroll', colorClass: 'text-violet-600', bgClass: 'bg-violet-50' },
    { label: 'Consultas de chat', value: '3,842', change: '+28%', changeType: 'up', icon: 'chat', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50' },
    { label: 'Usuarios activos', value: '24', change: '+3', changeType: 'up', icon: 'users', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
    { label: 'Tiempo de respuesta', value: '1.2s', change: '-18%', changeType: 'up', icon: 'zap', colorClass: 'text-amber-600', bgClass: 'bg-amber-50' },
  ]);

  readonly systemStats = [
    { label: 'Almacenamiento', value: 67, color: 'bg-indigo-500' },
    { label: 'CPU del modelo', value: 42, color: 'bg-emerald-500' },
    { label: 'Cache de vectores', value: 81, color: 'bg-amber-500' },
  ];

  readonly recentActivity = signal<Activity[]>([]);

  constructor() {
    effect(() => this.updateChartData(this.activeChart()));
  }

  ngOnInit(): void {
    this.loadDocs();
  }

  loadDocs(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.svc.getDocuments(
      '019eefcc-31a5-732c-8f42-e7e633dad131',
      'webcontent/TEST1/019eefca-bc2d-75b9-a4cc-c319e7fa1064/019eefcc-31a5-732c-8f42-e7e633dad131/',
    ).subscribe({
      next: (items: SignedUrlItem[]) => {
        this.docCount.set(items.length);

        // Conteo de contratos: docs cuyo nombre, label o tipo contienen "contrato"
        const contracts = items.filter((item) => {
          const haystack = [item.nombre, item.labelTipoDocumental, item.nombreTipoDocumental]
            .join(' ').toLowerCase();
          return haystack.includes('contrato');
        });
        const contractCount = contracts.length;
        const othersCount   = items.length - contractCount;

        this.contractCount.set(contractCount);

        // Actualiza dona con distribución real
        this.donutData = {
          labels: ['Contratos', 'Otros'],
          datasets: [{
            data: [contractCount, othersCount],
            backgroundColor:      ['#941B80', '#0096AE'],
            hoverBackgroundColor: ['#6f145f', '#016F95'],
            borderWidth: 0,
          }],
        };

        // Actualiza tarjetas con datos reales
        this.metrics.update(cards =>
          cards.map(c => {
            if (c.icon === 'file')
              return { ...c, value: items.length.toString(), change: '', changeType: 'neutral' as const };
            if (c.icon === 'scroll')
              return { ...c, value: contractCount.toString(), change: '', changeType: 'neutral' as const };
            return c;
          }),
        );

        // Lista de docs reales como actividad reciente (máx 8)
        this.recentActivity.set(
          items.slice(0, 8).map((item) => ({
            action: item.nombre ?? `${item.archivo}.${item.extension}`,
            detail: `${item.labelTipoDocumental ?? item.extension?.toUpperCase() ?? 'DOC'} · ${item.extension?.toUpperCase() ?? ''}`,
            time: item.metadata?.fecha_creacion
              ? new Date(item.metadata.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—',
            type: 'upload' as const,
          })),
        );

        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err?.message ?? 'Error al cargar documentos');
        this.loading.set(false);
      },
    });
  }

  private updateChartData(tab: string): void {
    this.chartData = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        data: this.dataSets[tab],
        backgroundColor: '#941B80',
        hoverBackgroundColor: '#6f145f',
        borderRadius: 6,
        barThickness: 24,
      }],
    };
  }
}
import {
  Component, signal, computed, inject, ViewChild, ElementRef,
  AfterViewChecked, OnInit, ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import {
  LucideSend, LucidePaperclip, LucideX, LucideBot, LucideUser,
  LucideFileText, LucideSparkles, LucideRefreshCw, LucideCopy, LucideCheck,
  LucideCircleQuestionMark, LucideMessageCircleQuestion, LucideSettings, LucideHistory,
  LucideTriangleAlert, LucideChevronLeft, LucideChevronRight, LucideDownload,
} from '@lucide/angular';
import { Message, AttachedFile, TableData, ChartData } from '../../../core/models/message.model';
import { PreguntaFrecuente } from '../../../core/models/faq.model';
import { InstruccionSistema } from '../../../core/models/instruccion-sistema.model';
import { Operador } from '../../../core/models/operador.model';
import { Conversacion, ConversacionDetalle } from '../../../core/models/conversacion.model';
import { ChatService, Documento } from '../../../core/services/chat.service';
import { FaqService } from '../../../core/services/faq.service';
import { InstruccionesSistemaService } from '../../../core/services/instrucciones-sistema.service';
import { OperadoresService } from '../../../core/services/operadores.service';
import { marked } from 'marked';

const PAGE_SIZE_HISTORIAL = 8;

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule, DecimalPipe,
    LucideSend, LucidePaperclip, LucideX, LucideBot, LucideUser,
    LucideFileText, LucideSparkles, LucideRefreshCw, LucideCopy, LucideCheck,
    LucideCircleQuestionMark, LucideMessageCircleQuestion, LucideSettings, LucideHistory,
    LucideTriangleAlert, LucideChevronLeft, LucideChevronRight, LucideDownload,
  ],
  template: `
    <div class="relative flex flex-col h-full" style="background: var(--color-bg)">

      <!-- Chat header -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0" style="background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: relative">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: var(--color-primary); box-shadow: 0 2px 8px rgba(148,27,128,.25)">
            <svg lucideSparkles class="w-4 h-4 text-white"></svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900">Agente de contratos</p>
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p class="text-xs text-slate-400">En línea · Base de conocimientos activa</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          @if (conversationId()) {
            <span class="folio-chip" title="ID de la conversación" (click)="copyConversationId()">
              @if (copiedFolio()) {
                <svg lucideCheck class="w-3 h-3"></svg>
                Copiado
              } @else {
                {{ conversationId() }}
              }
            </span>
          }
          <button (click)="toggleHistorial()" class="icon-button" type="button"
            [class.active]="showHistorialPanel()" title="Historial de conversaciones">
            <svg lucideHistory class="w-4 h-4"></svg>
          </button>
          <button (click)="toggleSettings()" class="icon-button" type="button"
            [class.active]="showSettingsPanel()" title="Configurar operador y contexto">
            <svg lucideSettings class="w-4 h-4"></svg>
          </button>
          <button (click)="clearChat()" class="secondary-button" type="button" style="min-height: 34px; font-size: var(--font-size-xs); gap: .35rem; padding: 0 .75rem">
            <svg lucideRefreshCw class="w-3.5 h-3.5"></svg>
            Nueva conversación
          </button>
        </div>

        @if (showSettingsPanel()) {
          <div style="position: absolute; top: 100%; right: 1.5rem; z-index: 20; width: 22rem; margin-top: .5rem;
                      background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
                      box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,.12)); padding: 1rem">
            <div class="flex items-center justify-between" style="margin-bottom: .75rem">
              <p style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Configuración del agente
              </p>
              <button (click)="showSettingsPanel.set(false)" class="icon-button" type="button" title="Cerrar">
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>

            <label style="display: block; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-secondary); margin-bottom: .3rem">
              Operador
            </label>
            @if (operadoresDisponibles().length > 0) {
              <select
                [ngModel]="operador()"
                (ngModelChange)="operador.set($event)"
                class="input-base"
                style="margin-bottom: .85rem"
              >
                @for (op of operadoresDisponibles(); track op.operador) {
                  <option [ngValue]="op.operador">{{ op.operador }}</option>
                }
              </select>
            } @else {
              <input
                [ngModel]="operador()"
                (ngModelChange)="operador.set($event)"
                class="input-base"
                placeholder="Nombre del operador"
                style="margin-bottom: .85rem"
              />
            }

            <label style="display: block; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-secondary); margin-bottom: .3rem">
              Modelo
            </label>
            <select
              [ngModel]="modelo()"
              (ngModelChange)="modelo.set($event)"
              class="input-base"
              style="margin-bottom: .85rem"
            >
              @for (m of modelosDisponibles; track m) {
                <option [ngValue]="m">{{ m }}</option>
              }
            </select>

            <label style="display: block; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-secondary); margin-bottom: .3rem">
              Contexto del agente
            </label>

            @if (instruccionesDisponibles().length > 0) {
              <div style="display: flex; flex-direction: column; gap: .3rem; max-height: 11rem; overflow-y: auto;
                          border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: .35rem;
                          margin-bottom: .5rem">
                @for (item of instruccionesDisponibles(); track item.idInstruccion) {
                  <button
                    type="button"
                    (click)="onSeleccionarInstruccion(item.idInstruccion)"
                    style="text-align: left; border-radius: var(--radius-md); padding: .4rem .55rem; cursor: pointer;
                           font-family: var(--font-family); border: 1px solid transparent"
                    [style.background]="selectedInstruccionId() === item.idInstruccion ? 'var(--color-primary-subtle)' : 'transparent'"
                    [style.border-color]="selectedInstruccionId() === item.idInstruccion ? 'var(--color-primary-light)' : 'transparent'"
                  >
                    <p style="margin: 0; font-size: var(--font-size-xs); line-height: 1.4;
                              color: var(--color-text-primary); display: -webkit-box; -webkit-line-clamp: 3;
                              -webkit-box-orient: vertical; overflow: hidden">
                      {{ item.instruccionesSistema }}
                    </p>
                  </button>
                }
              </div>
            }

            <textarea
              [ngModel]="instrucciones()"
              (ngModelChange)="onInstruccionesInput($event)"
              class="input-base"
              rows="6"
              placeholder="Instrucciones del sistema para el agente..."
              style="resize: vertical; font-family: var(--font-family)"
            ></textarea>
          </div>
        }

        @if (showHistorialPanel()) {
          <div style="position: absolute; top: 100%; right: 1.5rem; z-index: 20; width: 26rem; margin-top: .5rem;
                      background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
                      box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,.12)); padding: 1rem; display: flex; flex-direction: column">
            <div class="flex items-center justify-between" style="margin-bottom: .75rem">
              <p style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Historial ({{ operador() }})
              </p>
              <button (click)="showHistorialPanel.set(false)" class="icon-button" type="button" title="Cerrar">
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>

            @if (historialLoading()) {
              <div class="flex flex-col gap-2">
                @for (i of [0, 1, 2]; track i) {
                  <div class="skeleton" style="height: 3.75rem; border-radius: var(--radius-md)"></div>
                }
              </div>
            } @else if (historialError()) {
              <div class="flex items-center gap-2" style="padding: .5rem 0">
                <svg lucideTriangleAlert class="w-4 h-4 shrink-0" style="color: var(--color-danger)"></svg>
                <p style="font-size: var(--font-size-xs); color: var(--color-danger)">
                  No fue posible cargar el historial de este operador.
                </p>
              </div>
            } @else if (historialConversaciones().length === 0) {
              <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
                Este operador no tiene conversaciones registradas.
              </p>
            } @else {
              <div style="display: flex; flex-direction: column; gap: .35rem; max-height: 22rem; overflow-y: auto">
                @for (conv of paginatedHistorial(); track conv.conversationId) {
                  <button
                    type="button"
                    (click)="retomarConversacion(conv)"
                    style="text-align: left; border-radius: var(--radius-md); padding: .5rem .6rem; cursor: pointer;
                           font-family: var(--font-family); border: 1px solid var(--color-border); background: transparent"
                  >
                    <p style="margin: 0 0 .25rem; font-size: var(--font-size-xs); line-height: 1.4;
                              color: var(--color-text-primary); display: -webkit-box; -webkit-line-clamp: 2;
                              -webkit-box-orient: vertical; overflow: hidden">
                      {{ conv.tituloConversacion }}
                    </p>
                    <div class="flex items-center gap-2" style="font-size: 0.68rem; color: var(--color-text-muted)">
                      <span>{{ formatDateTime(conv.inicio) }}</span>
                      <span>·</span>
                      <span>{{ conv.consultasRealizadas }} {{ conv.consultasRealizadas === 1 ? 'consulta' : 'consultas' }}</span>
                      <span>·</span>
                      <span>{{ conv.tokensTotal | number }} tokens</span>
                    </div>
                  </button>
                }
              </div>

              @if (totalPagesHistorial() > 1) {
                <div class="flex items-center justify-between" style="margin-top: .6rem; padding-top: .6rem; border-top: 1px solid var(--color-border)">
                  <span style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
                    Página {{ currentPageHistorial() }} de {{ totalPagesHistorial() }}
                  </span>
                  <div class="flex items-center gap-1">
                    <button class="pagination__btn" [disabled]="currentPageHistorial() === 1" (click)="prevPageHistorial()">
                      <svg lucideChevronLeft class="w-3.5 h-3.5"></svg>
                    </button>
                    <button class="pagination__btn" [disabled]="currentPageHistorial() === totalPagesHistorial()" (click)="nextPageHistorial()">
                      <svg lucideChevronRight class="w-3.5 h-3.5"></svg>
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>

      <!-- Messages -->
      <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        @if (retomarLoading()) {
          <div class="flex flex-col gap-4">
            @for (i of [0, 1, 2]; track i) {
              <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div class="flex-1 max-w-2xl bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-2">
                  <div class="skeleton h-3 w-3/4"></div>
                  <div class="skeleton h-3 w-1/2"></div>
                </div>
              </div>
            }
          </div>
        }
        @for (msg of messages(); track msg.id) {

          @if (msg.role === 'user') {
            <div class="flex justify-end gap-3">
              <div class="max-w-[80%] space-y-2">
                @if (msg.attachments && msg.attachments.length > 0) {
                  <div class="flex flex-wrap gap-2 justify-end">
                    @for (att of msg.attachments; track att.id) {
                      <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <div class="w-6 h-6 rounded-md bg-accent-50 flex items-center justify-center">
                          <svg lucideFileText class="w-3.5 h-3.5 text-accent-600"></svg>
                        </div>
                        <div>
                          <p class="text-xs font-medium text-slate-800 truncate max-w-32">{{ att.name }}</p>
                          <p class="text-xs text-slate-400">{{ formatSize(att.size) }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (msg.content) {
                  <div class="bg-accent-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                    <p class="text-sm leading-relaxed">{{ msg.content }}</p>
                  </div>
                }
                <p class="text-right text-xs text-slate-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
              <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                <svg lucideUser class="w-4 h-4 text-slate-500"></svg>
              </div>
            </div>

          } @else {
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style="background: var(--color-primary)">
                <svg lucideBot class="w-4 h-4 text-white"></svg>
              </div>

              @if (msg.isLoading) {
                <div class="flex-1 max-w-2xl bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-3">
                  <div class="skeleton h-3 w-3/4"></div>
                  <div class="skeleton h-3 w-1/2"></div>
                  <div class="skeleton h-3 w-5/6"></div>
                  <div class="flex gap-2 pt-1">
                    <div class="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              } @else {
                <div class="flex-1 max-w-2xl space-y-2">
                  <div class="bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">

                    @if (msg.content) {
                      <div class="px-4 pt-4 pb-2">
                        @if (msg.contentType === 'markdown' || msg.contentType === 'text') {
                          <div class="prose prose-sm prose-slate max-w-none
                                      prose-headings:font-semibold prose-headings:text-slate-900
                                      prose-p:text-slate-700 prose-p:leading-relaxed
                                      prose-strong:text-slate-900 prose-li:text-slate-700
                                      prose-blockquote:text-slate-500 prose-blockquote:border-accent-400
                                      prose-code:text-accent-700 prose-code:bg-accent-50 prose-code:rounded prose-code:px-1"
                            [innerHTML]="renderMarkdown(msg.content)"></div>
                        }
                      </div>
                    }

                    <!-- Table -->
                    @if (msg.tableData) {
                      <div class="px-4 pb-4 overflow-x-auto">
                        <table class="w-full text-sm border-collapse">
                          <thead>
                            <tr class="border-b border-slate-200">
                              @for (header of msg.tableData.headers; track header) {
                                <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 pr-4 last:pr-0">
                                  {{ header }}
                                </th>
                              }
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100">
                            @for (row of msg.tableData.rows; track $index) {
                              <tr class="hover:bg-slate-50 transition-colors">
                                @for (cell of row; track $index) {
                                  <td class="py-2.5 pr-4 last:pr-0 text-sm text-slate-700">{{ cell }}</td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }

                    <!-- Chart (horizontal bar) -->
                    @if (msg.chartData) {
                      <div class="px-4 pb-4">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          {{ msg.chartData.label }}
                        </p>
                        <div class="space-y-2.5">
                          @for (label of msg.chartData.labels; track label; let i = $index) {
                            <div class="flex items-center gap-3">
                              <span class="text-xs text-slate-500 w-10 text-right shrink-0">{{ label }}</span>
                              <div class="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                                <div class="h-full rounded-lg bg-gradient-to-r from-accent-500 to-purple-500
                                            flex items-center justify-end pr-2 transition-all duration-700"
                                  [style.width.%]="(msg.chartData!.values[i] / maxChartValue(msg.chartData!)) * 100">
                                  <span class="text-xs text-white font-semibold">{{ msg.chartData!.values[i] }}</span>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Documento generado -->
                    @if (msg.documento) {
                      <div class="px-4 pb-4">
                        <button (click)="downloadDocument(msg.documento)" type="button"
                          class="flex items-center gap-3 w-full text-left bg-accent-50 border border-accent-200 rounded-xl px-3 py-2.5 hover:bg-accent-100 transition-colors">
                          <div class="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                            <svg lucideFileText class="w-4 h-4 text-accent-600"></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-slate-800 truncate">{{ msg.documento.nombre }}</p>
                            <p class="text-xs text-slate-400">Toca para descargar</p>
                          </div>
                          <svg lucideDownload class="w-4 h-4 text-accent-600 shrink-0"></svg>
                        </button>
                      </div>
                    }

                    <!-- Footer actions -->
                    <div class="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                      <button (click)="copyMessage(msg)"
                        class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded-md hover:bg-slate-100">
                        @if (copiedId() === msg.id) {
                          <svg lucideCheck class="w-3.5 h-3.5"></svg>
                          Copiado
                        } @else {
                          <svg lucideCopy class="w-3.5 h-3.5"></svg>
                          Copiar
                        }
                      </button>
                      <span class="text-slate-200">·</span>
                      <span class="text-xs text-slate-400">{{ formatTime(msg.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }

        <div #scrollAnchor></div>
      </div>

      <!-- Attached files -->
      @if (attachedFiles().length > 0) {
        <div class="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-2">
          @for (file of attachedFiles(); track file.id) {
            <div class="flex items-center gap-2 bg-accent-50 border border-accent-200 rounded-xl px-3 py-1.5">
              <svg lucideFileText class="w-3.5 h-3.5 text-accent-600 shrink-0"></svg>
              <span class="text-xs font-medium text-accent-800 truncate max-w-32">{{ file.name }}</span>
              <button (click)="removeFile(file.id)" class="text-accent-500 hover:text-accent-800 transition-colors">
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>
          }
        </div>
      }

      <!-- Input -->
      <div class="relative px-4 pb-4 pt-2 shrink-0" style="background: var(--color-surface); border-top: 1px solid var(--color-border)">

        @if (showFaqPanel()) {
          <div class="faq-quickpanel" role="listbox">
            <div class="faq-quickpanel__header">
              <div>
                <p class="faq-quickpanel__title">Preguntas frecuentes</p>
                <p class="faq-quickpanel__subtitle">Elige una para insertarla en tu mensaje</p>
              </div>
              <button (click)="showFaqPanel.set(false)" class="faq-quickpanel__close" type="button" title="Cerrar">
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>
            <div class="faq-quickpanel__list">
              @for (item of preguntasFrecuentes(); track item.pregunta) {
                <button type="button" (click)="usarPreguntaFrecuente(item.pregunta)" class="faq-quickpanel__item">
                  <svg lucideMessageCircleQuestion class="faq-quickpanel__item-icon"></svg>
                  <span>{{ item.pregunta }}</span>
                </button>
              }
            </div>
          </div>
        }

        <div class="relative flex items-end gap-2 bg-white border border-slate-200 rounded-2xl shadow-sm
                    focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/20
                    transition-all duration-200 px-4 py-3">
          <button (click)="showFaqPanel.set(!showFaqPanel())" class="icon-button shrink-0 mb-0.5"
            [class.active]="showFaqPanel()" title="Preguntas frecuentes">
            <svg lucideCircleQuestionMark class="w-4 h-4"></svg>
          </button>

          <button (click)="triggerAttachment()" class="icon-button shrink-0 mb-0.5" title="Adjuntar archivo">
            <svg lucidePaperclip class="w-4 h-4"></svg>
          </button>

          <input #attachInput type="file" multiple class="hidden" (change)="onFileAttached($event)" />

          <textarea #messageInput [ngModel]="inputText()" (ngModelChange)="inputText.set($event)" (keydown.enter)="onEnter($event)" (input)="autoResize($event)"
            placeholder="Escribe tu mensaje... (Enter para enviar)"
            rows="1"
            class="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400
                   focus:outline-none leading-relaxed min-h-[24px] max-h-40 py-0.5"></textarea>

          <button (click)="sendMessage()" [disabled]="!canSend()"
            class="assistant-send-btn mb-0.5"
            [class.active]="canSend()">
            <svg lucideSend class="w-4 h-4"></svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements AfterViewChecked, OnInit {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLTextAreaElement>;

  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private chatService = inject(ChatService);
  private faqService = inject(FaqService);
  private instruccionesSistemaService = inject(InstruccionesSistemaService);
  private operadoresService = inject(OperadoresService);

  readonly messages = signal<Message[]>([]);
  readonly attachedFiles = signal<AttachedFile[]>([]);
  readonly copiedId = signal<string | null>(null);

  readonly preguntasFrecuentes = signal<PreguntaFrecuente[]>([]);
  readonly showFaqPanel = signal(false);

  readonly conversationId = this.chatService.conversationId;
  readonly operador = this.chatService.operador;
  readonly modelo = this.chatService.modelo;
  readonly modelosDisponibles = this.chatService.modelosDisponibles;
  readonly instrucciones = this.chatService.instrucciones;
  readonly showSettingsPanel = signal(false);
  readonly copiedFolio = signal(false);

  readonly instruccionesDisponibles = signal<InstruccionSistema[]>([]);
  readonly selectedInstruccionId = signal<number | null>(null);

  readonly operadoresDisponibles = signal<Operador[]>([]);

  readonly showHistorialPanel = signal(false);
  readonly historialLoading = signal(false);
  readonly historialError = signal(false);
  readonly historialConversaciones = signal<Conversacion[]>([]);
  readonly retomarLoading = signal(false);

  readonly currentPageHistorial = signal(1);
  readonly totalPagesHistorial = computed(() =>
    Math.max(1, Math.ceil(this.historialConversaciones().length / PAGE_SIZE_HISTORIAL)),
  );
  readonly paginatedHistorial = computed(() =>
    this.historialConversaciones().slice(
      (this.currentPageHistorial() - 1) * PAGE_SIZE_HISTORIAL,
      this.currentPageHistorial() * PAGE_SIZE_HISTORIAL,
    ),
  );

  readonly inputText = signal('');
  private shouldScroll = false;

  readonly canSend = computed(() => this.inputText().trim().length > 0);

  ngOnInit(): void {
    this.faqService.obtener().subscribe({
      next: (preguntas) => this.preguntasFrecuentes.set(preguntas),
      error: () => this.preguntasFrecuentes.set([]),
    });
    this.operadoresService.listar().subscribe({
      next: (items) => this.operadoresDisponibles.set(items),
      error: () => this.operadoresDisponibles.set([]),
    });
    this.instruccionesSistemaService.listar().subscribe({
      next: (items) => {
        this.instruccionesDisponibles.set(items);
        if (items.length > 0) this.onSeleccionarInstruccion(items[0].idInstruccion);
        this.startChat();
      },
      error: () => {
        this.instruccionesDisponibles.set([]);
        this.startChat();
      },
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  onEnter(e: Event): void {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey && !ke.ctrlKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(e: Event): void {
    const ta = e.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }

  sendMessage(): void {
    if (!this.canSend()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: this.inputText().trim(),
      contentType: 'text',
      timestamp: new Date(),
      attachments: this.attachedFiles().length > 0 ? [...this.attachedFiles()] : undefined,
    };

    this.messages.update(m => [...m, userMsg]);
    const userInput = this.inputText();
    const filesSnapshot = this.attachedFiles();
    this.inputText.set('');
    this.attachedFiles.set([]);
    this.shouldScroll = true;

    const contenidos = filesSnapshot
      .filter((f: AttachedFile) => !!f.base64)
      .map((f: AttachedFile) => ({ mimetype: f.type, uri: f.base64!, nombreArchivo: f.name }));

    this.callChatApi(userInput, contenidos);
  }

  private callChatApi(userInput: string, contenidos: { mimetype: string; uri: string; nombreArchivo: string }[] = []): void {
    const loadingId = crypto.randomUUID();
    this.messages.update(m => [...m, {
      id: loadingId, role: 'assistant', content: '', contentType: 'text',
      timestamp: new Date(), isLoading: true,
    }]);
    this.shouldScroll = true;

    this.chatService.send(userInput, contenidos, this.selectedInstruccionId()).subscribe({
      next: (res) => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === loadingId
            ? { ...m, content: res.respuesta, contentType: 'markdown', isLoading: false, citas: res.citas, documento: res.documento }
            : m)
        );
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        const errMsg = err?.message ?? 'Error desconocido al conectar con el asistente.';
        this.messages.update(msgs =>
          msgs.map(m => m.id === loadingId
            ? { ...m, content: `**Error:** ${errMsg}`, contentType: 'markdown', isLoading: false }
            : m)
        );
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
    });
  }

  private startChat(): void {
    this.chatService.resetConversacion();
    this.messages.set([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '¡Hola! Soy tu agente de contratos. Puedo ayudarte a generar, analizar o resolver dudas sobre contratos y anexos. ¿En qué puedo ayudarte hoy?',
      contentType: 'markdown',
      timestamp: new Date(),
    }]);
    this.shouldScroll = true;
  }

  onSeleccionarInstruccion(idInstruccion: number | null): void {
    this.selectedInstruccionId.set(idInstruccion);
    if (idInstruccion === null) return;
    const item = this.instruccionesDisponibles().find((it) => it.idInstruccion === idInstruccion);
    if (item) this.instrucciones.set(item.instruccionesSistema);
  }

  onInstruccionesInput(value: string): void {
    this.instrucciones.set(value);
    this.selectedInstruccionId.set(null);
  }

  toggleSettings(): void {
    this.showHistorialPanel.set(false);
    this.showSettingsPanel.set(!this.showSettingsPanel());
  }

  toggleHistorial(): void {
    this.showSettingsPanel.set(false);
    const next = !this.showHistorialPanel();
    this.showHistorialPanel.set(next);
    if (next) this.cargarHistorial();
  }

  private cargarHistorial(): void {
    this.historialLoading.set(true);
    this.historialError.set(false);
    this.currentPageHistorial.set(1);
    this.operadoresService.listarConversaciones(this.operador()).subscribe({
      next: (conversaciones) => {
        this.historialConversaciones.set(conversaciones);
        this.historialLoading.set(false);
      },
      error: () => {
        this.historialConversaciones.set([]);
        this.historialError.set(true);
        this.historialLoading.set(false);
      },
    });
  }

  retomarConversacion(conv: Conversacion): void {
    this.showHistorialPanel.set(false);
    this.messages.set([]);
    this.retomarLoading.set(true);
    this.shouldScroll = true;

    this.operadoresService.obtenerConversacion(conv.conversationId).subscribe({
      next: (detalle) => {
        this.chatService.resumirConversacion(detalle.conversationId);
        this.messages.set(this.mapHistorialAMensajes(detalle));
        this.retomarLoading.set(false);
        this.shouldScroll = true;
        setTimeout(() => this.messageInput?.nativeElement.focus(), 0);
      },
      error: () => {
        // Fallback: si el historial detallado no está disponible, al menos
        // dejamos la conversación lista para continuar desde el conversationId.
        this.chatService.resumirConversacion(conv.conversationId);
        this.messages.set([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `**Continuando conversación** del ${this.formatDateTime(conv.inicio)}\n\n${conv.tituloConversacion}\n\n_No fue posible recuperar el historial detallado._`,
          contentType: 'markdown',
          timestamp: new Date(),
        }]);
        this.retomarLoading.set(false);
        this.shouldScroll = true;
        setTimeout(() => this.messageInput?.nativeElement.focus(), 0);
      },
    });
  }

  private mapHistorialAMensajes(detalle: ConversacionDetalle): Message[] {
    return detalle.historial.map((item) => {
      const role = item.role === 'model' ? 'assistant' : 'user';
      const texto = item.parts.map((p) => p.text).join('\n');
      return {
        id: crypto.randomUUID(),
        role,
        content: texto,
        contentType: role === 'assistant' ? 'markdown' : 'text',
        timestamp: new Date(),
      };
    });
  }

  prevPageHistorial(): void { this.currentPageHistorial.update((p) => Math.max(1, p - 1)); }
  nextPageHistorial(): void { this.currentPageHistorial.update((p) => Math.min(this.totalPagesHistorial(), p + 1)); }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  usarPreguntaFrecuente(pregunta: string): void {
    this.inputText.set(pregunta);
    this.showFaqPanel.set(false);
    setTimeout(() => this.messageInput?.nativeElement.focus(), 0);
  }

  clearChat(): void {
    this.messages.set([]);
    this.attachedFiles.set([]);
    this.inputText.set('');
    this.chatService.resetConversacion();
    setTimeout(() => this.startChat(), 100);
  }

  triggerAttachment(): void {
    document.querySelector<HTMLInputElement>('input[type="file"].hidden')?.click();
  }

  onFileAttached(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        this.attachedFiles.update(prev => [...prev, {
          id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type, base64,
        }]);
      };
      reader.readAsDataURL(f);
    });
    (e.target as HTMLInputElement).value = '';
  }

  removeFile(id: string): void {
    this.attachedFiles.update(f => f.filter(x => x.id !== id));
  }

  renderMarkdown(content: string): SafeHtml {
    const html = marked.parse(content, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  maxChartValue(chartData: ChartData): number {
    return Math.max(...chartData.values);
  }

  copyMessage(msg: Message): void {
    navigator.clipboard.writeText(msg.content).then(() => {
      this.copiedId.set(msg.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }

  copyConversationId(): void {
    const id = this.conversationId();
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      this.copiedFolio.set(true);
      setTimeout(() => this.copiedFolio.set(false), 2000);
    });
  }

  downloadDocument(documento?: Documento): void {
    if (!documento) return;
    const byteChars = atob(documento.base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: documento.mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documento.nombre;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try { this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch { }
  }
}

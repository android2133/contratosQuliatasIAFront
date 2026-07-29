import {
  Component, signal, computed, inject, ViewChild, ElementRef,
  AfterViewChecked, OnInit, ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  LucideSend, LucidePaperclip, LucideX, LucideBot, LucideUser,
  LucideFileText, LucideSparkles, LucideRefreshCw, LucideCopy, LucideCheck,
  LucideCircleQuestionMark, LucideMessageCircleQuestion, LucideSettings,
} from '@lucide/angular';
import { Message, AttachedFile, TableData, ChartData } from '../../../core/models/message.model';
import { PreguntaFrecuente } from '../../../core/models/faq.model';
import { ChatService } from '../../../core/services/chat.service';
import { FaqService } from '../../../core/services/faq.service';
import { marked } from 'marked';

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule,
    LucideSend, LucidePaperclip, LucideX, LucideBot, LucideUser,
    LucideFileText, LucideSparkles, LucideRefreshCw, LucideCopy, LucideCheck,
    LucideCircleQuestionMark, LucideMessageCircleQuestion, LucideSettings,
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
          <button (click)="showSettingsPanel.set(!showSettingsPanel())" class="icon-button" type="button"
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
            <input
              [ngModel]="operador()"
              (ngModelChange)="operador.set($event)"
              class="input-base"
              placeholder="Nombre del operador"
              style="margin-bottom: .85rem"
            />

            <label style="display: block; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-secondary); margin-bottom: .3rem">
              Contexto del agente
            </label>
            <textarea
              [ngModel]="instrucciones()"
              (ngModelChange)="instrucciones.set($event)"
              class="input-base"
              rows="6"
              placeholder="Instrucciones del sistema para el agente..."
              style="resize: vertical; font-family: var(--font-family)"
            ></textarea>
          </div>
        }
      </div>

      <!-- Messages -->
      <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
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

  readonly messages = signal<Message[]>([]);
  readonly attachedFiles = signal<AttachedFile[]>([]);
  readonly copiedId = signal<string | null>(null);

  readonly preguntasFrecuentes = signal<PreguntaFrecuente[]>([]);
  readonly showFaqPanel = signal(false);

  readonly conversationId = this.chatService.conversationId;
  readonly operador = this.chatService.operador;
  readonly instrucciones = this.chatService.instrucciones;
  readonly showSettingsPanel = signal(false);
  readonly copiedFolio = signal(false);

  readonly inputText = signal('');
  private shouldScroll = false;

  readonly canSend = computed(() => this.inputText().trim().length > 0);

  ngOnInit(): void {
    this.startChat();
    this.faqService.obtener().subscribe({
      next: (preguntas) => this.preguntasFrecuentes.set(preguntas),
      error: () => this.preguntasFrecuentes.set([]),
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

    this.chatService.send(userInput, contenidos).subscribe({
      next: (res) => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === loadingId
            ? { ...m, content: res.respuesta, contentType: 'markdown', isLoading: false, citas: res.citas }
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
    this.callChatApi('Hola');
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

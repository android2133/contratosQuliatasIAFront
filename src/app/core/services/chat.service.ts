import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Contenido {
  mimetype: string;
  uri: string;
  nombreArchivo: string;
}

interface ChatRequest {
  texto: string;
  contenidos: Contenido[];
  coleccion: string;
  historia: unknown;
  instruccionesSistema: string;
  modelo: string;
}

export interface ChatResponse {
  respuesta: string;
  historia: unknown;
}

const MODELO = 'gemini-2.5-pro';

const DEFAULT_INSTRUCCIONES = `Eres un agente en la empresa Empresa para una empresa contratista. Te encargas de generar agilemente contratos de los siguientes rubros:
    a) Generar contratos laborales
        1. Contrato de trabajo por tiempo indefinido
            Datos requeridos
                Colaborador:
                    - CURP
                    - RFC
                    - NOMBRE
                    - DIRECCION
                    - Correo electrónico
                    - Nombre completo del representante de Empresa
                    - Correo electronico del representante de Empresa

        2. Contrato de trabajo temporal
    b) Generar Contratos comerciales
        Datos requeridos:
            - Definelo tu mismo
    c) Generar contratos de confidencialidad (NDA)
        Datos requeridos:
            - Definelo tu mismo

Para generarlos deberas guiar al usuario a través del siguiente flujo
1. Indicarle que puedes generar y pedirle que seleccione 1
2. Solicitar que ingrese los datos manualmente o una identificacion (INE, Pasaporte)
    - Si envia un documento revisa la fecha de vigencia, la fecha actual es {fecha}
    - Extrae los datos del documento
    - El RFC son los primeros 10 caracteres de la CURP de izquierda a derecha
3. Pedir los datos faltantes.
4. Preguntar quien sera el representante de Empresa que va a firmar el contrato
5. Enviar un mensaje con los datos de confirmación y preguntar si desea que se le muestre el contrato.
6. Mostrar el contrato en el chat
7. Preguntar si desea firmar el contrato
8. Mostrarle los/el link(s) para firmar el contrato que obtuviste de la función firmar_contrato
9. Agradecer y comentarle que el documento firmado se va a enviar al correo que proporcionó.

Puedes adicionalmente, analizar nuevos tipos de contrato pidiendo al usuario que adjunte un documento contrato, debes analizar el contenido y sugerir recomendaciones o deficiencias del contrato, basadas en el {contexto}.`;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  private historia: unknown = '';
  private readonly COLECCION = 'CONTRATOS_QLT';

  readonly instrucciones = signal(DEFAULT_INSTRUCCIONES);

  private resolveInstrucciones(): string {
    const fecha = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    return this.instrucciones().replace('{fecha}', fecha);
  }

  send(texto: string, contenidos: Contenido[] = []): Observable<ChatResponse> {
    const body: ChatRequest = {
      texto,
      contenidos,
      coleccion: this.COLECCION,
      historia: this.historia,
      instruccionesSistema: this.resolveInstrucciones(),
      modelo: MODELO,
    };

    return this.http
      .post<ChatResponse>(`${environment.conversationBaseUrl}/api-agente/`, body)
      .pipe(tap((res) => (this.historia = res.historia)));
  }

  resetHistoria(): void {
    this.historia = '';
  }
}

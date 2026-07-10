import { Injectable, inject } from '@angular/core';
import { Firestore, doc, runTransaction } from '@angular/fire/firestore';
import { Observable, from, catchError, of } from 'rxjs';

const DOC_PATH = 'config/folioChatContador';
const PREFIJO = 'CONV';

interface FolioContador {
  fecha: string;
  consecutivo: number;
}

@Injectable({ providedIn: 'root' })
export class FolioService {
  private readonly firestore = inject(Firestore);

  generarFolio(): Observable<string> {
    const fecha = this.fechaHoy();
    const ref = doc(this.firestore, DOC_PATH);

    const promesa = runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      const previo = snap.exists() ? (snap.data() as FolioContador) : null;
      const consecutivo = previo?.fecha === fecha ? previo.consecutivo + 1 : 1;
      tx.set(ref, { fecha, consecutivo });
      return consecutivo;
    }).then((consecutivo) => this.formatear(fecha, consecutivo));

    return from(promesa).pipe(
      catchError((err) => {
        console.error('[Folio] Error al generar folio, usando folio local:', err);
        return of(this.folioLocalFallback(fecha));
      }),
    );
  }

  private fechaHoy(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private formatear(fecha: string, consecutivo: number): string {
    return `${PREFIJO}-${fecha}-${String(consecutivo).padStart(4, '0')}`;
  }

  private folioLocalFallback(fecha: string): string {
    const sufijo = Date.now().toString().slice(-6);
    return `${PREFIJO}-${fecha}-L${sufijo}`;
  }
}

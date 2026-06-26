import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';

const DOC_PATH = 'config/instrucciones';

@Injectable({ providedIn: 'root' })
export class InstruccionesService {
  private readonly firestore = inject(Firestore);

  cargar(): Observable<string | null> {
    const ref = doc(this.firestore, DOC_PATH);
    return from(getDoc(ref)).pipe(
      map((snap) => (snap.exists() ? (snap.data()['texto'] as string) : null)),
      catchError((err) => {
        console.error('[Instrucciones] Error al cargar:', err);
        return of(null);
      }),
    );
  }

  guardar(texto: string): Observable<void> {
    const ref = doc(this.firestore, DOC_PATH);
    return from(setDoc(ref, { texto, updatedAt: serverTimestamp() })).pipe(
      catchError((err) => {
        console.error('[Instrucciones] Error al guardar:', err);
        throw err;
      }),
    );
  }
}

import { Injectable, inject } from '@angular/core';
import {
  Firestore, doc, setDoc, getDoc, getDocs, collection, query,
  where, serverTimestamp, Timestamp, DocumentData,
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { Conversacion, ConversacionMensaje } from '../models/conversacion.model';

const COLECCION = 'conversacionesChat';

@Injectable({ providedIn: 'root' })
export class ConversacionesService {
  private readonly firestore = inject(Firestore);

  crear(folio: string, operadorId: string, operadorEmail: string, operadorNombre: string): Observable<void> {
    const ref = doc(this.firestore, COLECCION, folio);
    const promesa = setDoc(ref, {
      folio,
      operadorId,
      operadorEmail,
      operadorNombre,
      historia: '[]',
      mensajes: [],
      contratoUrl: null,
      estado: 'activa',
      fechaInicio: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    });
    return from(promesa).pipe(
      catchError((err) => {
        console.error('[Conversaciones] Error al crear conversación:', err);
        return of(void 0);
      }),
    );
  }

  actualizar(
    folio: string,
    historia: string,
    mensajes: ConversacionMensaje[],
    contratoUrl: string | null,
  ): Observable<void> {
    const ref = doc(this.firestore, COLECCION, folio);
    const promesa = setDoc(ref, {
      historia,
      mensajes: this.limpiar(mensajes),
      contratoUrl,
      fechaActualizacion: serverTimestamp(),
    }, { merge: true });
    return from(promesa).pipe(
      catchError((err) => {
        console.error('[Conversaciones] Error al actualizar conversación:', err);
        return of(void 0);
      }),
    );
  }

  obtenerPorFolio(folio: string): Observable<Conversacion | null> {
    const ref = doc(this.firestore, COLECCION, folio);
    return from(getDoc(ref)).pipe(
      map((snap) => (snap.exists() ? this.mapear(snap.data()) : null)),
      catchError((err) => {
        console.error('[Conversaciones] Error al obtener conversación:', err);
        return of(null);
      }),
    );
  }

  listarPorOperador(operadorId: string): Observable<Conversacion[]> {
    const ref = collection(this.firestore, COLECCION);
    const q = query(ref, where('operadorId', '==', operadorId));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => this.mapear(d.data()))
          .sort((a, b) => b.fechaActualizacion.getTime() - a.fechaActualizacion.getTime()),
      ),
      catchError((err) => {
        console.error('[Conversaciones] Error al listar conversaciones:', err);
        return of([]);
      }),
    );
  }

  listarTodas(): Observable<Conversacion[]> {
    const ref = collection(this.firestore, COLECCION);
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => this.mapear(d.data()))
          .sort((a, b) => b.fechaActualizacion.getTime() - a.fechaActualizacion.getTime()),
      ),
      catchError((err) => {
        console.error('[Conversaciones] Error al listar todas las conversaciones:', err);
        return of([]);
      }),
    );
  }

  private mapear(data: DocumentData): Conversacion {
    return {
      folio: data['folio'],
      operadorId: data['operadorId'],
      operadorEmail: data['operadorEmail'],
      operadorNombre: data['operadorNombre'],
      historia: data['historia'] ?? '[]',
      mensajes: data['mensajes'] ?? [],
      contratoUrl: data['contratoUrl'] ?? null,
      estado: data['estado'] ?? 'activa',
      fechaInicio: this.aFecha(data['fechaInicio']),
      fechaActualizacion: this.aFecha(data['fechaActualizacion']),
    };
  }

  private aFecha(valor: Timestamp | Date | undefined): Date {
    if (!valor) return new Date();
    return valor instanceof Timestamp ? valor.toDate() : new Date(valor);
  }

  private limpiar<T>(valor: T): T {
    return JSON.parse(JSON.stringify(valor));
  }
}

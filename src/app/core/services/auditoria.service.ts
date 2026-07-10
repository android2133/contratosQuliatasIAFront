import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, serverTimestamp, DocumentData, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { AuditoriaEntrada, AuditoriaAccion, AuditoriaResultado } from '../models/auditoria.model';

const COLECCION = 'auditoriaAdmin';

export interface RegistrarAuditoria {
  adminId: string;
  adminNombre: string;
  adminEmail: string;
  pantalla: string;
  accion: AuditoriaAccion;
  elemento: string;
  detalleAntes?: string;
  detalleDespues?: string;
  resultado: AuditoriaResultado;
  mensajeError?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly firestore = inject(Firestore);

  registrar(entrada: RegistrarAuditoria): void {
    const ref = collection(this.firestore, COLECCION);
    addDoc(ref, { ...entrada, fecha: serverTimestamp() }).catch((err) => {
      console.error('[Auditoria] Error al registrar evento:', err);
    });
  }

  listar(): Observable<AuditoriaEntrada[]> {
    const ref = collection(this.firestore, COLECCION);
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => this.mapear(d.id, d.data()))
          .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
      ),
      catchError((err) => {
        console.error('[Auditoria] Error al listar eventos:', err);
        return of([]);
      }),
    );
  }

  private mapear(id: string, data: DocumentData): AuditoriaEntrada {
    return {
      id,
      adminId: data['adminId'] ?? '',
      adminNombre: data['adminNombre'] ?? 'Desconocido',
      adminEmail: data['adminEmail'] ?? '',
      pantalla: data['pantalla'] ?? '',
      accion: (data['accion'] as AuditoriaAccion) ?? 'editar',
      elemento: data['elemento'] ?? '',
      detalleAntes: data['detalleAntes'],
      detalleDespues: data['detalleDespues'],
      resultado: (data['resultado'] as AuditoriaResultado) ?? 'exito',
      mensajeError: data['mensajeError'],
      fecha: this.aFecha(data['fecha']),
    };
  }

  private aFecha(valor: Timestamp | Date | undefined): Date {
    if (!valor) return new Date();
    return valor instanceof Timestamp ? valor.toDate() : new Date(valor);
  }
}

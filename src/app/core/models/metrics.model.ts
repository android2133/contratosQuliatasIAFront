export interface VolumenDia {
  fecha: string;
  conversaciones: number;
}

export interface RangoFechas {
  fecha_inicio: string;
  fecha_fin: string;
}

export interface VolumenConversacionesRango {
  rango: RangoFechas;
  total: number;
  volumen_conversaciones: VolumenDia[];
}

export interface MetricasGlobales {
  total_conversaciones: number;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  consultas_realizadas: number;
  tiempo_total: number;
  tiempo_promedio: number;
  volumen_conversaciones: VolumenDia[];
}

export interface MetricasOperador {
  operador: string;
  conversaciones: number;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  consultas: number;
  tiempo_total: number;
}

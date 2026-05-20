/**
 * @file useWeightStatus.ts
 * @description Composable de Vue para calcular de forma reactiva el estado de crecimiento y variación de peso de un bovino.
 * Utiliza un patrón de Estrategia para evaluar el historial de pesajes y retornar el ícono, color y mensaje correspondiente.
 */

import { computed, type Ref } from 'vue';
import { arrowUpOutline, arrowDownOutline, removeOutline } from 'ionicons/icons';
import type { Animal, WeightRecord } from '@/services/interfaces';

/**
 * Define la estructura de una estrategia para evaluar el estado del peso.
 */
interface StatusStrategy {
  condition(history: WeightRecord[]): boolean;
  icon: typeof arrowUpOutline;
  message: string;
}

/**
 * Listado de estrategias aplicables según el historial de pesajes del animal.
 * Determina el crecimiento, estabilidad o pérdida de peso.
 */
const strategies: StatusStrategy[] = [
  {
    condition: (history) => history.length < 2,
    icon: removeOutline,
    message: 'Sin datos suficientes para evaluar'
  },
  {
    condition: (history) => {
      const change = history[history.length - 1].peso - history[0].peso;
      return change > 25;
    },
    icon: arrowUpOutline,
    message: '🚀 Ganancia acelerada'
  },
  {
    condition: (history) => {
      const change = history[history.length - 1].peso - history[0].peso;
      return change > 15;
    },
    icon: arrowUpOutline,
    message: '📈 Crecimiento estable'
  },
  {
    condition: (history) => {
      const change = history[history.length - 1].peso - history[0].peso;
      return change > 0;
    },
    icon: arrowUpOutline,
    message: '✅ Crecimiento moderado'
  },
  {
    condition: (history) => {
      const change = history[history.length - 1].peso - history[0].peso;
      return change === 0;
    },
    icon: removeOutline,
    message: '➡️ Peso estable'
  },
  {
    condition: (history) => {
      const change = history[history.length - 1].peso - history[0].peso;
      return change < 0;
    },
    icon: arrowDownOutline,
    message: '🔻 Pérdida de peso — revisar'
  }
];

/**
 * Obtiene la estrategia más adecuada basada en el historial de pesajes.
 */
function getBestStrategy(history: WeightRecord[]) {
  return strategies.find((strategy) => strategy.condition(history)) ?? strategies[0];
}

/**
 * Hook composable useWeightStatus.
 * Proporciona propiedades computadas reactivas para representar gráficamente
 * el estado, la diferencia de peso entre las últimas dos mediciones y el mensaje informativo.
 * 
 * @param animal Referencia reactiva al objeto del Animal.
 */
export function useWeightStatus(animal: Ref<Animal | null>) {
  // Calcula la diferencia numérica entre el último y el penúltimo pesaje
  const weightDiff = computed(() => {
    if (!animal.value || animal.value.historialPeso.length < 2) return 0;
    const history = animal.value.historialPeso;
    return history[history.length - 1].peso - history[history.length - 2].peso;
  });

  // Retorna el ícono de Ionic representativo del estado del animal
  const diffIcon = computed(() => {
    const history = animal.value?.historialPeso ?? [];
    return getBestStrategy(history).icon;
  });

  // Retorna la diferencia de peso formateada como texto (ej. "+12 kg" o "-5 kg")
  const diffText = computed(() => {
    const diff = weightDiff.value;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff} kg`;
  });

  // Retorna el mensaje textual descriptivo del estado físico general
  const statusMessage = computed(() => {
    const history = animal.value?.historialPeso ?? [];
    return getBestStrategy(history).message;
  });

  return {
    weightDiff,
    diffIcon,
    diffText,
    statusMessage
  };
}


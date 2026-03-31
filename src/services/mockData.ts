import type { Animal, WeightRecord } from './api';

// Cambia esta bandera para alternar entre datos falsos y la API real
export const USE_MOCK = true;

export const mockWeightHistory: WeightRecord[] = [
  { fecha: '2025-10-01', peso: 380 },
  { fecha: '2025-11-01', peso: 400 },
  { fecha: '2025-12-01', peso: 415 },
  { fecha: '2026-01-01', peso: 430 },
  { fecha: '2026-02-01', peso: 445 },
  { fecha: '2026-03-01', peso: 450 },
  { fecha: '2026-04-01', peso: 480 },
  { fecha: '2026-05-01', peso: 510 },
];

export const mockAnimal: Animal = {
  id: 1,
  nombre: 'Luna',
  raza: 'Brahman',
  edad: '3 años',
  arete: 'CR-2024-0412',
  imagen: '',  // Usará un ícono por defecto
  pesoActual: 510,
  historialPeso: mockWeightHistory,
};

export const mockAnimals: Animal[] = [
  mockAnimal,
  {
    id: 2,
    nombre: 'Estrella',
    raza: 'Holstein',
    edad: '2 años',
    arete: 'CR-2024-0587',
    imagen: '',
    pesoActual: 420,
    historialPeso: [
      { fecha: '2026-01-01', peso: 380 },
      { fecha: '2026-02-01', peso: 395 },
      { fecha: '2026-03-01', peso: 410 },
      { fecha: '2026-04-01', peso: 420 },
    ],
  },
  {
    id: 3,
    nombre: 'Tormenta',
    raza: 'Simmental',
    edad: '4 años',
    arete: 'CR-2023-0198',
    imagen: '',
    pesoActual: 580,
    historialPeso: [
      { fecha: '2026-01-01', peso: 560 },
      { fecha: '2026-02-01', peso: 570 },
      { fecha: '2026-03-01', peso: 575 },
      { fecha: '2026-04-01', peso: 580 },
    ],
  },
];

// ── Función auxiliar para simular retraso de la API ──
export function simulateDelay<T>(data: T, ms = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ── Servicio falso que imita la API real ──
export const mockAnimalService = {
  async getAnimalById(id: number): Promise<Animal> {
    const animal = mockAnimals.find((a) => a.id === id);
    if (!animal) throw new Error('Animal no encontrado');
    return simulateDelay({ ...animal });
  },

  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const animal = mockAnimals.find((a) => a.id === animalId);
    if (!animal) throw new Error('Animal no encontrado');
    return simulateDelay([...animal.historialPeso]);
  },

  async getAllAnimals(): Promise<Animal[]> {
    return simulateDelay([...mockAnimals]);
  },
};

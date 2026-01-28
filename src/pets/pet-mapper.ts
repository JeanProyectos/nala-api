/**
 * Mapea las respuestas de Pet para convertir 'species' a 'type'
 * Esto permite que el frontend use 'type' mientras la BD usa 'species'
 */
export function mapPetResponse(pet: any) {
  if (!pet) return pet;

  const { species, ...rest } = pet;
  return {
    ...rest,
    type: species, // Convertir 'species' a 'type' para el frontend
  };
}

export function mapPetsResponse(pets: any[]) {
  return pets.map(mapPetResponse);
}

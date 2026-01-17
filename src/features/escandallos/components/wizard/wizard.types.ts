import type { EscandaloIngrediente as Ingredient, TipoIVA } from '@types';

export interface EscandalloFormData {
    nombre: string;
    pvpConIVA: number;
    tipoIVA: TipoIVA;
    ingredientes: Ingredient[];
    familia: string;
    subfamilia: string;
    descripcion: string;
    notas: string;
    alergenos: string[];
    imagen: string | null;
}

export const INITIAL_FORM_DATA: EscandalloFormData = {
    nombre: '',
    pvpConIVA: 0,
    tipoIVA: 10,
    ingredientes: [],
    familia: '',
    subfamilia: '',
    descripcion: '',
    notas: '',
    alergenos: [],
    imagen: null,
};
